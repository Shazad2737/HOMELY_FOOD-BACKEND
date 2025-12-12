import { prisma } from '../config/database.js'
import logger from '../src/utils/logger.js'

export async function updateSubscriptionStatus() {
    const now = new Date()

    try {
        logger.info(
            `[${now.toISOString()}] Starting subscription status update`
        )

        const result = await prisma.$transaction(async (tx) => {
            // Step 1: Find active subscriptions that are expiring now
            const expiringSubscriptions =
                await tx.customerSubscription.findMany({
                    where: {
                        status: 'ACTIVE',
                        endDate: {
                            lt: now,
                        },
                    },
                    select: {
                        id: true,
                        customerId: true,
                        brandId: true,
                    },
                })

            // Step 2: Expire these subscriptions
            const expiredSubscriptions =
                await tx.customerSubscription.updateMany({
                    where: {
                        status: 'ACTIVE',
                        endDate: {
                            lt: now,
                        },
                    },
                    data: {
                        status: 'EXPIRED',
                        updatedAt: now,
                    },
                })

            logger.info(
                `[${now.toISOString()}] Updated ${
                    expiredSubscriptions.count
                } subscriptions to EXPIRED`
            )

            let activatedCount = 0

            // Step 3: For each expired subscription, try to activate a pending one
            for (const expiredSub of expiringSubscriptions) {
                const { customerId, brandId } = expiredSub

                // Find the next pending subscription for this customer (earliest start date)
                const nextPendingSubscription =
                    await tx.customerSubscription.findFirst({
                        where: {
                            customerId,
                            brandId,
                            status: 'PENDING',
                            startDate: {
                                lte: now, // Start date should be today or earlier
                            },
                        },
                        orderBy: {
                            startDate: 'asc',
                        },
                    })

                // Only activate if a pending subscription exists
                if (nextPendingSubscription) {
                    await tx.customerSubscription.update({
                        where: {
                            id: nextPendingSubscription.id,
                        },
                        data: {
                            status: 'ACTIVE',
                            updatedAt: now,
                        },
                    })

                    activatedCount++

                    logger.info(
                        `[${now.toISOString()}] Activated pending subscription ${
                            nextPendingSubscription.id
                        } for customer ${customerId} after subscription ${
                            expiredSub.id
                        } expired`
                    )
                }
            }

            logger.info(
                `[${now.toISOString()}] Activated ${activatedCount} pending subscriptions out of ${
                    expiringSubscriptions.length
                } expired subscriptions`
            )

            return {
                expiredCount: expiredSubscriptions.count,
                activatedCount,
            }
        })

        logger.info(
            `[${now.toISOString()}] Subscription status update completed:`,
            result
        )

        return {
            success: true,
            ...result,
            timestamp: now,
        }
    } catch (error) {
        logger.error(
            `[${now.toISOString()}] Error updating subscription statuses:`,
            error
        )
        throw error
    }
}
