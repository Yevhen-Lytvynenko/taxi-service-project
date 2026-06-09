"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const crypto_1 = require("crypto");
const prisma_1 = require("../lib/prisma");
class ChatService {
    async create(data) {
        return prisma_1.prisma.chat.create({
            data,
            include: {
                order: true,
            },
        });
    }
    /** Створює порожній чат для замовлення, якщо ще немає (один чат на поїздку). */
    async ensureForOrder(orderId) {
        const existing = await prisma_1.prisma.chat.findUnique({ where: { orderId } });
        if (existing)
            return existing;
        return prisma_1.prisma.chat.create({
            data: {
                order: { connect: { id: orderId } },
                history: [],
            },
        });
    }
    async findByOrderId(orderId) {
        return prisma_1.prisma.chat.findUnique({
            where: { orderId },
        });
    }
    async findById(id) {
        return prisma_1.prisma.chat.findUnique({ where: { id } });
    }
    buildMessage(role, text) {
        const trimmed = text.trim();
        if (!trimmed)
            throw new Error('Message text is required');
        if (trimmed.length > 2000)
            throw new Error('Message too long (max 2000 characters)');
        return {
            id: (0, crypto_1.randomUUID)(),
            role,
            text: trimmed,
            sentAt: new Date().toISOString(),
        };
    }
    async addMessage(chatId, message) {
        const chat = await prisma_1.prisma.chat.findUnique({ where: { id: chatId } });
        if (!chat)
            throw new Error('Chat not found');
        const raw = chat.history;
        const currentHistory = Array.isArray(raw)
            ? raw
            : [];
        const updatedHistory = [...currentHistory, message];
        return prisma_1.prisma.chat.update({
            where: { id: chatId },
            data: {
                history: updatedHistory,
            },
        });
    }
    async delete(id) {
        return prisma_1.prisma.chat.delete({
            where: { id }
        });
    }
    /** Адмінка: останні чати з учасниками замовлення. */
    async findRecentForStaff(limit = 300) {
        const lim = Math.min(1000, Math.max(1, limit));
        return prisma_1.prisma.chat.findMany({
            take: lim,
            orderBy: { updatedAt: 'desc' },
            include: {
                order: {
                    select: {
                        id: true,
                        status: true,
                        pickupAddress: true,
                        dropoffAddress: true,
                        client: { select: { id: true, fullName: true, phone: true } },
                        driver: {
                            select: {
                                id: true,
                                user: { select: { fullName: true, phone: true } },
                            },
                        },
                    },
                },
            },
        });
    }
}
exports.ChatService = ChatService;
//# sourceMappingURL=chat.service.js.map