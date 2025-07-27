const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('../routes/reviewRouter');
const validate = require('../middleware/validationMiddleware');

router.use('/:tourId/reviews', reviewRouter);

//router.param('id');
router
  .route('/top-5-cheap')
  .get(tourController.getTopcheap, tourController.getAllTours);
router.route('/tours-stats').get(tourController.getTourStats);
//
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.getMonthlyPlan,
  );

//
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(validate.validateDistanceParams, tourController.getTourWithin);

router
  .route('/distance/:latlng/unit/:unit')
  .get(validate.validateDistanceParams, tourController.getDistancen);

//
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );
//
router
  .route('/:id')
  .get(tourController.getTourID)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = router;
