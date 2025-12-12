import { prisma } from '../../../config/database.js'
import { CustomError } from '../../utils/customError.js'
import { apiResponse } from '../../utils/responseHandler.js'

export const getHomePage = async (req, res) => {
    const brandId = req.brand.id
    const customerId = req.user.id

    // === Get customer ===
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { locations: { select: { areaId: true } } },
    })

    if (!customer) {
        throw new CustomError(404, 'Customer not found')
    }

    const customerAreaIds = (customer.locations || [])
        .map((l) => l.areaId)
        .filter(Boolean)

    // Build category where condition conditionally
    const categoryWhere = {
        brandId,
        isActive: true,
        ...(customerAreaIds.length > 0
            ? {
                  CategoryLocation: {
                      some: { areaId: { in: customerAreaIds } },
                  },
              }
            : {}),
    }

    // === Fetch homepage data in parallel ===
    const [banners, categories, unreadNotifications] = await Promise.all([
        // --- BANNERS ---
        prisma.banner.findMany({
            where: {
                brandId,
                isActive: true,
                placement: {
                    in: [
                        'HOME_PAGE_TOP',
                        'HOME_PAGE_MIDDLE_1',
                        'HOME_PAGE_MIDDLE_2',
                        'HOME_PAGE_BOTTOM',
                    ],
                },
            },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                title: true,
                description: true,
                sortOrder: true,
                placement: true,
                images: {
                    select: {
                        id: true,
                        imageUrl: true,
                        redirectUrl: true,
                        caption: true,
                        sortOrder: true,
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        }),

        // --- CATEGORIES ---
        prisma.category.findMany({
            where: categoryWhere,
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                sortOrder: true,
                plans: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                    select: { id: true, name: true },
                },
            },
        }),

        // --- UNREAD NOTIFICATIONS COUNT ---
        prisma.notification.count({
            where: {
                brandId,
                deletedAt: null,
                createdAt: { gte: customer.createdAt },
                OR: [{ customerId: null }, { customerId }], // broadcast or specific
                notificationRead: { none: { customerId } },
            },
        }),
    ])

    const hasUnreadNotifications = unreadNotifications > 0

    return apiResponse.success(res, 'Home page data fetched successfully', {
        banners,
        categories,
        hasUnreadNotifications,
        unreadCount: unreadNotifications,
    })
}
