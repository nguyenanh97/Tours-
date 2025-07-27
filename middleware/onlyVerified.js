const AppError = require('../utils/appError');
module.exports = (req, res, next) => {
  if (!req.user || !req.user.verified) {
    return next(
      new AppError('You must verify your email to access this route.', 403),
    );
  }
  next();
};
