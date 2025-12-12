import { prisma } from '../../../config/database.js'
import { CustomError } from '../../utils/customError.js'
import { apiResponse } from '../../utils/responseHandler.js'

export const getLatestTerms = async (req, res) => {
    const brandId = req.brand?.id

    const terms = await prisma.brandSettings.findUnique({
        where: { brandId },
        select: {
            termsAndConditions: true,
            privacyPolicy: true,
            updatedAt: true,
        },
    })

    if (!terms || (!terms.termsAndConditions && !terms.privacyPolicy)) {
        throw new CustomError(404, 'No Terms or Privacy Policy found')
    }

    return apiResponse.success(
        res,
        'Latest policy fetched successfully.',
        {
            termsAndConditions: terms.termsAndConditions || null,
            privacyPolicy: terms.privacyPolicy || null,
            updatedAt: terms.updatedAt,
        },
        200
    )
}
