import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { DriverStatus, CancellationReason, Prisma, Role, CarClass, DeliveryPayer } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { OrderService, type ResolveEndpointsInput, type CreateOrderCoordOpts } from '../services/order.service';
import { OrderSimulationService } from '../services/orderSimulation.service';
import { getSocketService } from '../lib/socket';
import { getPlatformCommissionRate } from '../config/env';
import { computeActualKmForOrder } from '../services/analytics.service';
import { notifyUserOrderStatus } from '../services/push.service';
import { assertOrderAccess } from '../lib/orderAccess';
import { isOfficeRole, isOrderDispatchRole } from '../middleware/authorize.middleware';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { UserContactService } from '../services/userContact.service';
import { ChatService } from '../services/chat.service';

const orderService = new OrderService();
const userContactService = new UserContactService();
const chatService = new ChatService();
const orderSimulationService = new OrderSimulationService();

async function ensureClientUserForDispatch(phone: string, fullName: string): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    if (existing.role !== 'CLIENT') {
      throw new Error('Цей номер вже прив’язаний до облікового запису не-клієнта');
    }
    return existing.id;
  }
  const hash = await bcrypt.hash(randomBytes(24).toString('hex'), 10);
  const u = await prisma.user.create({
    data: {
      phone,
      password: hash,
      fullName: fullName.trim() || 'Клієнт',
      role: 'CLIENT',
    },
  });
  return u.id;
}

const CLIENT_ORDER_PREFS = new Set(['NO_MUSIC', 'QUIET_CHAT', 'AC_ON', 'HELP_LUGGAGE']);

function sanitizeClientPreferences(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is string => typeof p === 'string' && CLIENT_ORDER_PREFS.has(p))
    .slice(0, 12);
}

function parseCancellationReason(raw: unknown): CancellationReason | undefined {
  if (raw == null || raw === '') return undefined;
  const s = String(raw);
  if ((Object.values(CancellationReason) as string[]).includes(s)) {
    return s as CancellationReason;
  }
  return undefined;
}

async function pushOrderStatusToClient(orderId: string, status: string) {
  const o = await prisma.order.findUnique({
    where: { id: orderId },
    include: { client: { select: { pushToken: true } } },
  });
  await notifyUserOrderStatus(o?.client?.pushToken ?? null, status, orderId);
}

