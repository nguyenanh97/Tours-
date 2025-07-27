const Booking = require('../models/bookingModel');
const emailQueue = require('../jobs/emailQueue');
const factory = require('./handlerFactory');
const { sendBookingConfirmation } = require('../jobs/handlers/bookingEmailHandler');

//GET

exports.getAllBookings = factory.getAll(Booking, null, ['tour']);

// POST

exports.createBooking = factory.createOne(Booking, {
  preventDuplicate: ['user', 'tour', 'date'],
  duplicateMessage: 'You have already booked this tour for this date',
});

/// PATCH ID (Update Booking)
exports.updateBooking = factory.updateOne(Booking, {
  allowedFields: ['date', 'status', 'tour'],
  requireOwnership: true,
});
exports.getBookingID = factory.getOne(Booking, {
  path: 'tour',
  select: 'name price',
});

// Delete Booking
exports.deleteBooking = factory.deleteOne(Booking);
