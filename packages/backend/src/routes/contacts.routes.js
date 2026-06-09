"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const contacts_controller_1 = require("../controllers/contacts.controller");
const router = (0, express_1.Router)();
const c = new contacts_controller_1.ContactsController();
router.use(auth_middleware_1.authMiddleware);
router.get('/', c.list.bind(c));
router.post('/', c.add.bind(c));
router.delete('/:peerId', c.remove.bind(c));
exports.default = router;
//# sourceMappingURL=contacts.routes.js.map