export class OrderController {
  /** Оціночна вартість по всіх тарифах (координати або текстові адреси). */
  async quote(req: Request, res: Response) {
    try {
      const clientId = req.user?.id;
      if (!clientId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const body = req.body as {
        pickupLat?: unknown;
        pickupLng?: unknown;
        dropoffLat?: unknown;
        dropoffLng?: unknown;
        pickupAddress?: unknown;
        dropoffAddress?: unknown;
        tariffCodes?: unknown;
      };

      const hasNums =
        typeof body.pickupLat === 'number' &&
        typeof body.pickupLng === 'number' &&
        typeof body.dropoffLat === 'number' &&
        typeof body.dropoffLng === 'number';

      let pickup: { lat: number; lng: number };
      let dropoff: { lat: number; lng: number };

      if (hasNums) {
        pickup = { lat: body.pickupLat as number, lng: body.pickupLng as number };
        dropoff = { lat: body.dropoffLat as number, lng: body.dropoffLng as number };
      } else if (
        typeof body.pickupAddress === 'string' &&
        typeof body.dropoffAddress === 'string' &&
        body.pickupAddress.trim() &&
        body.dropoffAddress.trim()
      ) {
        const resolved = await orderService.resolveOrderEndpoints({
          pickupAddress: body.pickupAddress.trim(),
          dropoffAddress: body.dropoffAddress.trim(),
        });
        pickup = resolved.pickup;
        dropoff = resolved.dropoff;
      } else {
        return res.status(400).json({
          error: 'Надайте pickupLat/pickupLng/dropoffLat/dropoffLng або pickupAddress та dropoffAddress',
        });
      }

      let tariffCodes: CarClass[] | undefined;
      if (Array.isArray(body.tariffCodes)) {
        const allowed = new Set(Object.values(CarClass));
        tariffCodes = body.tariffCodes.filter(
          (c): c is CarClass => typeof c === 'string' && allowed.has(c as CarClass)
        );
      }

      const q = await orderService.quoteTripEndpoints(
        pickup,
        dropoff,
        tariffCodes && tariffCodes.length > 0 ? { tariffCodes } : undefined
      );
      res.json(q);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const clientId = req.user?.id;
      if (!clientId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (isOfficeRole(req.user!.role)) {
        return res.status(403).json({
          error: 'Для ручного прийому замовлень використовуйте POST /orders/dispatch',
        });
      }

      const {
        pickupAddress,
        dropoffAddress,
        paymentMethod,
        promoCode,
        preferredDriverUserId,
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
        tariffName: tariffRaw,
        clientPreferences: prefsRaw,
        deliverySenderName: dsnRaw,
        deliverySenderPhone: dspRaw,
        deliveryRecipientName: drnRaw,
        deliveryRecipientPhone: drpRaw,
        deliveryPayer: dpRaw,
      } = req.body as {
        pickupAddress?: string;
        dropoffAddress?: string;
        paymentMethod?: string;
        promoCode?: string;
        preferredDriverUserId?: string;
        pickupLat?: number;
        pickupLng?: number;
        dropoffLat?: number;
        dropoffLng?: number;
        tariffName?: string;
        clientPreferences?: unknown;
        deliverySenderName?: unknown;
        deliverySenderPhone?: unknown;
        deliveryRecipientName?: unknown;
        deliveryRecipientPhone?: unknown;
        deliveryPayer?: unknown;
      };
      if (!pickupAddress || !dropoffAddress) {
        return res.status(400).json({ error: 'pickupAddress and dropoffAddress are required' });
      }

      let preferredUid: string | undefined;
      if (preferredDriverUserId && typeof preferredDriverUserId === 'string') {
        const fav = await prisma.userContact.findFirst({
          where: {
            ownerId: clientId,
            peerId: preferredDriverUserId,
            kind: 'FAVORITE',
          },
        });
        const peerDriver = await prisma.user.findFirst({
          where: { id: preferredDriverUserId, role: 'DRIVER' },
        });
        if (fav && peerDriver) preferredUid = preferredDriverUserId;
      }

      const rawPm = paymentMethod || 'CASH';
      const pm =
        rawPm === 'CARD' || rawPm === 'BONUS' || rawPm === 'CASH' ? rawPm : 'CASH';

      let tariffName: CarClass | undefined;
      if (typeof tariffRaw === 'string' && (Object.values(CarClass) as string[]).includes(tariffRaw)) {
        tariffName = tariffRaw as CarClass;
      }

      const clientPreferences = sanitizeClientPreferences(prefsRaw);

      const orderInput: ResolveEndpointsInput & CreateOrderCoordOpts = {
        pickupAddress: pickupAddress.trim(),
        dropoffAddress: dropoffAddress.trim(),
        paymentMethod: pm,
        promoCode: promoCode ?? null,
      };
      if (preferredUid) orderInput.preferredDriverUserId = preferredUid;
      if (typeof pickupLat === 'number') orderInput.pickupLat = pickupLat;
      if (typeof pickupLng === 'number') orderInput.pickupLng = pickupLng;
      if (typeof dropoffLat === 'number') orderInput.dropoffLat = dropoffLat;
      if (typeof dropoffLng === 'number') orderInput.dropoffLng = dropoffLng;
      if (tariffName) orderInput.tariffName = tariffName;
      if (clientPreferences.length) orderInput.clientPreferences = clientPreferences;

      let deliveryPayer: DeliveryPayer | undefined;
      if (dpRaw === 'SENDER' || dpRaw === 'RECIPIENT' || dpRaw === 'CLIENT') {
        deliveryPayer = dpRaw as DeliveryPayer;
      }

      if (tariffName === 'DELIVERY') {
        const sn = typeof dsnRaw === 'string' ? dsnRaw.trim() : '';
        const sp = typeof dspRaw === 'string' ? dspRaw.trim() : '';
        const rn = typeof drnRaw === 'string' ? drnRaw.trim() : '';
        const rp = typeof drpRaw === 'string' ? drpRaw.trim() : '';
        if (!sn || !sp || !rn || !rp || !deliveryPayer) {
          return res.status(400).json({
            error:
              'Для доставки вкажіть ім’я та телефон відправника й отримувача, а також хто оплачує поїздку.',
          });
        }
        orderInput.deliverySenderName = sn;
        orderInput.deliverySenderPhone = sp;
        orderInput.deliveryRecipientName = rn;
        orderInput.deliveryRecipientPhone = rp;
        orderInput.deliveryPayer = deliveryPayer;
      }

      const order = await orderService.createFromAddresses(clientId, orderInput);

      const excluded = await userContactService.getExcludedDriverProfileIdsForClient(clientId);
      const exclArr = Array.from(excluded);
      const onlineDrivers = await prisma.driverProfile.findMany({
        where: {
          status: DriverStatus.ONLINE,
          ...(exclArr.length > 0 ? { id: { notIn: exclArr } } : {}),
        },
        select: { id: true, currentLat: true, currentLng: true },
      });

      let targetIds = onlineDrivers.map((d) => d.id);
      if (preferredUid) {
        const prefProf = await prisma.driverProfile.findFirst({
          where: {
            userId: preferredUid,
            verificationStatus: 'APPROVED',
            status: DriverStatus.ONLINE,
          },
          select: { id: true },
        });
        if (prefProf && targetIds.includes(prefProf.id)) {
          targetIds = [prefProf.id];
        }
      }

      const socket = getSocketService();
      const clientRow = order.client;
      const orderPayload = {
        id: order.id,
        pickupAddress: order.pickupAddress,
        pickupLat: order.pickupLat,
        pickupLng: order.pickupLng,
        preferredDriverUserId: order.preferredDriverUserId ?? null,
        dropoffAddress: order.dropoffAddress,
        distanceKm: order.distanceKm,
        totalPrice: String(order.totalPrice),
        status: order.status,
        client: clientRow
          ? {
              id: clientRow.id,
              fullName: clientRow.fullName,
              phone: clientRow.phone,
              rating: clientRow.rating,
            }
          : null,
        createdAt: order.createdAt,
        surgeMultiplier: order.surgeMultiplier,
        plannedRouteDurationMin: order.plannedRouteDurationMin,
      };

      for (const did of targetIds) {
        socket.notifyDriverNewOrder(did, orderPayload);
      }

      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /** Ручне замовлення з панелі (телефон клієнта). */
  async dispatchCreate(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const {
        clientPhone,
        clientFullName,
        pickupAddress,
        dropoffAddress,
        paymentMethod,
        promoCode,
        preferredDriverUserId,
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
        tariffName: tariffRaw,
        dispatcherNotes: notesRaw,
        deliverySenderName: dsnRaw,
        deliverySenderPhone: dspRaw,
        deliveryRecipientName: drnRaw,
        deliveryRecipientPhone: drpRaw,
        deliveryPayer: dpRaw,
      } = req.body as {
        clientPhone?: string;
        clientFullName?: string;
        pickupAddress?: string;
        dropoffAddress?: string;
        paymentMethod?: string;
        promoCode?: string;
        preferredDriverUserId?: string;
        pickupLat?: number;
        pickupLng?: number;
        dropoffLat?: number;
        dropoffLng?: number;
        tariffName?: string;
        dispatcherNotes?: string;
        deliverySenderName?: unknown;
        deliverySenderPhone?: unknown;
        deliveryRecipientName?: unknown;
        deliveryRecipientPhone?: unknown;
        deliveryPayer?: unknown;
      };

      if (!clientPhone || !String(clientPhone).trim()) {
        return res.status(400).json({ error: 'clientPhone is required' });
      }
      if (!pickupAddress || !dropoffAddress) {
        return res.status(400).json({ error: 'pickupAddress and dropoffAddress are required' });
      }

      const clientId = await ensureClientUserForDispatch(
        String(clientPhone).trim(),
        typeof clientFullName === 'string' ? clientFullName : 'Клієнт'
      );

      let preferredUid: string | undefined;
      if (preferredDriverUserId && typeof preferredDriverUserId === 'string') {
        const fav = await prisma.userContact.findFirst({
          where: {
            ownerId: clientId,
            peerId: preferredDriverUserId,
            kind: 'FAVORITE',
          },
        });
        const peerDriver = await prisma.user.findFirst({
          where: { id: preferredDriverUserId, role: 'DRIVER' },
        });
        if (fav && peerDriver) preferredUid = preferredDriverUserId;
      }

      const rawPm = paymentMethod || 'CASH';
      const pm =
        rawPm === 'CARD' || rawPm === 'BONUS' || rawPm === 'CASH' ? rawPm : 'CASH';

      let tariffName: CarClass | undefined;
      if (typeof tariffRaw === 'string' && (Object.values(CarClass) as string[]).includes(tariffRaw)) {
        tariffName = tariffRaw as CarClass;
      }

      const orderInput: ResolveEndpointsInput & CreateOrderCoordOpts = {
        pickupAddress: pickupAddress.trim(),
        dropoffAddress: dropoffAddress.trim(),
        paymentMethod: pm,
        promoCode: promoCode ?? null,
      };
      if (preferredUid) orderInput.preferredDriverUserId = preferredUid;
      if (typeof pickupLat === 'number') orderInput.pickupLat = pickupLat;
      if (typeof pickupLng === 'number') orderInput.pickupLng = pickupLng;
      if (typeof dropoffLat === 'number') orderInput.dropoffLat = dropoffLat;
      if (typeof dropoffLng === 'number') orderInput.dropoffLng = dropoffLng;
      if (tariffName) orderInput.tariffName = tariffName;

      let deliveryPayer: DeliveryPayer | undefined;
      if (dpRaw === 'SENDER' || dpRaw === 'RECIPIENT' || dpRaw === 'CLIENT') {
        deliveryPayer = dpRaw as DeliveryPayer;
      }

      if (tariffName === 'DELIVERY') {
        const sn = typeof dsnRaw === 'string' ? dsnRaw.trim() : '';
        const sp = typeof dspRaw === 'string' ? dspRaw.trim() : '';
        const rn = typeof drnRaw === 'string' ? drnRaw.trim() : '';
        const rp = typeof drpRaw === 'string' ? drpRaw.trim() : '';
        if (!sn || !sp || !rn || !rp || !deliveryPayer) {
          return res.status(400).json({
            error:
              'Для доставки вкажіть ім’я та телефон відправника й отримувача, а також хто оплачує поїздку.',
          });
        }
        orderInput.deliverySenderName = sn;
        orderInput.deliverySenderPhone = sp;
        orderInput.deliveryRecipientName = rn;
        orderInput.deliveryRecipientPhone = rp;
        orderInput.deliveryPayer = deliveryPayer;
      }

      const order = await orderService.createFromAddresses(clientId, orderInput);

      if (typeof notesRaw === 'string' && notesRaw.trim()) {
        await prisma.order.update({
          where: { id: order.id },
          data: { dispatcherNotes: notesRaw.trim() },
        });
      }

      const fullOrder = (await orderService.findById(order.id)) ?? order;

      const excluded = await userContactService.getExcludedDriverProfileIdsForClient(clientId);
      const exclArr = Array.from(excluded);
      const onlineDrivers = await prisma.driverProfile.findMany({
        where: {
          status: DriverStatus.ONLINE,
          ...(exclArr.length > 0 ? { id: { notIn: exclArr } } : {}),
        },
        select: { id: true, currentLat: true, currentLng: true },
      });

      let targetIds = onlineDrivers.map((d) => d.id);
      if (preferredUid) {
        const prefProf = await prisma.driverProfile.findFirst({
          where: {
            userId: preferredUid,
            verificationStatus: 'APPROVED',
            status: DriverStatus.ONLINE,
          },
          select: { id: true },
        });
        if (prefProf && targetIds.includes(prefProf.id)) {
          targetIds = [prefProf.id];
        }
      }

      const socket = getSocketService();
      const clientRow = fullOrder.client;
      const orderPayload = {
        id: fullOrder.id,
        pickupAddress: fullOrder.pickupAddress,
        pickupLat: fullOrder.pickupLat,
        pickupLng: fullOrder.pickupLng,
        preferredDriverUserId: fullOrder.preferredDriverUserId ?? null,
        dropoffAddress: fullOrder.dropoffAddress,
        distanceKm: fullOrder.distanceKm,
        totalPrice: String(fullOrder.totalPrice),
        status: fullOrder.status,
        client: clientRow
          ? {
              id: clientRow.id,
              fullName: clientRow.fullName,
              phone: clientRow.phone,
              rating: clientRow.rating,
            }
          : null,
        createdAt: fullOrder.createdAt,
        surgeMultiplier: fullOrder.surgeMultiplier,
        plannedRouteDurationMin: fullOrder.plannedRouteDurationMin,
      };

      for (const did of targetIds) {
        socket.notifyDriverNewOrder(did, orderPayload);
      }

      res.status(201).json(fullOrder);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const status = req.query.status as string | undefined;
      const driverIdQ = req.query.driverId as string | undefined;

      let orders;
      if (isOfficeRole(user.role)) {
        orders = await orderService.findAll(status, driverIdQ);
      } else if (user.role === 'CLIENT') {
        orders = await orderService.findAllForClient(user.id, status);
      } else if (user.role === 'DRIVER') {
        if (status === 'SEARCHING') {
          orders = await orderService.findAll('SEARCHING', undefined, {
            unassignedOnly: true,
          });
        } else {
          orders = await orderService.findAll(status, user.driverId);
        }
      } else {
        return res.status(403).json({ error: 'Forbidden' });
      }
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      try {
        await assertOrderAccess(req.params.id as string, user);
      } catch (e: any) {
        const code = e.status === 404 ? 404 : 403;
        return res.status(code).json({ error: e.message });
      }
      const order = await orderService.findById(req.params.id as string);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { driverId, status } = req.body;

      if (status === 'ACCEPTED' && driverId) {
        const tokenDriverId = req.user?.driverId;
        const userRole = req.user?.role;
        if (!tokenDriverId && !isOrderDispatchRole(userRole)) {
          return res.status(403).json({ error: 'Only drivers or staff can accept orders' });
        }
        if (tokenDriverId && tokenDriverId !== driverId) {
          return res.status(403).json({ error: 'You can only accept orders for yourself' });
        }
        const existing = await orderService.findById(id);
        if (!existing) return res.status(404).json({ error: 'Order not found' });
        if (existing.status !== 'SEARCHING') {
          return res.status(400).json({ error: 'Order is no longer available' });
        }

        const driver = await prisma.driverProfile.findUnique({
          where: { id: driverId },
          include: { user: true, vehicle: true },
        });
        if (!driver || driver.status !== DriverStatus.ONLINE) {
          return res.status(400).json({ error: 'Driver not available' });
        }
        if (driver.verificationStatus !== 'APPROVED') {
          return res.status(403).json({ error: 'Driver profile is not approved for trips' });
        }

        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id },
            data: {
              driver: { connect: { id: driverId } },
              status: 'ACCEPTED',
            },
          });
          await tx.driverProfile.update({
            where: { id: driverId },
            data: { status: DriverStatus.BUSY },
          });
        });

        await chatService.ensureForOrder(id);

        const fullOrder = await orderService.findById(id);
        if (fullOrder) {
          const socket = getSocketService();
          socket.syncGpsSimulatorDriver({ driverId, status: 'BUSY' });
          socket.notifyAdminOrderUpdate(fullOrder);
          socket.notifyOrderStatus(id, 'ACCEPTED');
          void pushOrderStatusToClient(id, 'ACCEPTED');
          return res.json(fullOrder);
        }
        return res.status(500).json({ error: 'Order not found after update' });
      }

