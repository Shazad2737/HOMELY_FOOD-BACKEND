import Joi from 'joi'
import { Enums } from '../utils/prismaEnums.js'

export const subscriptionSchema = {
    save: {
        body: Joi.object({
            id: Joi.string().allow(null, '').optional(),
            customerId: Joi.string().required().messages({
                'any.required': 'Please choose a customer',
                'string.empty': 'Please choose a customer',
            }),
            startDate: Joi.date().iso().required().messages({
                'any.required': 'Please select a start date',
                'date.base': 'Start date must be a valid date',
                'date.format': 'Start date is required',
            }),

            endDate: Joi.date()
                .iso()
                .greater(Joi.ref('startDate'))
                .required()
                .messages({
                    'any.required': 'Please select an end date',
                    'date.base': 'End date must be a valid date',
                    'date.greater': 'End date must be after the start date',
                    'date.format': 'End date is required',
                }),
            status: Joi.string()
                .valid(...Object.values(Enums.SubscriptionStatus))
                .default(Enums.SubscriptionStatus.ACTIVE),
            mealTypes: Joi.array()
                .items(Joi.string())
                .min(1)
                .required()
                .messages({
                    'array.min': 'At least one meal type must be selected.',
                }),
            planId: Joi.string().required().messages({
                'any.required': 'Please choose a plan',
                'string.empty': 'Please choose a plan',
            }),
            categoryId: Joi.string().required().messages({
                'any.required': 'Please choose a category',
                'string.empty': 'Please choose a category',
            }),
            notes: Joi.string().allow(null, '').optional(),
        }),
    },
}
