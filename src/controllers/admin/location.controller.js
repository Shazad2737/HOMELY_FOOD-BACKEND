import { prisma } from '../../../config/database.js'

export const listLocations = async (req, res) => {
    res.render('admin/location/list')
}

export const addLocationPage = async (req, res) => {
    const countries = await prisma.country.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    })

    res.render('admin/location/form', {
        title: 'Add Location',
        countries,
    })
}

export const editLocationPage = async (req, res) => {
    const { id } = req.params

    const [location, countries] = await Promise.all([
        prisma.location.findUnique({
            where: { id },
            include: { country: true },
        }),
        prisma.country.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        }),
    ])

    res.render('admin/location/form', {
        title: 'Edit Location',
        location,
        countries,
    })
}

export const getLocationsJson = async (req, res) => {
    const {
        start = 0,
        length = 50,
        'order[0][column]': orderColumn = 0,
        'order[0][dir]': orderDir = 'asc',
        status,
    } = req.query

    const skip = parseInt(start)
    const take = parseInt(length)

    // Build where clause
    const where = {}

    if (status === 'active') {
        where.isActive = true
    } else if (status === 'inactive') {
        where.isActive = false
    }

    // Order mapping
    const orderByMap = {
        0: { name: orderDir },
        1: { code: orderDir },
        2: { country: { name: orderDir } },
        4: { isActive: orderDir },
    }

    const orderBy = orderByMap[orderColumn] || { name: 'asc' }

    // Get total count and locations
    const [totalRecords, filteredRecords, locations] = await Promise.all([
        prisma.location.count(),
        prisma.location.count({ where }),
        prisma.location.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                _count: {
                    select: {
                        areas: true,
                        CustomerLocation: true,
                        brands: true,
                    },
                },
            },
        }),
    ])

    res.json({
        draw: parseInt(req.query.draw || 1),
        recordsTotal: totalRecords,
        recordsFiltered: filteredRecords,
        data: locations,
    })
}

export const saveLocation = async (req, res) => {
    const { id, name, code, countryId, latitude, longitude } = req.body

    if (!name || !code || !countryId) {
        return res.status(400).json({
            success: false,
            message: 'Location name, code, and country are required',
        })
    }

    const country = await prisma.country.findUnique({
        where: { id: countryId },
    })

    if (!country) {
        return res.status(400).json({
            success: false,
            message: 'Invalid country selected',
        })
    }

    if (id) {
        const existingLocation = await prisma.location.findUnique({
            where: { id },
        })

        if (!existingLocation) {
            return res.status(404).json({
                success: false,
                error: 'Location not found',
            })
        }

        // Check duplicate name in same country
        const duplicateByName = await prisma.location.findFirst({
            where: {
                name: { equals: name.trim(), mode: 'insensitive' },
                countryId,
                id: { not: id },
            },
        })

        if (duplicateByName) {
            return res.status(400).json({
                success: false,
                error: 'Location name already exists in this country',
            })
        }

        // Check duplicate code
        const duplicateByCode = await prisma.location.findFirst({
            where: {
                code: {
                    equals: code.trim().toUpperCase(),
                    mode: 'insensitive',
                },
                id: { not: id },
            },
        })

        if (duplicateByCode) {
            return res.status(400).json({
                success: false,
                error: 'Location code already exists',
            })
        }

        const location = await prisma.location.update({
            where: { id },
            data: {
                name: name.trim(),
                code: code.trim().toUpperCase(),
                countryId,
                latitude: latitude?.trim() || null,
                longitude: longitude?.trim() || null,
            },
        })

        return res.json({
            success: true,
            message: 'Location updated successfully',
            location,
        })
    }

    // Check duplicate name in same country
    const existingByName = await prisma.location.findFirst({
        where: {
            name: { equals: name.trim(), mode: 'insensitive' },
            countryId,
        },
    })

    if (existingByName) {
        return res.status(400).json({
            success: false,
            error: 'Location name already exists in this country',
        })
    }

    // Check duplicate code
    const existingByCode = await prisma.location.findUnique({
        where: {
            code: code.trim().toUpperCase(),
        },
    })

    if (existingByCode) {
        return res.status(400).json({
            success: false,
            error: 'Location code already exists',
        })
    }

    const location = await prisma.location.create({
        data: {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            countryId,
            latitude: latitude?.trim() || null,
            longitude: longitude?.trim() || null,
        },
    })

    return res.json({
        success: true,
        message: 'Location created successfully',
        location,
    })
}

export const toggleLocationStatus = async (req, res) => {
    const { id } = req.params

    const location = await prisma.location.findUnique({
        where: { id },
    })

    if (!location) {
        return res.status(404).json({
            success: false,
            message: 'Location not found',
        })
    }

    const updatedLocation = await prisma.location.update({
        where: { id },
        data: {
            isActive: !location.isActive,
        },
    })

    res.json({
        success: true,
        message: `Location ${
            updatedLocation.isActive ? 'activated' : 'deactivated'
        } successfully`,
        location: updatedLocation,
    })
}

export const deleteLocation = async (req, res) => {
    const { id } = req.params

    const location = await prisma.location.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    areas: true,
                    CustomerLocation: true,
                    brands: true,
                    availableCategories: true,
                    foodItems: true,
                    admins: true,
                },
            },
        },
    })

    if (!location) {
        return res.status(404).json({
            success: false,
            message: 'Location not found',
        })
    }

    const totalAssociations =
        location._count.areas +
        location._count.CustomerLocation +
        location._count.brands +
        location._count.availableCategories +
        location._count.foodItems +
        location._count.admins

    if (totalAssociations > 0) {
        const details = []
        if (location._count.areas > 0)
            details.push(`${location._count.areas} area(s)`)
        if (location._count.CustomerLocation > 0)
            details.push(`${location._count.CustomerLocation} customer(s)`)
        if (location._count.brands > 0)
            details.push(`${location._count.brands} brand(s)`)
        if (location._count.availableCategories > 0)
            details.push(
                `${location._count.availableCategories} category mapping(s)`
            )
        if (location._count.foodItems > 0)
            details.push(`${location._count.foodItems} food item(s)`)
        if (location._count.admins > 0)
            details.push(`${location._count.admins} admin(s)`)

        return res.status(400).json({
            success: false,
            message: `Cannot delete location. It has ${details.join(
                ', '
            )} associated with it.`,
        })
    }

    await prisma.location.delete({
        where: { id },
    })

    res.json({
        success: true,
        message: 'Location deleted successfully',
    })
}
