const AppError = require('./appError');
const Booking = require('../models/bookingModel');
exports.createBookingWithValidation = async ({
  data,
  user,
  preventDuplicate = true,
}) => {
  // Gán user nếu chưa có
  if (!data.user && user?.id) {
    data.user = user._id;
  }
  if (user) {
    if (!data.email) data.email = user.email;
    if (!data.customer_name) data.customer_name = user.name || user.customer_name;
  }

  //Kiểm tra ngày
  const bookingDate = new Date(data.date);
  if (!data.date || isNaN(bookingDate.getTime())) {
    throw new AppError('Invalid or missing booking date', 400);
  }

  // Kiểm tra số người tham gia
  if (!data.numberOfGuests || data.numberOfGuests < 1) {
    throw new AppError('Number of guests must be at least 1', 400);
  }

  // Kiểm tra trùng booking
  if (preventDuplicate) {
    const { tour, date } = data;
    if (!user || !tour || !date) {
      throw new AppError('Missing tour, user or date for duplicate check', 400);
    }
    const exists = await Booking.findOne({ tour, user: data.user, date });
    if (exists) {
      throw new AppError('You have already booked this tour on that date', 400);
    }
  }
  //Tạo Booking
  let booking;
  try {
    booking = await Booking.create(data);
  } catch (err) {
    console.error('MongoDB create booking error:', err);
    if (err.code === 11000) {
      throw new AppError('Duplicate booking (database level)', 400);
    }
    throw err;
  }
  return booking;
};
