import { formatInTimeZone } from 'date-fns-tz'
import { prisma } from '../../../config/database.js'
import { logger } from '../../utils/logger.js'
import { cleanupTempFile, deleteMedia, uploadMedia } from '../../utils/media.js'
import { envConfig } from '../../../config/env.js'

export const listNotification = async (req, res) => {
    const notifications = await prisma.notification.findMany({
        where: {
            deletedAt: null,
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

    res.render('admin/notification/list', {
        title: 'Notification',
        notifications,
    })
}

export const notificationImageUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No file to upload.',
            })
        }

        const file = req.files[0]

        const result = await uploadMedia(null, 'Notification', file)
        cleanupTempFile(file.path)

        if (!result || !result.url) {
            return res.status(400).json({
                success: false,
                error: 'Failed to upload media file. No URL returned.',
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Image upload successful.',
            url: result.url,
        })
    } catch (error) {
        logger.error('Notification image upload', error)
        if (req.files && req.files[0]?.path) cleanupTempFile(req.files[0].path)

        return res.status(500).json({
            success: false,
            message: 'Server error during image upload.',
        })
    }
}

export const notificationSave = async (req, res) => {
    const { id, caption, description, imageUrl, type, sendNow } = req.body

    const notificationData = {
        brandId: req.session.brandId,
        caption,
        description,
        imageUrl,
        type: type || 'GENERAL',
        // sentAt: sendNow === 'on' ? new Date() : null, // when push notification
        sentAt: new Date(),
    }

    let notification
    // if (id) {
    //     notification = await prisma.notification.update({
    //         where: { id },
    //         data: notificationData,
    //     })
    // } else {
    notification = await prisma.notification.create({
        data: notificationData,
    })
    // }

    // If sendNow is checked, trigger push notification (implement later)
    if (sendNow === 'on') {
        // TODO: Implement push notification logic
        // await sendPushNotification(notification);
    }

    res.json({
        success: true,
        message: `Notification ${id ? 'updated' : 'created'} successfully`,
        notification,
    })
}

export const notificationJson = async (req, res) => {
    try {
        const { start = 0, length = 50, search = {}, type, status } = req.query

        const skip = parseInt(start)
        const take = parseInt(length)
        const searchValue = search.value || ''

        // Build where clause
        const where = {
            deletedAt: null,
            brandId: req.session.brandId,
        }

        // Search filter
        if (searchValue) {
            where.OR = [
                { caption: { contains: searchValue, mode: 'insensitive' } },
                { description: { contains: searchValue, mode: 'insensitive' } },
            ]
        }

        // Type filter
        if (type) {
            where.type = type
        }

        // Status filter (SENT or DRAFT)
        if (status === 'SENT') {
            where.sentAt = { not: null }
        } else if (status === 'DRAFT') {
            where.sentAt = null
        }

        // Get total count
        const totalRecords = await prisma.notification.count({
            where: {
                deletedAt: null,
                brandId: req.session.brandId,
            },
        })

        // Get filtered count
        const filteredRecords = await prisma.notification.count({ where })

        const orderColumnIndex = req.query['order[0][column]']
        const orderDir = req.query['order[0][dir]'] || 'desc'

        const orderColumn =
            req.query[`columns[${orderColumnIndex}][data]`] || 'createdAt'

        const allowedSortFields = ['caption', 'type', 'sentAt', 'createdAt']

        let orderBy = { createdAt: 'desc' }
        if (allowedSortFields.includes(orderColumn)) {
            orderBy = { [orderColumn]: orderDir }
        }

        // Fetch data
        const notifications = await prisma.notification.findMany({
            where,
            orderBy,
            skip,
            take,
        })

        const timeZone =
            req.session.country.timezone || envConfig.general.DEFAULT_TIMEZONE

        const formattedNotification = notifications.map((sub) => ({
            ...sub,
            sentAtDate: formatInTimeZone(
                new Date(sub.sentAt),
                timeZone,
                'dd-MM-yyyy'
            ),
            sentAtTime: formatInTimeZone(
                new Date(sub.sentAt),
                timeZone,
                'HH:mm a'
            ),
        }))

        res.json({
            draw: parseInt(req.query.draw) || 1,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: formattedNotification,
        })
    } catch (error) {
        console.error('Error fetching notifications:', error)
        res.status(500).json({
            error: 'Failed to fetch notifications',
            draw: parseInt(req.query.draw) || 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            data: [],
        })
    }
}
