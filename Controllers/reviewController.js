const express = require('express');
const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

exports.setTourUserId = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
exports.reviewAll = factory.getAll(Review, [
  { path: 'tour', select: 'name' },
  { path: 'user', select: 'name role' },
]);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review, {
  allowedFields: ['review', 'rating'],
  requireOwnership: true,
});
exports.deleteReview = factory.deleteOne(Review);
