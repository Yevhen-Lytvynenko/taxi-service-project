"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorize_middleware_1 = require("../middleware/authorize.middleware");
const router = (0, express_1.Router)();
const transactionController = new transaction_controller_1.TransactionController();
router.use(auth_middleware_1.authMiddleware);
router.post('/', authorize_middleware_1.requireFinanceStaff, transactionController.create.bind(transactionController));
router.get('/', authorize_middleware_1.requireFinanceStaff, transactionController.getAll.bind(transactionController));
router.get('/driver/:driverId', (0, authorize_middleware_1.requireFinanceStaffOrOwnDriver)('driverId'), transactionController.getByDriver.bind(transactionController));
router.get('/:id', authorize_middleware_1.requireFinanceStaff, transactionController.getOne.bind(transactionController));
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map