import Joi from "joi";

export const areaSchema = {
  save: {
    body: Joi.object({
      id: Joi.string().trim().allow(null, ""),
      name: Joi.string().trim().required(),
      locationId: Joi.string().trim().required(),
      latitude: Joi.string().trim().allow(null, ""),
      longitude: Joi.string().trim().allow(null, ""),
    }),
  },
};
