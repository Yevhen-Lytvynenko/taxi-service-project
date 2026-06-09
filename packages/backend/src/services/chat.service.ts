import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

/** Один запис у полі Chat.history (Json-масив). */
export type TripChatMessageJson = {
  id: string;
  role: 'CLIENT' | 'DRIVER';
  text: string;
  sentAt: string;
};

export class ChatService {
  async create(data: Prisma.ChatCreateInput) {
    return prisma.chat.create({
      data,
      include: {
        order: true,
      },
    });
  }

  /** Створює порожній чат для замовлення, якщо ще немає (один чат на поїздку). */
  async ensureForOrder(orderId: string) {
    const existing = await prisma.chat.findUnique({ where: { orderId } });
    if (existing) return existing;
    return prisma.chat.create({
      data: {
        order: { connect: { id: orderId } },
        history: [],
      },
    });
  }

  async findByOrderId(orderId: string) {
    return prisma.chat.findUnique({
      where: { orderId },
    });
  }

  async findById(id: string) {
    return prisma.chat.findUnique({ where: { id } });
  }

  buildMessage(role: 'CLIENT' | 'DRIVER', text: string): TripChatMessageJson {
    const trimmed = text.trim();
    if (!trimmed) throw new Error('Message text is required');
    if (trimmed.length > 2000) throw new Error('Message too long (max 2000 characters)');
    return {
      id: randomUUID(),
      role,
      text: trimmed,
      sentAt: new Date().toISOString(),
    };
  }

  async addMessage(chatId: string, message: TripChatMessageJson) {
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new Error('Chat not found');

    const raw = chat.history;
    const currentHistory: TripChatMessageJson[] = Array.isArray(raw)
      ? (raw as TripChatMessageJson[])
      : [];
    const updatedHistory = [...currentHistory, message];

    return prisma.chat.update({
      where: { id: chatId },
      data: {
        history: updatedHistory as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async delete(id: string) {
    return prisma.chat.delete({
      where: { id }
    });
  }

  /** Адмінка: останні чати з учасниками замовлення. */
  async findRecentForStaff(limit = 300) {
    const lim = Math.min(1000, Math.max(1, limit));
    return prisma.chat.findMany({
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