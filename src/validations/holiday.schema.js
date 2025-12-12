import Joi from 'joi'
import { Enums } from '../utils/prismaEnums.js'

export const holidaySchema = {
    body: Joi.object({
        id: Joi.string().optional().allow('', null),
        name: Joi.string().required().trim().messages({
            'string.empty': 'Holiday name is required',
        }),
        description: Joi.string().optional().allow('', null),
        type: Joi.string()
            .valid(...Object.values(Enums.HolidayType))
            .required()
            .messages({
                'string.empty': 'Holiday type is required',
            }),
        date: Joi.when('type', {
            is: Enums.HolidayType.SPECIFIC_DATE,
            then: Joi.date().required().messages({
                'date.base':
                    'Valid date is required for specific date holidays',
                'any.required': 'Date is required for specific date holidays',
            }),
            otherwise: Joi.date().optional().allow('', null),
        }),
        dayOfWeek: Joi.when('type', {
            is: Enums.HolidayType.RECURRING_WEEKLY,
            then: Joi.string()
                .valid(...Object.values(Enums.DayOfWeek))
                .required()
                .messages({
                    'any.required':
                        'Day of week is required for recurring weekly holidays',
                    'any.only': 'Invalid day of week',
                }),
            otherwise: Joi.string().optional().allow('', null),
        }),
        isActive: Joi.boolean().optional().default(true),
    })
        .custom((value, helpers) => {
            // Custom validation: Ensure date is null for RECURRING_WEEKLY
            if (
                value.type === Enums.HolidayType.RECURRING_WEEKLY &&
                value.date
            ) {
                return helpers.error('custom.invalidDateForRecurring')
            }
            // Custom validation: Ensure dayOfWeek is null for SPECIFIC_DATE
            if (
                value.type === Enums.HolidayType.SPECIFIC_DATE &&
                value.dayOfWeek
            ) {
                return helpers.error('custom.invalidDayOfWeekForSpecific')
            }
            return value
        })
        .messages({
            'custom.invalidDateForRecurring':
                'Date should not be provided for recurring weekly holidays',
            'custom.invalidDayOfWeekForSpecific':
                'Day of week should not be provided for specific date holidays',
        }),
}
