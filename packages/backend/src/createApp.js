"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
require("dotenv/config");
require("./types/express-augmentation");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const officeRole_routes_1 = __importDefault(require("./routes/officeRole.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const driver_routes_1 = __importDefault(require("./routes/driver.routes"));
const driverSelf_routes_1 = __importDefault(require("./routes/driverSelf.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const vehicle_routes_1 = __importDefault(require("./routes/vehicle.routes"));
const tariff_routes_1 = __importDefault(require("./routes/tariff.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
const geocode_routes_1 = __importDefault(require("./routes/geocode.routes"));
const route_routes_1 = __importDefault(require("./routes/route.routes"));
const emulation_routes_1 = __importDefault(require("./routes/emulation.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const contacts_routes_1 = __importDefault(require("./routes/contacts.routes"));
const savedPlace_routes_1 = __importDefault(require("./routes/savedPlace.routes"));
const complaint_routes_1 = __importDefault(require("./routes/complaint.routes"));
const auditLog_routes_1 = __importDefault(require("./routes/auditLog.routes"));
const driverSavedRoute_routes_1 = __importDefault(require("./routes/driverSavedRoute.routes"));
const socket_service_1 = require("./services/socket.service");
const socket_1 = require("./lib/socket");
const env_1 = require("./config/env");
const socketRedis_1 = require("./infra/socketRedis");
const logger_1 = require("./lib/logger");
async function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: (0, env_1.getCorsOrigin)(),
    }));
    app.use(express_1.default.json());
    app.use((req, _res, next) => {
        logger_1.logger.debug({ method: req.method, path: req.path });
        next();
    });
    const httpServer = http_1.default.createServer(app);
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: (0, env_1.getSocketIoCorsOrigin)(),
            methods: ['GET', 'POST'],
        },
    });
    await (0, socketRedis_1.attachRedisAdapterIfConfigured)(io);
    const socketService = new socket_service_1.SocketService(io);
    (0, socket_1.setSocketService)(socketService);
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/office-roles', officeRole_routes_1.default);
    app.use('/api/users', user_routes_1.default);
    app.use('/api/drivers', driver_routes_1.default);
    app.use('/api/driver', driverSelf_routes_1.default);
    app.use('/api/orders', order_routes_1.default);
    app.use('/api/vehicles', vehicle_routes_1.default);
    app.use('/api/tariffs', tariff_routes_1.default);
    app.use('/api/chats', chat_routes_1.default);
    app.use('/api/transactions', transaction_routes_1.default);
    app.use('/api/reviews', review_routes_1.default);
    app.use('/api/locations', location_routes_1.default);
    app.use('/api/employees', employee_routes_1.default);
    app.use('/api/geocode', geocode_routes_1.default);
    app.use('/api/route', route_routes_1.default);
    app.use('/api/emulation', emulation_routes_1.default);
    app.use('/api/analytics', analytics_routes_1.default);
    app.use('/api/payments', payment_routes_1.default);
    app.use('/api/contacts', contacts_routes_1.default);
    app.use('/api/saved-places', savedPlace_routes_1.default);
    app.use('/api/complaints', complaint_routes_1.default);
    app.use('/api/audit-logs', auditLog_routes_1.default);
    app.use('/api/driver/saved-routes', driverSavedRoute_routes_1.default);
    app.get('/', (_req, res) => {
        res.send('Taxi Service API is running 🚀');
    });
    return { app, httpServer, io, socketService };
}
//# sourceMappingURL=createApp.js.map