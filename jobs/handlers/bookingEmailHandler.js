const Booking = require('../../models/bookingModel');
const emailQueue = require('../emailQueue');
exports.sendBookingConfirmation = async (booking_id, user) => {
  const booking = await Booking.findById(booking_id).populate('tour user');

  if (!booking) {
    throw new Error('Booking not found');
  }

  const emailTo = booking.email || booking.user.email;
  const name = booking.customer_name || user?.name || 'Guest';

  if (!emailTo) {
    throw new Error('Missing "to" field in email job');
  }

  await emailQueue.add({
    to: emailTo,
    subject: 'Confirm Tour Booking Successful',
    text: `Thanks ${name}, you have booked tour "${booking.tour.name}" on ${new Date(
      booking.date,
    ).toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Tokyo',
    })} - for ${booking.numberOfGuests || 1} guest(s).`,
  });
  console.log('✅ Email job added to queue');
};
