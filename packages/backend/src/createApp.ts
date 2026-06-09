import 'dotenv/config';
import './types/express-augmentation';

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.routes';
import officeRoleRoutes from './routes/officeRole.routes';
import userRoutes from './routes/user.routes';
import driverRoutes from './routes/driver.routes';
import driverSelfRoutes from './routes/driverSelf.routes';
import orderRoutes from './routes/order.routes';
import vehicleRoutes from './routes/vehicle.routes';
import tariffRoutes from './routes/tariff.routes';
import chatRoutes from './routes/chat.routes';
import transactionRoutes from './routes/transaction.routes';
import reviewRoutes from './routes/review.routes';
import locationRoutes from './routes/location.routes';
import employeeRoutes from './routes/employee.routes';
import geocodeRoutes from './routes/geocode.routes';
import routeRoutes from './routes/route.routes';
import emulationRoutes from './routes/emulation.routes';
import analyticsRoutes from './routes/analytics.routes';
import paymentRoutes from './routes/payment.routes';
import contactsRoutes from './routes/contacts.routes';
import savedPlaceRoutes from './routes/savedPlace.routes';
import complaintRoutes from './routes/complaint.routes';
import auditLogRoutes from './routes/auditLog.routes';
import driverSavedRouteRoutes from './routes/driverSavedRoute.routes';

import { SocketService } from './services/socket.service';
import { setSocketService } from './lib/socket';
import { getCorsOrigin, getSocketIoCorsOrigin } from './config/env';
import { attachRedisAdapterIfConfigured } from './infra/socketRedis';
import { logger } from './lib/logger';

export async function createApp() {
  const app = express();

  app.use(
    cors({
      origin: getCorsOrigin(),
    })
  );
  app.use(express.json());

  app.use((req, _res, next) => {
    logger.debug({ method: req.method, path: req.path });
    next();
  });

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: getSocketIoCorsOrigin(),
      methods: ['GET', 'POST'],
    },
  });

  await attachRedisAdapterIfConfigured(io);

  const socketService = new SocketService(io);
  setSocketService(socketService);

  app.use('/api/auth', authRoutes);
  app.use('/api/office-roles', officeRoleRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/drivers', driverRoutes);
  app.use('/api/driver', driverSelfRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/tariffs', tariffRoutes);
  app.use('/api/chats', chatRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/locations', locationRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/geocode', geocodeRoutes);
  app.use('/api/route', routeRoutes);
  app.use('/api/emulation', emulationRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/contacts', contactsRoutes);
  app.use('/api/saved-places', savedPlaceRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/audit-logs', auditLogRoutes);
  app.use('/api/driver/saved-routes', driverSavedRouteRoutes);

  app.get('/', (_req, res) => {
    res.send('Taxi Service API is running 🚀');
  });

  return { app, httpServer, io, socketService };
}
