const Joi = require('joi');
const AppError = require('../utils/appError');
// Schema cho việc xác thực tham số khoảng cách
const distanceSchema = Joi.object({
  distance: Joi.number().positive().required().messages({
    'number.base': 'Distance must be a number.',
    'number.positive': 'Distance must be a positive number.',
    'any.required': 'Distance is required.',
  }),
  latlng: Joi.string()
    .pattern(/^\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/)
    .required()
    .messages({
      'string.pattern.base':
        'Invalid latitude and longitude. Format must be "lat,lng".',
      'any.required': 'Latitude and longitude are required.',
    }),
  unit: Joi.string().valid('mi', 'km').required().messages({
    'any.only': 'Units must be "mi" (miles) or "km" (kilometers).',
    'any.required': 'Unit is required.',
  }),
});

// Middleware để xác thực các tham số khoảng cách
exports.validateDistanceParams = (req, res, next) => {
  const { error } = distanceSchema.validate(req.params);

  if (error) {
    // console.log(error); // Bạn có thể bỏ ghi log này trong production
    return next(new AppError(error.details[0].message, 400)); // Lấy thông báo lỗi đầu tiên
  }
  next(); // Nếu không có lỗi, chuyển đến middleware/controller tiếp theo
};
