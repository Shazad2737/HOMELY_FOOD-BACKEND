import { prisma } from '../../../config/database.js'
import { apiResponse } from '../../utils/responseHandler.js'
import {
    formatDateTime,
    getDayCategory,
    getTimeAgo,
} from '../../utils/dateHelper.js'

export const getNotification = async (req, res) => {
    const { type, page = 1, limit = 20 } = req.query
    const customerId = req.user.id

    const skip = (page - 1) * limit

    const where = {
        brandId: req.user.brandId,
        deletedAt: null,
        sentAt: { not: null },
        OR: [
            { customerId: customerId },
            { customerId: null }, // Broadcast
        ],
    }

    if (type) {
        where.type = type
    }

    const notifications = await prisma.notification.findMany({
        where,
        include: {
            notificationRead: {
                where: { customerId },
                select: { readAt: true },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        skip: parseInt(skip),
        take: parseInt(limit),
    })

    const groupedNotifications = {
        today: [],
        yesterday: [],
        this_week: [],
        this_month: [],
        older: [],
    }

    const timezone = req.country.timezone

    notifications.forEach((notification) => {
        const dayCategory = getDayCategory(notification.createdAt)
        const isRead = notification.notificationRead.length > 0

        const notificationWithTime = {
            id: notification.id,
            caption: notification.caption,
            description: notification.description,
            imageUrl: notification.imageUrl,
            type: notification.type,
            priority: notification.priority,
            actionUrl: notification.actionUrl,
            sentAt: formatDateTime(notification.sentAt, timezone),
            timeAgo: getTimeAgo(notification.createdAt),
            dayCategory,
            isRead,
            readAt: isRead
                ? formatDateTime(
                      notification.notificationRead[0].readAt,
                      timezone
                  )
                : null,
        }

        groupedNotifications[dayCategory].push(notificationWithTime)
    })

    const totalCount = await prisma.notification.count({ where })

    return apiResponse.success(res, 'Notification fetched successfully', {
        grouped: groupedNotifications,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
        },
    })
}

export const readAllNotificaction = async (req, res) => {
    const customerId = req.user.id

    const unreadNotifications = await prisma.notification.findMany({
        where: {
            deletedAt: null,
            sentAt: { not: null },
            OR: [{ customerId: customerId }, { customerId: null }],
            notificationRead: {
                none: {
                    customerId: customerId,
                },
            },
        },
        select: {
            id: true,
        },
    })

    const readRecords = unreadNotifications.map((n) => ({
        notificationId: n.id,
        customerId: customerId,
        readAt: new Date(),
    }))

    if (readRecords.length > 0) {
        await prisma.notificationRead.createMany({
            data: readRecords,
            skipDuplicates: true,
        })
    }

    return apiResponse.success(res, 'All notifications marked as read', {
        count: readRecords.length,
    })
}
