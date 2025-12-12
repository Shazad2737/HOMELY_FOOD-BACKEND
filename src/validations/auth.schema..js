import Joi from 'joi'

export const authSchema = {
    login: {
        body: Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required(),
        }),
    },
}

export const customerAuthSchema = {
    signUp: {
        body: Joi.object({
            name: Joi.string().trim().required().messages({
                'string.empty': 'Name is required',
            }),

            mobile: Joi.string()
                .pattern(/^\+?[1-9]\d{1,14}$/)
                .required()
                .messages({
                    'string.empty': 'Mobile number is required',
                    'string.pattern.base': 'Invalid mobile number format',
                }),

            password: Joi.string().min(6).required().messages({
                'string.empty': 'Password is required',
                'string.min': 'Password must be at least 6 characters long',
            }),

            confirmPassword: Joi.any()
                .valid(Joi.ref('password'))
                .required()
                .messages({
                    'any.only': 'Passwords do not match',
                    'any.required': 'Confirm password is required',
                }),
        }),
    },

    login: {
        body: Joi.object({
            mobile: Joi.string()
                .pattern(/^\+?[1-9]\d{1,14}$/)
                .required(),
            password: Joi.string().required(),
        }),
    },

    verifyOTP: {
        body: Joi.object({
            mobile: Joi.string()
                .pattern(/^\+?[1-9]\d{1,14}$/)
                .trim()
                .required(),
            otp: Joi.string().trim().required(),
            type: Joi.string()
                .valid('signup', 'resetPassword')
                .default('signup'),
        }),
    },

    forgotPassword: {
        body: Joi.object({
            mobile: Joi.string()
                .pattern(/^\+?[1-9]\d{1,14}$/)
                .trim()
                .required()
                .messages({
                    'string.empty': 'Mobile number is required',
                    'string.pattern.base': 'Invalid mobile number format',
                }),
        }),
    },

    resendOTP: {
        body: Joi.object({
            mobile: Joi.string()
                .pattern(/^\+?[1-9]\d{1,14}$/)
                .required()
                .messages({
                    'string.empty': 'Mobile number is required',
                    'string.pattern.base': 'Invalid mobile number format',
                }),
            type: Joi.string()
                .valid('signup', 'resetPassword')
                .default('resetPassword')
                .messages({
                    'any.only': 'Type must be either signup or resetPassword',
                }),
        }),
    },

    resetPassword: {
        body: Joi.object({
            token: Joi.string().required(),
            newPassword: Joi.string().min(6).required(),
        }),
    },
}
