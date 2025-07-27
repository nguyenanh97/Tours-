const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const filterFields = require('../utils/filterFields');
const { createBookingWithValidation } = require('../utils/bookingUtils');
//kiểm tra quyền sở hữu
const permissions = require('../utils/permissions');

// DELETE
exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) {
      return next(new AppError(`No ${Model.modelName} found with that ID `, 404));
    }

    // Nếu có user → chỉ owner hoặc admin được xoá
    // Nếu không có user → chỉ admin được xoá
    try {
      permissions(doc, req.user);
    } catch (err) {
      return next(err);
    }

    await doc.deleteOne();
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

/// POST

exports.updateOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    const { allowedFields = [], requireOwnership = false } = options;

    // 1. Lọc các trường được phép cập nhật
    if (allowedFields.length > 0) {
      req.body = filterFields(req.body, allowedFields);
    }

    // 2. Tìm tài liệu
    let query = Model.findById(req.params.id);

    if (requireOwnership) query = query.select('+user');
    const doc = await query;
    if (!doc) {
      return next(new AppError(`No ${Model.modelName} found with that ID`, 404));
    }

    // 3. Kiểm tra quyền sở hữu nếu cần (ví dụ Booking, Review)
    if (requireOwnership && doc.user) {
      try {
        permissions(doc, req.user);
      } catch (err) {
        return next(err);
      }
    }
    // 4. Cập nhật
    const updateDoc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: {
        updateDoc,
      },
    });
  });

//  PATCH
exports.createOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    if (Model.modelName === 'Booking') {
      const booking = await createBookingWithValidation({
        data: req.body,
        user: req.user,
        preventDuplicate: Array.isArray(options.preventDuplicate),
      });

      // Gọi callback sau khi tạo thành công (để gửi mail)
      if (typeof options.onCreated === 'function') {
        await options.onCreated(booking, req.user);
      }
      return res.status(201).json({ status: 'success', data: { doc: booking } });
    }

    // Mặc định cho các Model khác
    const doc = await Model.create(req.body);
    res.status(201).json({ status: 'success', data: { doc } });
  });

/// Get
exports.getOne = (Model, optionsPopulate) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (optionsPopulate) query = query.populate(optionsPopulate);
    const doc = await query;
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    try {
      permissions(doc, req.user);
    } catch (err) {
      return next(err); // ✅ Chuyển lỗi vào middleware lỗi của Express
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model, searchField = null, populateOptions = []) =>
  catchAsync(async (req, res, next) => {
    const filter = {};

    // Admin
    const isAdmin = req.user && req.user.role === 'admin';
    // 1. Lọc dữ liệu riêng của user (nếu là Booking)
    if (Model.modelName === 'Booking' && (!req.user || !isAdmin)) {
      filter.user = req.user?._id;
    }

    // 2. Lọc theo nested param như :tourId → { tour: req.params.tourId }
    for (const key in req.params) {
      if (key.endsWith('Id')) {
        const fieldId = key.slice(0, -2);
        filter[fieldId] = req.params[key];
      }
    }

    // Build query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Populate if needed
    populateOptions.forEach(opt => {
      features.query = features.query.populate(opt);
    });
    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs,
      },
    });
  });

/// xử lý các hàm tổng hợp

//
exports.getStats = Model =>
  catchAsync(async (req, res, next) => {
    const stats = await Model.aggregate([
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

//
exports.getMonth = Model =>
  catchAsync(async (req, res, next) => {
    const year = parseInt(req.params.year);
    const plan = await Model.aggregate([
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

/// Test xem có ảnh hưởng đến các chức năng của các Router khác không
