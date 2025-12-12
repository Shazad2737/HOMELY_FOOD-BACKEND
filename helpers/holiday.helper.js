import { prisma } from '../config/database.js'
import { Enums } from '../src/utils/prismaEnums.js'

export const checkDuplicateHoliday = async (brandId, type, date, dayOfWeek) => {
    if (type === Enums.HolidayType.SPECIFIC_DATE && date) {
        const existingHoliday = await prisma.holiday.findFirst({
            where: {
                brandId,
                type: Enums.HolidayType.SPECIFIC_DATE,
                date: new Date(date),
                isActive: true,
            },
        })

        if (existingHoliday) {
            return `A holiday already exists for ${new Date(
                date
            ).toLocaleDateString()}`
        }
    }

    if (type === Enums.HolidayType.RECURRING_WEEKLY && dayOfWeek) {
        const existingHoliday = await prisma.holiday.findFirst({
            where: {
                brandId,
                type: Enums.HolidayType.RECURRING_WEEKLY,
                dayOfWeek,
                isActive: true,
            },
        })

        if (existingHoliday) {
            return `A recurring holiday already exists for ${dayOfWeek}`
        }
    }

    return null
}
