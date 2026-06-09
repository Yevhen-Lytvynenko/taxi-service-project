import { Server, Socket } from 'socket.io';
import { DriverStatus } from '@prisma/client';
import { clampToOdessaDriveBounds } from '../data/odessa-addresses';
import { prisma } from '../lib/prisma';

function distanceMetersApprox(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

// 2. Типізуємо вхідні дані використовуючи Enum, або рядок, який ми потім перетворимо
interface LocationUpdate {
  driverId: string;
  lat: number;
  lng: number;
  status?: DriverStatus;
  /** When set, ties the GPS point to an active trip for route analytics. */
  orderId?: string;
}

export type GpsSimDriverSyncPayload = {
  driverId: string;
  status: 'ONLINE' | 'BUSY';
  lat?: number;
  lng?: number;
};

export class SocketService {
  private io: Server;
  /** Прореживання записів у БД: сокет і driver_moved лишаються частими. */
  private lastPersistedLocation = new Map<string, { t: number; lat: number; lng: number }>();
  private static readonly LOC_LOG_MIN_INTERVAL_MS = 12_000;
  private static readonly LOC_LOG_MIN_DISTANCE_M = 75;

  constructor(io: Server) {
    this.io = io;
    this.initialize();
  }

  private initialize() {
    this.io.on('connection', (socket: Socket) => {
      
      socket.on('join_room', (room: string) => {
        socket.join(room);
      });

      socket.on('admin_connect', () => {
        socket.join('admin_monitoring');
      });

      socket.on('update_location', async (data: LocationUpdate) => {
        try {
          await this.processLocationUpdate(data);
        } catch (error) {
          console.error(`Error updating location for driver ${data.driverId}:`, error);
        }
      });

      socket.on('send_message', async (data) => {
        const { orderId, text, sender } = data;
        this.io.to(`order_${orderId}`).emit('new_message', { text, sender, time: new Date() });
      });

      socket.on('disconnect', () => {
        // Handle disconnect logic if needed
      });
    });
  }

  public async processLocationUpdate(data: LocationUpdate) {
    const newStatus = data.status || DriverStatus.ONLINE;
    const { lat, lng } = clampToOdessaDriveBounds(data.lat, data.lng);

    let orderId = data.orderId ?? null;
    if (!orderId) {
      const active = await prisma.order.findFirst({
        where: {
          driverId: data.driverId,
          status: { in: ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'] },
        },
        orderBy: { updatedAt: 'desc' },
        select: { id: true },
      });
      orderId = active?.id ?? null;
    }

    const now = Date.now();
    const prev = this.lastPersistedLocation.get(data.driverId);
    let writeLog = true;
    if (prev) {
      const dt = now - prev.t;
      const distM = distanceMetersApprox(prev, { lat, lng });
      writeLog =
        dt >= SocketService.LOC_LOG_MIN_INTERVAL_MS ||
        distM >= SocketService.LOC_LOG_MIN_DISTANCE_M;
    }

    const updatedDriver = await prisma.$transaction(async (tx) => {
      const u = await tx.driverProfile.update({
        where: { id: data.driverId },
        data: {
          currentLat: lat,
          currentLng: lng,
          status: newStatus,
        },
        include: {
          user: true,
          vehicle: true,
        },
      });
      if (writeLog) {
        await tx.locationLog.create({
          data: {
            driverId: data.driverId,
            orderId,
            lat,
            lng,
          },
        });
        this.lastPersistedLocation.set(data.driverId, { t: now, lat, lng });
      }
      return u;
    });

    this.io.to(`driver_tracking_${data.driverId}`).emit('driver_moved', {
      ...data,
      lat,
      lng,
      status: newStatus
    });

    this.io.to('admin_monitoring').emit('admin:driver-update', {
      driverId: data.driverId,
      lat,
      lng,
      status: newStatus.toLowerCase(),
      updatedAt: new Date().toISOString(),
      name: updatedDriver.user.fullName,
      carModel: updatedDriver.vehicle?.model ?? '—'
    });
  }

  public notifyDriverNewOrder(driverId: string, order: any) {
    this.io.to(`driver_${driverId}`).emit('new_order', order);
  }

  public notifyOrderStatus(orderId: string, status: string) {
    this.io.to(`order_${orderId}`).emit('order_status_changed', { status });
  }

  /** Оновлення навігаційної полілінії (ноги поїздки) для клієнта та водія в кімнаті замовлення. */
  public notifyOrderRouteUpdated(
    orderId: string,
    payload: {
      leg: 'TO_PICKUP' | 'TO_DROPOFF';
      /** [lng, lat][] як у БД / Directions */
      coordinates: Array<[number, number]>;
      distanceKm?: number;
      durationMin?: number;
    }
  ) {
    this.io.to(`order_${orderId}`).emit('order_route_updated', payload);
  }

  /** Нове повідомлення в чаті поїздки (history у БД — Json). */
  public notifyOrderChatMessage(
    orderId: string,
    payload: {
      message: { id: string; role: string; text: string; sentAt: string };
      historyLength: number;
    }
  ) {
    this.io.to(`order_${orderId}`).emit('order_chat_message', payload);
  }

  /** Черга водіїв: прибрати замовлення зі списку SEARCHING (скасування клієнтом). */
  public broadcastOrderCancelled(orderId: string) {
    this.io.emit('order_cancelled', { orderId });
  }

  public notifyAdminOrderUpdate(order: any) {
    this.io.to('admin_monitoring').emit('admin:order-update', order);
  }

  /** GPS demo process: keep in-memory driver state aligned (cruise vs order leg). */
  public syncGpsSimulatorDriver(payload: GpsSimDriverSyncPayload) {
    this.io.emit('gps_sim_driver_sync', payload);
  }
}