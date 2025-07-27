const express = require('express');
const reviewControll = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(authController.protect, reviewControll.reviewAll)
  .post(
    authController.restrictTo('user'),
    reviewControll.setTourUserId,
    reviewControll.createReview,
  );

router
  .route('/:id')
  .get(reviewControll.getReview)
  .patch(authController.restrictTo('user', 'admin'), reviewControll.updateReview)
  .delete(authController.restrictTo('user', 'admin'), reviewControll.deleteReview);

module.exports = router;
