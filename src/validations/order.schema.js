import Joi from 'joi'

const orderItemSchema = Joi.object({
    foodItemId: Joi.string().required(),
    mealTypeId: Joi.string().required(),
    deliveryLocationId: Joi.string().required(),
    notes: Joi.string().optional().allow('', null),
})

export const createOrderSchema = {
    body: Joi.object({
        orderDate: Joi.date().iso().required().messages({
            'date.base': 'orderDate must be a valid date',
            'date.format': 'orderDate must be in ISO format',
        }),
        notes: Joi.string().optional().allow('', null),
        orderItems: Joi.array()
            .items(orderItemSchema)
            .min(1)
            .required()
            .messages({
                'array.min': 'At least one order item is required',
            }),
    }),
}
