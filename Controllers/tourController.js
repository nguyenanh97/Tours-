const express = require('express');
const Tour = require('../models/tourModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { multi } = require('../jobs/emailQueue');
const {
  MILES_PER_METER,
  KM_PER_METER,
  EARTH_RADIUS_MILES,
  EARTH_RADIUS_KM,
} = require('../utils/constants');

// heandl tours cheap
exports.getTopcheap = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.fields = 'name,summary,description';
  next();
};

// POST (Create New Tour)
exports.createTour = factory.createOne(Tour);

/// PATCH ID (Update Tour)
exports.updateTour = factory.updateOne(Tour);

// Delete Tour
exports.deleteTour = factory.deleteOne(Tour);

//GET

exports.getAllTours = factory.getAll(Tour);
exports.getTourID = factory.getOne(Tour, { path: 'reviews' });

//  :  thực hiện các phép tính tổng hợp nâng cao của chuy vấn đên db
exports.getTourStats = factory.getStats(Tour);
// GET MONTH
exports.getMonthlyPlan = factory.getMonth(Tour);

//35.03826883498337, 137.1042728287075
exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance: distanceStr, latlng, unit } = req.params;

  // Validate và chuyển đổi distance thành số
  const distance = parseFloat(distanceStr);
  if (isNaN(distance)) {
    return next(new AppError('Distance must be a number', 400));
  }
  // Validate và parse tọa độ
  const [lat, lng] = latlng.split(',').map(coord => parseFloat(coord));

  // Validate phạm vi tọa độ
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return next(
      new AppError(
        'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.',
        400,
      ),
    );
  }

  // Chuyển đổi khoảng cách sang radians
  const radius =
    unit === 'mi' ? distance / EARTH_RADIUS_MILES : distance / EARTH_RADIUS_KM;

  try {
    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        data: tours,
      },
    });
  } catch (error) {
    // Xử lý lỗi cụ thể từ MongoDB Geo queries
    if (error.code === 2) {
      return next(new AppError('Invalid coordinates for geospatial query', 400));
    }
    throw error; // Ném lại lỗi khác để global error handler xử lý
  }
});
exports.getDistancen = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  // Validate và parse tọa độ
  const [lat, lng] = latlng.split(',').map(coord => parseFloat(coord));
  const multiplier = unit === 'mi' ? MILES_PER_METER : KM_PER_METER;
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    { $project: { distance: 1, name: 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    data: distances,
  });
});
