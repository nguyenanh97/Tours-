const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
exports.createCheckoutSession = async ({
  tour,
  userEmail,
  successUrl,
  cancelUrl,
  date,
  numberOfGuests,
  userId,
}) => {
  if (!tour || !userEmail) {
    throw new Error('Missing required parameters for Stripe checkout session');
  }

  if (!tour._id || !userId || !date || !numberOfGuests) {
    throw new Error('Thiếu dữ liệu cần thiết để tạo Stripe session');
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    client_reference_id: tour._id.toString(),
    line_items: [
      {
        price_data: {
          currency: 'usd', // hoặc 'jpy', 'vnd' tùy dự án
          unit_amount: tour.price * 100, // Stripe tính bằng cents
          product_data: {
            name: `${tour.name} Tour`,
          },
        },
        quantity: parseInt(numberOfGuests),
      },
    ],
    metadata: {
      tourId: tour?._id?.toString() || '',
      userId: userId?.toString() || '',
      date: date?.toString() || '',
      numberOfGuests: numberOfGuests?.toString() || '',
    },
  });
  return session;
};
exports.constructWebhookEvent = (payload, signature, webhookSecret) => {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
};
