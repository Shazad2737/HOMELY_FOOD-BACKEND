import { prisma } from '../../../config/database.js'
import { apiResponse } from '../../utils/responseHandler.js'

export const getAllLocationsByCountry = async (req, res) => {
    const locations = await prisma.location.findMany({
        where: { countryId: req.country.id, isActive: true },
        orderBy: { name: 'asc' },
    })

    return apiResponse.success(res, 'Locations fetched successfully', locations)
}

export const getAllAreaByLocation = async (req, res) => {
    const locationId = req.params.locationId

    const areas = await prisma.area.findMany({
        where: { locationId, isActive: true },
        orderBy: { name: 'asc' },
    })

    return apiResponse.success(res, 'Areas fetched successfully', areas)
}

export const getLocationFormBanners = async (req, res) => {
    const brandId = req.brand.id

    const banner = await prisma.banner.findFirst({
        where: {
            brandId,
            placement: 'LOCATION_FORM',
            isActive: true,
        },
        orderBy: { sortOrder: 'asc' },
        select: {
            id: true,
            title: true,
            description: true,
            placement: true,
            sortOrder: true,
            images: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
                select: {
                    id: true,
                    imageUrl: true,
                    redirectUrl: true,
                    caption: true,
                    sortOrder: true,
                },
            },
        },
    })

    return apiResponse.success(
        res,
        'Location banner fetched successfully',
        banner
    )
}