      const existing = await orderService.findById(id);
      if (!existing) return res.status(404).json({ error: 'Order not found' });

      const tokenDriverId = req.user?.driverId;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (status === 'CANCELLED') {
        if (existing.status === 'CANCELLED' || existing.status === 'COMPLETED') {
          return res.status(400).json({ error: 'Order is already finished' });
        }

        let allowed = false;
        if (userRole && isOrderDispatchRole(userRole)) {
          allowed = true;
        } else if (userRole === 'CLIENT' && userId === existing.clientId) {
          allowed = ['SEARCHING', 'ACCEPTED', 'ARRIVED'].includes(existing.status);
        } else if (userRole === 'DRIVER' && tokenDriverId && existing.driverId === tokenDriverId) {
          allowed = ['ACCEPTED', 'ARRIVED'].includes(existing.status);
        }

        if (!allowed) {
          return res.status(403).json({
            error: 'Cannot cancel: check your role or order status (e.g. trip already started).',
          });
        }

        const bodyReason = parseCancellationReason(req.body.cancellationReason);
        const cancellationReason: CancellationReason =
          bodyReason ??
          (userRole === 'CLIENT'
            ? 'CLIENT_REQUEST'
            : userRole === 'DRIVER'
              ? 'DRIVER_REQUEST'
              : isOrderDispatchRole(userRole || '')
                ? 'DISPATCHER_REQUEST'
                : 'OTHER');

        const hadDriverId = existing.driverId;

        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id },
            data: {
              status: 'CANCELLED',
              cancellationReason,
              cancelledByRole: userRole ? (userRole as Role) : null,
            },
          });
          if (hadDriverId) {
            await tx.driverProfile.update({
              where: { id: hadDriverId },
              data: { status: DriverStatus.ONLINE },
            });
          }
        });

        const socket = getSocketService();
        if (hadDriverId) {
          socket.syncGpsSimulatorDriver({ driverId: hadDriverId, status: 'ONLINE' });
        }
        if (existing.status === 'SEARCHING') {
          socket.broadcastOrderCancelled(id);
        }
        const fullOrder = await orderService.findById(id);
        if (fullOrder) {
          socket.notifyAdminOrderUpdate(fullOrder);
        }
        socket.notifyOrderStatus(id, 'CANCELLED');
        void pushOrderStatusToClient(id, 'CANCELLED');
        return res.json(fullOrder);
      }

      if (status === 'ARRIVED') {
        if (!existing.driverId) return res.status(400).json({ error: 'Order has no driver' });
        if (tokenDriverId && tokenDriverId !== existing.driverId) {
          return res.status(403).json({ error: 'Only the driver of this order can set ARRIVED' });
        }
        if (existing.status !== 'ACCEPTED') {
          return res.status(400).json({ error: 'Can only set ARRIVED when status is ACCEPTED' });
        }
        const updated = await orderService.update(id, { status: 'ARRIVED' });
        getSocketService().notifyAdminOrderUpdate(updated);
        getSocketService().notifyOrderStatus(id, 'ARRIVED');
        void pushOrderStatusToClient(id, 'ARRIVED');
        return res.json(updated);
      }

      if (status === 'IN_PROGRESS') {
        if (!existing.driverId) return res.status(400).json({ error: 'Order has no driver' });
        if (tokenDriverId && tokenDriverId !== existing.driverId) {
          return res
            .status(403)
            .json({ error: 'Only the driver of this order can set IN_PROGRESS (client got in)' });
        }
        if (existing.status !== 'ARRIVED') {
          return res
            .status(400)
            .json({ error: 'Can only set IN_PROGRESS when status is ARRIVED (client must be picked up first)' });
        }
        const updated = await orderService.update(id, {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        });
        getSocketService().notifyAdminOrderUpdate(updated);
        getSocketService().notifyOrderStatus(id, 'IN_PROGRESS');
        void pushOrderStatusToClient(id, 'IN_PROGRESS');
        return res.json(updated);
      }

      if (status === 'COMPLETED') {
        if (!existing.driverId) return res.status(400).json({ error: 'Order has no driver' });
        if (tokenDriverId && tokenDriverId !== existing.driverId) {
          return res.status(403).json({ error: 'Only the driver of this order can complete it' });
        }
        if (existing.status !== 'IN_PROGRESS') {
          return res.status(400).json({ error: 'Can only complete when status is IN_PROGRESS' });
        }

        const total = Number(existing.totalPrice);
        const rate = getPlatformCommissionRate();
        const platformFeeNum = Number((total * rate).toFixed(2));
        const driverEarnNum = Number((total - platformFeeNum).toFixed(2));
        const platformFee = new Decimal(platformFeeNum);
        const driverEarn = new Decimal(driverEarnNum);

        let actualKm = await computeActualKmForOrder(id);
        if (!actualKm || actualKm < 0.01) {
          actualKm = existing.plannedRouteDistanceKm ?? existing.distanceKm;
        }

        const existingTx = await prisma.transaction.findFirst({ where: { orderId: id } });

        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id },
            data: {
              status: 'COMPLETED',
              finishedAt: new Date(),
              platformFeeAmount: platformFee,
              driverEarningAmount: driverEarn,
              actualRouteDistanceKm: actualKm,
            },
          });
          await tx.driverProfile.update({
            where: { id: existing.driverId! },
            data: { status: DriverStatus.ONLINE, balance: { increment: driverEarn } },
          });
          if (!existingTx) {
            await tx.transaction.create({
              data: {
                driverId: existing.driverId!,
                orderId: id,
                amount: driverEarn,
                type: 'ORDER_EARNING',
              },
            });
          }
        });

        const fullOrder = await orderService.findById(id);
        if (fullOrder) {
          getSocketService().notifyAdminOrderUpdate(fullOrder);
        }
        getSocketService().notifyOrderStatus(id, 'COMPLETED');
        void pushOrderStatusToClient(id, 'COMPLETED');
        return res.json(fullOrder);
      }

      return res.status(400).json({ error: 'Unsupported status update' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      if (!req.user || !isOrderDispatchRole(req.user.role)) {
        return res.status(403).json({ error: 'Only staff can delete orders' });
      }
      await orderService.delete(req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async selectRoute(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Authentication required' });

      const existing = await orderService.findById(id);
      if (!existing) return res.status(404).json({ error: 'Order not found' });

      const isDriver = user.driverId && user.driverId === existing.driverId;
      if (!isDriver && !isOrderDispatchRole(user.role)) {
        return res.status(403).json({ error: 'Only the assigned driver or staff can select route' });
      }

      const { coordinates, distanceKm, durationMin, leg: legRaw } = req.body as {
        coordinates?: unknown;
        distanceKm?: number;
        durationMin?: number;
        leg?: string;
      };

      const leg = legRaw === 'TO_DROPOFF' ? 'TO_DROPOFF' : 'TO_PICKUP';

      if (!Array.isArray(coordinates) || coordinates.length < 2) {
        return res.status(400).json({ error: 'coordinates must be an array of [lng,lat] with at least 2 points' });
      }

      if (leg === 'TO_PICKUP' && existing.status !== 'ACCEPTED') {
        return res.status(400).json({ error: 'TO_PICKUP route only when order is ACCEPTED' });
      }
      if (leg === 'TO_DROPOFF' && existing.status !== 'ARRIVED' && existing.status !== 'IN_PROGRESS') {
        return res
          .status(400)
          .json({ error: 'TO_DROPOFF route only when order is ARRIVED or IN_PROGRESS' });
      }

      const coordsJson = coordinates as Prisma.InputJsonValue;
      const patch: Prisma.OrderUpdateInput = {
        ...(leg === 'TO_PICKUP'
          ? { navigationRouteToPickup: coordsJson }
          : { navigationRouteToDropoff: coordsJson }),
        ...(typeof distanceKm === 'number' ? { plannedRouteDistanceKm: distanceKm } : {}),
        ...(typeof durationMin === 'number' ? { plannedRouteDurationMin: durationMin } : {}),
      };

      await orderService.update(id, patch);
      const full = await orderService.findById(id);
      if (!full) return res.status(404).json({ error: 'Order not found' });

      const socket = getSocketService();
      socket.notifyOrderRouteUpdated(id, {
        leg,
        coordinates: coordinates as Array<[number, number]>,
        ...(typeof distanceKm === 'number' ? { distanceKm } : {}),
        ...(typeof durationMin === 'number' ? { durationMin } : {}),
      });
      socket.notifyAdminOrderUpdate(full);

      if (process.env.AUTO_ORDER_SIM === 'true' && leg === 'TO_PICKUP') {
        void orderSimulationService.run(id).catch((err) => {
          logger.error({ err }, '[order] auto simulation after pickup route');
        });
      }

      return res.json(full);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async simulate(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const id = req.params.id as string;
      const existing = await orderService.findById(id);
      if (!existing) return res.status(404).json({ error: 'Order not found' });

      const userRole = req.user?.role;
      const userDriverId = req.user?.driverId;
      const isStaff = userRole && isOrderDispatchRole(userRole);
      const isAssignedDriver = existing.driverId && userDriverId === existing.driverId;
      if (!isStaff && !isAssignedDriver) {
        return res.status(403).json({ error: 'Only staff or the assigned driver can start simulation' });
      }

      const st = existing.status;
      if (st !== 'ACCEPTED' && st !== 'ARRIVED' && st !== 'IN_PROGRESS') {
        return res.status(400).json({
          error: `Order status must be ACCEPTED, ARRIVED, or IN_PROGRESS. Current: ${st}`,
        });
      }

      orderSimulationService.run(id).catch((err) => {
        logger.error({ err }, '[order-simulate]');
      });

      res.status(202).json({ message: 'Simulation started' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
