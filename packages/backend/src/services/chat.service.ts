import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class ChatService {
  async create(data: Prisma.ChatCreateInput) {
    return prisma.chat.create({
      data,
      include: {
        order: true
      }
    });
  }

  async findByOrderId(orderId: string) {
    return prisma.chat.findUnique({
      where: { orderId }
    });
  }

  async addMessage(chatId: string, message: any) {
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new Error('Chat not found');

    const currentHistory = chat.history as any[];
    const updatedHistory = [...currentHistory, message];

    return prisma.chat.update({
      where: { id: chatId },
      data: {
        history: updatedHistory
      }
    });
  }

  async delete(id: string) {
    return prisma.chat.delete({
      where: { id }
    });
  }
}