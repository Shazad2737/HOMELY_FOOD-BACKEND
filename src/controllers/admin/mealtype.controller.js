import { prisma } from '../../../config/database.js'

export const getAllMealType = async (req, res) => {
    const mealtype = await prisma.mealType.findMany({
        orderBy: { sortOrder: 'asc' },
    })
    return res.status(200).json({
        success: true,
        data: mealtype,
    })
}
