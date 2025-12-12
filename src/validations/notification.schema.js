import Joi from 'joi'

export const notificationSchema = {
    save: {
        body: Joi.object({
            id: Joi.string().trim().allow(null, '').optional(),
            caption: Joi.string().trim().required(),
            description: Joi.string().allow(null, ''),
            imageUrl: Joi.string().uri().allow(null, ''),
            type: Joi.string().default('GENERAL'),
            // locations: Joi.alternatives()
            //     .try(
            //         Joi.array().items(Joi.string().trim()).min(1),
            //         Joi.string().trim()
            //     )
            //     .optional(),
        }),
    },
}
