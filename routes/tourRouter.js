const express = require('express');
const router = express.Router();
const tourControll = require('../Controllers/tourController');

//router.param('id');

router.route('/top-5-cheap').get(tourControll.getTopcheap, tourControll.getAllTours);
router.route('/tours-stats').get(tourControll.getTourStats);
router.route('/monthly-plan/:year').get(tourControll.getMonthlyPlan);
router.route('/').get(tourControll.getAllTours).post(tourControll.createTour);

router
  .route('/:id')
  .get(tourControll.getTourID)
  .patch(tourControll.updateTour)
  .delete(tourControll.deleteTour);
module.exports = router;
