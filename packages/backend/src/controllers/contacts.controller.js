"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsController = void 0;
const userContact_service_1 = require("../services/userContact.service");
const service = new userContact_service_1.UserContactService();
function parseKind(raw) {
    const s = String(raw || '').toUpperCase();
    if (s === 'FAVORITE' || s === 'BLOCKED')
        return s;
    throw new Error('kind must be FAVORITE or BLOCKED');
}
class ContactsController {
    async list(req, res) {
        try {
            const userId = req.user.id;
            const kindQ = req.query.kind;
            const kind = kindQ ? parseKind(kindQ) : undefined;
            const rows = await service.list(userId, kind);
            res.json(rows);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async add(req, res) {
        try {
            const userId = req.user.id;
            const { peerId, kind: kindRaw } = req.body;
            if (!peerId)
                return res.status(400).json({ error: 'peerId is required' });
            const kind = parseKind(kindRaw);
            const row = await service.add(userId, peerId, kind);
            res.status(201).json(row);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async remove(req, res) {
        try {
            const userId = req.user.id;
            const peerId = req.params.peerId;
            const kind = parseKind(req.query.kind);
            await service.remove(userId, peerId, kind);
            res.status(204).send();
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
}
exports.ContactsController = ContactsController;
//# sourceMappingURL=contacts.controller.js.map