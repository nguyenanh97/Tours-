const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const stripeService = require('../services/stripeService');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
exports.createCheckoutSession = catchAsync(async (req, res, next) => {
  const { tourId } = req.params;

  if (!tourId) {
    return next(new AppError('Thiếu tourId trong URL.', 400));
  }

  const tour = await Tour.findById(tourId);
  if (!tour) {
    return next(new AppError('Tour not found', 400));
  }
  const existingBooking = await Booking.findOne({
    tour: tourId,
    user: req.user._id,
    status: { $in: ['paid', 'confirmed'] },
  });
  if (existingBooking) {
    return next(
      new AppError(
        'You have already booked this tour. Repayment is not possible.',
        400,
      ),
    );
  }
  const successUrl = `${req.protocol}://${req.get('host')}/success`;
  const cancelUrl = `${req.protocol}://${req.get('host')}/cancel`;

  // Tạo bookingStripe
  const { date, numberOfGuests } = req.body;

  if (!date || isNaN(Date.parse(date))) {
    return next(new AppError('Invalid date.', 400));
  }
  if (!numberOfGuests || numberOfGuests <= 0) {
    return next(new AppError('Invalid number of guests.', 400));
  }

  const session = await stripeService.createCheckoutSession({
    tour,
    userEmail: req.user.email,
    userId: req.user._id,
    date: req.body.date,
    numberOfGuests: req.body.numberOfGuests,
    successUrl,
    cancelUrl,
  });
  // tạo thanh toán

  // ✅ Trả về session để frontend redirect đến Stripe
  res.status(200).json({
    status: 'success',
    session,
  });
});
