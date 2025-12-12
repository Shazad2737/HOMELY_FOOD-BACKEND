import { prisma } from '../../../config/database.js'
import { apiResponse } from '../../utils/responseHandler.js'
import { formatDateOnly } from '../../utils/dateHelper.js'

export const getSubscriptions = async (req, res) => {
    const brandId = req.brand.id
    const customerId = req.user.id

    const subscription = await prisma.customerSubscription.findFirst({
        where: {
            customerId,
            brandId,
            status: 'ACTIVE',
        },
        select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            notes: true,
            createdAt: true,

            plan: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                    // imageUrl: true,
                },
            },

            category: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    // imageUrl: true,
                },
            },

            subscriptionMealTypes: {
                select: {
                    mealType: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        },
                    },
                },
            },
        },
    })

    let subscriptionData = null

    if (subscription) {
        subscriptionData = {
            id: subscription.id,
            status: subscription.status,
            notes: subscription.notes,
            startDate: formatDateOnly(subscription.startDate),
            endDate: formatDateOnly(subscription.endDate),
            createdAt: formatDateOnly(subscription.createdAt),

            plan: subscription.plan,
            category: subscription.category,

            mealTypes: subscription.subscriptionMealTypes.map((sm) => ({
                id: sm.mealType.id,
                name: sm.mealType.name,
                type: sm.mealType.type,
            })),
        }
    }

    const placement = 'SUBSCRIPTION_PAGE'

    const banner = await prisma.banner.findFirst({
        where: { brandId, placement, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
            title: true,
            description: true,
            placement: true,
            images: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
                select: {
                    id: true,
                    imageUrl: true,
                    redirectUrl: true,
                    caption: true,
                },
            },
        },
    })

    return apiResponse.success(res, 'Subscriptions fetched', {
        // mealTypes,
        subscription: subscriptionData,
        banner,
        contact: {
            whatsapp: req.brandSettings.whatsappNumber,
            phone: req.brandSettings.phoneNumber,
        },
    })
}
