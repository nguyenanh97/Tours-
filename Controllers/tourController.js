const express = require('express');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// heandl tours cheap
exports.getTopcheap = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.fields = 'name,summary,description';
  next();
};

// getAll Tours
exports.getAllTours = catchAsync(async (req, res, next) => {
  // Excute Query
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagintion();
  const tours = await features.query;

  // Respons and()

  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      tours,
    },
  });
});

// POST (Create New Tour)
exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      newTour,
    },
  });
});

// GET Tour ID(Tour id)
exports.getTourID = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id); //short
  // Tour.findOne({_id:req.params.id})
  if (!tour) {
    return next(new Error('No tour found with  that ID ', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});
/// PATCH ID (Update Tour)
exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tour) {
    return next(new AppError('No tour found with  that ID', 404));
  }

  res.status(201).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

// Delete Tour
exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id, {});
  if (!tour) {
    return next(new AppError('No tour found with  that ID ', 404));
  }
  res.status(204).end();
});
//  :  thực hiện các phép tính tổng hợp nâng cao của chuy vấn đên db
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        agvRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// GET MONTH
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = parseInt(req.params.year);
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', // []=>el1,el2
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    //_id => name
    { $addFields: { month: '$_id' } },

    //delete _id
    {
      $project: {
        _id: 0,
      },
    },
    //10--1
    {
      $sort: {
        numTourStarts: -1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    result: plan.length,
    data: {
      plan,
    },
  });
});
