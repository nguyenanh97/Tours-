const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');
const validateBoookingDate = require('../middleware/validateBookingDate');
const paymentController = require('../controllers/paymentController');

// protect All
router.use(authController.protect);
router.post('/checkout-session/:tourId', paymentController.createCheckoutSession);

router
  .route('/')
  .get(
    authController.restrictTo('user', 'admin', 'lead-guide'),
    bookingController.getAllBookings,
  );
// .post(validateBoookingDate(1, 30), bookingController.createBooking);

router
  .route('/:id')
  .get(
    authController.restrictTo('admin', 'lead-guide', 'user'),
    bookingController.getBookingID,
  )
  .patch(
    authController.restrictTo('admin', 'lead-guide', 'user'),
    validateBoookingDate(2, 30),
    bookingController.updateBooking,
  )
  .delete(
    authController.restrictTo('admin', 'lead-guide', 'user'),
    bookingController.deleteBooking,
  );
module.exports = router;
