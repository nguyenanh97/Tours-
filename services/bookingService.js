const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const emailQueue = require('../jobs/emailQueue');
const { sendBookingConfirmation } = require('../jobs/handlers/bookingEmailHandler');
exports.createBookingFromStripeSession = async session => {
  try {
    const metadata = session.metadata;

    const tourId = metadata.tourId;
    const userId = metadata.userId;
    const date = new Date(metadata.date);
    const numberOfGuests = parseInt(metadata.numberOfGuests);

    const email = session.customer_email;
    const paymentIntentId = session.payment_intent;
    const amount = session.amount_total / 100;

    // ✅ Tìm user theo userId (đảm bảo chính xác hơn theo metadata)

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found from metadata.userId');

    // trống chùng booking
    const existing = await Booking.findOne({
      tour: tourId,
      user: user._id,
      date,
      status: { $in: ['pending', 'paid', 'confirmed'] },
    });
    if (existing) {
      throw new Error(
        'You have already booked this tour. Repayment is not possible.',
      );
    }

    // create Booking => DB

    const booking = await Booking.create({
      //paymentIntentId,::
      tour: tourId,
      user: user._id,
      customer_name: user.name,
      email: email,
      price: amount,
      date: date,
      numberOfGuests,
      paymentIntentId,

      status: 'confirmed',
    });
    console.log('✅ Booking successfully created:', booking);
    await sendBookingConfirmation(booking);
  } catch (err) {
    console.error('❌ Stripe booking error:', err);
  }
};
