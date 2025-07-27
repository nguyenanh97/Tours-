const express = require('express');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //Check not to let users reset password here
  if (req.body.password || req.body.passwordComfirm) {
    return next(
      new AppError(
        'This route is not for password updates.Please use /updateMypassword.',
        400,
      ),
    );
  }

  //Filter the search fields you want to update
  const filterdBody = filterObj(req.body, 'name', 'email');

  // update Document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterdBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      update: updatedUser,
    },
  });
});

// Delete Me
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
// GET User
exports.getAllUsers = factory.getAll(User);
exports.getUserID = factory.getOne(User);

//POST (create)
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    messeag: ' This route is not difined! Please use/signup',
  });
};
