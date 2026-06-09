import { prisma } from '../lib/prisma';

async function refreshUserRating(subjectUserId: string) {
  const agg = await prisma.review.aggregate({
    where: { subjectUserId },
    _avg: { rating: true },
    _count: { id: true },
  });
  const avg = agg._avg.rating;
  const next = avg != null && agg._count.id > 0 ? Math.round(avg * 100) / 100 : 5;
  await prisma.user.update({
    where: { id: subjectUserId },
    data: { rating: next },
  });
}

export class ReviewService {
  /** Клієнт оцінює водія після завершеного замовлення. */
  async createClientReview(
    clientUserId: string,
    orderId: string,
    rating: number,
    comment?: string | null
  ) {
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new Error('Рейтинг 1–5');
    }
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        driver: { include: { user: true } },
      },
    });
    if (!order) throw new Error('Замовлення не знайдено');
    if (order.clientId !== clientUserId) throw new Error('Це не ваше замовлення');
    if (order.status !== 'COMPLETED') throw new Error('Оцінити можна лише завершене замовлення');
    if (!order.driverId || !order.driver?.user?.id) throw new Error('У замовлення немає водія');

    const existing = await prisma.review.findUnique({
      where: { orderId_authorId: { orderId, authorId: clientUserId } },
    });
    if (existing) throw new Error('Ви вже залишили відгук');

    const review = await prisma.review.create({
      data: {
        orderId,
        authorId: clientUserId,
        driverId: order.driverId,
        subjectUserId: order.driver.user.id,
        rating,
        comment: comment?.trim() || null,
      },
      include: {
        author: true,
        driver: true,
        subject: { select: { id: true, fullName: true } },
      },
    });
    await refreshUserRating(order.driver.user.id);
    return review;
  }

  /** Водій оцінює клієнта. */
  async createDriverReview(
    driverUserId: string,
    driverProfileId: string,
    orderId: string,
    rating: number,
    comment?: string | null
  ) {
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new Error('Рейтинг 1–5');
    }
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { client: true },
    });
    if (!order) throw new Error('Замовлення не знайдено');
    if (order.driverId !== driverProfileId) throw new Error('Це не ваше замовлення');
    if (order.status !== 'COMPLETED') throw new Error('Оцінити можна лише завершене замовлення');

    const existing = await prisma.review.findUnique({
      where: { orderId_authorId: { orderId, authorId: driverUserId } },
    });
    if (existing) throw new Error('Ви вже залишили відгук');

    const review = await prisma.review.create({
      data: {
        orderId,
        authorId: driverUserId,
        driverId: null,
        subjectUserId: order.clientId,
        rating,
        comment: comment?.trim() || null,
      },
      include: {
        author: true,
        subject: { select: { id: true, fullName: true } },
      },
    });
    await refreshUserRating(order.clientId);
    return review;
  }

  async findAll() {
    return prisma.review.findMany({
      include: {
        author: true,
        driver: { include: { user: { select: { fullName: true } } } },
        subject: { select: { fullName: true, phone: true } },
        order: { select: { id: true, pickupAddress: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySubjectUserId(subjectUserId: string) {
    return prisma.review.findMany({
      where: { subjectUserId },
      include: {
        author: { select: { id: true, fullName: true, role: true } },
        order: { select: { id: true, pickupAddress: true, dropoffAddress: true, finishedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDriverId(driverId: string) {
    return prisma.review.findMany({
      where: { driverId },
      include: {
        author: true,
        subject: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string) {
    const r = await prisma.review.findUnique({ where: { id }, select: { subjectUserId: true } });
    await prisma.review.delete({ where: { id } });
    if (r?.subjectUserId) await refreshUserRating(r.subjectUserId);
  }
}
