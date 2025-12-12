import { prisma } from '../../../config/database.js'
import { formatDateOnly } from '../../utils/dateHelper.js'
import { Enums } from '../../utils/prismaEnums.js'
import { clearHolidaysCache } from '../../utils/cache.js'

export const getHolidayForm = async (req, res) => {
    const { id } = req.params
    const brandId = req.session.brandId

    let holiday = null

    if (id && id !== 'new') {
        holiday = await prisma.holiday.findFirst({
            where: {
                id,
                brandId,
            },
        })

        if (!holiday) {
            return res.status(404).json({
                error: 'Holiday not found',
            })
        }
    }

    const enums = {
        HolidayType: Object.values(Enums.HolidayType),
        DayOfWeek: Object.values(Enums.DayOfWeek),
    }

    res.render('admin/holiday/form', {
        holiday,
        enums,
        title: holiday ? 'Edit Holiday' : 'Add Holiday',
    })
}

export const saveHoliday = async (req, res) => {
    const brandId = req.session?.brandId

    const value = {
        ...req.body,
        brandId,
        isActive: req.body.isActive === 'true' || req.body.isActive === true,
    }

    const isUpdate = value.id && value.id.trim() !== ''

    let holiday

    if (isUpdate) {
        const existingHoliday = await prisma.holiday.findFirst({
            where: {
                id: value.id,
                brandId: value.brandId,
            },
        })

        if (!existingHoliday) {
            return res.status(404).json({
                success: false,
                error: 'Holiday not found',
            })
        }

        holiday = await prisma.holiday.update({
            where: { id: value.id },
            data: {
                name: value.name,
                description: value.description,
                type: value.type,
                date:
                    value.type === Enums.HolidayType.SPECIFIC_DATE
                        ? new Date(value.date)
                        : null,
                dayOfWeek:
                    value.type === Enums.HolidayType.RECURRING_WEEKLY
                        ? value.dayOfWeek
                        : null,
                isActive: value.isActive,
            },
        })
    } else {
        // const duplicateCheck = await checkDuplicateHoliday(
        //     value.brandId,
        //     value.type,
        //     value.date,
        //     value.dayOfWeek
        // )

        // if (duplicateCheck) {
        //     return res.status(400).json({
        //         success: false,
        //         error: duplicateCheck,
        //     })
        // }

        // Create new holiday
        holiday = await prisma.holiday.create({
            data: {
                name: value.name,
                description: value.description,
                type: value.type,
                date:
                    value.type === Enums.HolidayType.SPECIFIC_DATE
                        ? new Date(value.date)
                        : null,
                dayOfWeek:
                    value.type === Enums.HolidayType.RECURRING_WEEKLY
                        ? value.dayOfWeek
                        : null,
                isActive: value.isActive,
                brandId: value.brandId,
            },
        })
    }

    await clearHolidaysCache(brandId)

    return res.status(201).json({
        success: true,
        message: `Holiday ${isUpdate ? 'updated' : 'created'} successfully`,
        data: holiday,
    })
}

export const renderListPage = async (req, res) => {
    res.render('admin/holiday/list')
}

export const getHolidayJson = async (req, res) => {
    try {
        const { start = 0, length = 50, search } = req.query
        const { type, status } = req.query
        const brandId = req.session.brandId

        const skip = parseInt(start)
        const take = parseInt(length)

        // Build where clause
        const where = { brandId }

        if (type) where.type = type
        if (status) where.isActive = status === 'true'

        if (search?.value) {
            where.OR = [
                { name: { contains: search.value, mode: 'insensitive' } },
                {
                    description: {
                        contains: search.value,
                        mode: 'insensitive',
                    },
                },
            ]
        }

        // Build order by
        let orderBy = { createdAt: 'desc' }

        // Extract order info
        const orderColumnIndex = req.query['order[0][column]']
        const orderDir = req.query['order[0][dir]'] || 'asc'

        const orderColumn = req.query[`columns[${orderColumnIndex}][data]`]

        if (
            orderColumn &&
            ['name', 'type', 'date', 'isActive', 'createdAt'].includes(
                orderColumn
            )
        ) {
            orderBy = { [orderColumn]: orderDir }
        }

        const [holidays, totalRecords] = await Promise.all([
            prisma.holiday.findMany({
                where,
                skip,
                take,
                orderBy,
            }),
            prisma.holiday.count({ where }),
        ])

        const timeZone =
            req.session?.country?.timezone || envConfig.general.DEFAULT_TIMEZONE

        const formattedHolidays = holidays.map((holiday) => ({
            ...holiday,
            date: holiday.date
                ? formatDateOnly(holiday.date, timeZone, 'yyyy-MM-dd')
                : null,
        }))

        return res.json({
            draw: parseInt(req.query.draw) || 1,
            recordsTotal: totalRecords,
            recordsFiltered: totalRecords,
            data: formattedHolidays,
        })
    } catch (error) {
        console.error('Error fetching holiday list:', error)
        res.status(500).json({
            error: 'Failed to fetch holiday list',
        })
    }
}

export const toggleStatus = async (req, res) => {
    const { id } = req.params
    const { isActive } = req.body
    const brandId = req.session.brandId

    const holiday = await prisma.holiday.findFirst({
        where: {
            id: id,
            brandId: brandId,
        },
    })

    if (!holiday) {
        return res.status(404).json({
            success: false,
            error: 'Holiday not found',
        })
    }

    await prisma.holiday.update({
        where: { id: id },
        data: { isActive: isActive },
    })

    await clearHolidaysCache(brandId)

    res.json({
        success: true,
        message: `Holiday ${
            isActive ? 'activated' : 'deactivated'
        } successfully`,
    })
}
