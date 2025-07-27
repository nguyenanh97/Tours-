const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const { createBookingFromStripeSession } = require('../services/bookingService');
exports.webhookCheckout = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    // ✅ Xác minh event là từ Stripe gửi đến
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error('❌ Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  // ✅ Lấy dữ liệu session từ event
  const session = event.data.object;

  if (event.type === 'checkout.session.completed') {
    await createBookingFromStripeSession(session);
  }
  res.status(200).json({ received: true });
};
