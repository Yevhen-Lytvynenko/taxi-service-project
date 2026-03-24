import { Server, Socket } from 'socket.io';
import { PrismaClient, DriverStatus } from '@prisma/client'; // 1. Імпортуємо Enum
import { clampToOdessaDriveBounds } from '../data/odessa-addresses';

const prisma = new PrismaClient();

// 2. Типізуємо вхідні дані використовуючи Enum, або рядок, який ми потім перетворимо
interface LocationUpdate {
  driverId: string;
  lat: number;
  lng: number;
  status?: DriverStatus; // Краще використовувати строгий тип тут
}

export class SocketService {
  private io: Server;

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

    const [updatedDriver] = await prisma.$transaction([
      prisma.driverProfile.update({
        where: { id: data.driverId },
        data: {
          currentLat: lat,
          currentLng: lng,
          status: newStatus
        },
        include: {
          user: true,
          vehicle: true
        }
      }),
      prisma.locationLog.create({
        data: {
          driverId: data.driverId,
          lat,
          lng
        }
      })
    ]);

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

  public notifyAdminOrderUpdate(order: any) {
    this.io.to('admin_monitoring').emit('admin:order-update', order);
  }
}