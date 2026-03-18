import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { DriverService } from '../services/driver.service';
import { VehicleService } from '../services/vehicle.service';

const authService = new AuthService();
const userService = new UserService();
const driverService = new DriverService();
const vehicleService = new VehicleService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { username, phone, password } = req.body;
      console.log('[auth] login body:', { username, phone, hasPassword: !!password });
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }
      let result;
      if (username) {
        result = await authService.loginByUsername(username, password);
      } else if (phone) {
        result = await authService.login(phone, password);
      } else {
        return res.status(400).json({ error: 'Username or phone is required' });
      }
      res.json(result);
    } catch (error: any) {
      console.error('[auth] login error:', error.message);
      res.status(401).json({ error: error.message });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { fullName, phone, password } = req.body;
      const user = await userService.create({
        fullName,
        phone,
        password,
        role: 'CLIENT'
      });
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async registerDriver(req: Request, res: Response) {
    try {
      const { fullName, phone, password, licenseNumber, carModel, carNumber, carColor } = req.body;
      if (!fullName || !phone || !password || !licenseNumber) {
        return res.status(400).json({ error: 'fullName, phone, password, and licenseNumber are required' });
      }
      const license = String(licenseNumber).trim();
      const user = await userService.create({
        fullName,
        phone,
        password,
        role: 'DRIVER'
      });
      const driver = await driverService.create({
        user: { connect: { id: user.id } },
        licenseNumber: license
      });
      if (carModel && carNumber) {
        await vehicleService.create({
          driver: { connect: { id: driver.id } },
          model: String(carModel).trim(),
          plateNumber: String(carNumber).trim(),
          color: String(carColor || '').trim() || 'Unknown',
          productionYear: new Date().getFullYear()
        });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMe(req: Request, res: Response) {
    try {
      // @ts-ignore
      const { id } = req.user;
      const user = await authService.getProfile(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}