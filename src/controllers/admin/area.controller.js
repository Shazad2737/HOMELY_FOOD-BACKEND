import { prisma } from '../../../config/database.js'

export const listAreas = async (req, res) => {
    res.render('admin/area/list', {
        title: 'Areas',
        user: req.user,
    })
}

export const addAreaPage = async (req, res) => {
    const locations = await prisma.location.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    })

    res.render('admin/area/form', {
        title: 'Add Area',
        user: req.user,
        locations,
    })
}

export const editAreaPage = async (req, res) => {
    const { id } = req.params

    const [area, locations] = await Promise.all([
        prisma.area.findUnique({
            where: { id },
            include: { location: true },
        }),
        prisma.location.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        }),
    ])

    if (!area) {
        return res.status(404).render('error', { error: 'Area not found' })
    }

    res.render('admin/area/form', {
        title: 'Edit Area',
        user: req.user,
        area,
        locations,
    })
}

export const getAreasJson = async (req, res) => {
    const {
        start = 0,
        length = 50,
        'order[0][column]': orderColumn = 0,
        'order[0][dir]': orderDir = 'asc',
        locationId,
        status,
    } = req.query

    const skip = parseInt(start)
    const take = parseInt(length)

    // Build where clause
    const where = {}

    if (locationId) {
        where.locationId = locationId
    }

    if (status === 'active') {
        where.isActive = true
    } else if (status === 'inactive') {
        where.isActive = false
    }

    // Order mapping
    const orderByMap = {
        0: { name: orderDir },
        1: { location: { name: orderDir } },
        3: { isActive: orderDir },
        4: { users: { _count: orderDir } },
    }

    const orderBy = orderByMap[orderColumn] || { name: 'asc' }

    // Get total count and areas
    const [totalRecords, filteredRecords, areas] = await Promise.all([
        prisma.area.count(),
        prisma.area.count({ where }),
        prisma.area.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                location: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        CustomerLocation: true,
                    },
                },
            },
        }),
    ])

    res.json({
        draw: parseInt(req.query.draw || 1),
        recordsTotal: totalRecords,
        recordsFiltered: filteredRecords,
        data: areas,
    })
}

export const getLocations = async (req, res) => {
    const locations = await prisma.location.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
        },
        orderBy: { name: 'asc' },
    })

    res.json({
        success: true,
        locations,
    })
}

export const saveArea = async (req, res) => {
    const { id, name, locationId, latitude, longitude } = req.body

    if (!name || !locationId) {
        return res.status(400).json({
            success: false,
            message: 'Area name and location are required',
        })
    }

    const location = await prisma.location.findUnique({
        where: { id: locationId },
    })

    if (!location) {
        return res.status(400).json({
            success: false,
            message: 'Invalid location selected',
        })
    }

    if (id) {
        const existingArea = await prisma.area.findUnique({ where: { id } })
        if (!existingArea) {
            return res.status(404).json({
                success: false,
                error: 'Area not found',
            })
        }

        const duplicateArea = await prisma.area.findFirst({
            where: {
                name: { equals: name.trim(), mode: 'insensitive' },
                locationId,
                id: { not: id },
            },
        })

        if (duplicateArea) {
            return res.status(400).json({
                success: false,
                error: 'Area already exists in this location',
            })
        }

        const area = await prisma.area.update({
            where: { id },
            data: {
                name: name.trim(),
                locationId,
                latitude: latitude?.trim() || null,
                longitude: longitude?.trim() || null,
            },
        })

        return res.json({
            success: true,
            message: 'Area updated successfully',
            area,
        })
    }

    const existingArea = await prisma.area.findFirst({
        where: {
            name: { equals: name.trim(), mode: 'insensitive' },
            locationId,
        },
    })

    if (existingArea) {
        return res.status(400).json({
            success: false,
            error: 'Area already exists in this location',
        })
    }

    const area = await prisma.area.create({
        data: {
            name: name.trim(),
            locationId,
            latitude: latitude?.trim() || null,
            longitude: longitude?.trim() || null,
        },
    })

    return res.json({
        success: true,
        message: 'Area created successfully',
        area,
    })
}

export const toggleAreaStatus = async (req, res) => {
    const { id } = req.params

    const area = await prisma.area.findUnique({
        where: { id },
    })

    if (!area) {
        return res.status(404).json({
            success: false,
            message: 'Area not found',
        })
    }

    const updatedArea = await prisma.area.update({
        where: { id },
        data: {
            isActive: !area.isActive,
        },
    })

    res.json({
        success: true,
        message: `Area ${
            updatedArea.isActive ? 'activated' : 'deactivated'
        } successfully`,
        area: updatedArea,
    })
}

export const deleteArea = async (req, res) => {
    const { id } = req.params

    const area = await prisma.area.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    CustomerLocation: true,
                },
            },
        },
    })

    if (!area) {
        return res.status(404).json({
            success: false,
            message: 'Area not found',
        })
    }

    if (area._count.CustomerLocation > 0) {
        return res.status(400).json({
            success: false,
            message: `Cannot delete area. ${area._count.CustomerLocation} user(s) are associated with this area.`,
        })
    }

    await prisma.area.delete({
        where: { id },
    })

    res.json({
        success: true,
        message: 'Area deleted successfully',
    })
}
