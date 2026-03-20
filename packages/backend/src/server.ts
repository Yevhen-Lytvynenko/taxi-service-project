import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

import authRoutes from './routes/auth.routes';
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

import { Server } from 'socket.io';

import { SocketService } from './services/socket.service';
import { setSocketService } from './lib/socket';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

export const socketService = new SocketService(io);
setSocketService(socketService);

app.use('/api/auth', authRoutes);
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

app.get('/', (req, res) => {
  res.send('Taxi Service API is running 🚀');
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});