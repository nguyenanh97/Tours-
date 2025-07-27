const AppError = require('../utils/appError');
module.exports = (minDays = 1, maxDays = 30) => {
  return (req, res, next) => {
    if (!req.body.date) return next(); //không kiểm tra nếu date không hợp lệ

    const bookingDate = new Date(req.body.date);
    const today = new Date();

    // minDate nhỏ nhất là minDays

    const minDate = new Date(today);
    minDate.setDate(today.getDate() + minDays);

    // maxDate lớn nhất là maxDays
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + maxDays);

    // kiểm trả lại
    if (bookingDate < minDate || bookingDate > maxDate) {
      return next(
        new AppError(
          `Tour booking date must be between ${minDays} and ${maxDays} days from today.`,
          400,
        ),
      );
    }
    next();
  };
};
