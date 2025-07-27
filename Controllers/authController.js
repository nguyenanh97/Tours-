const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/sendmail');
const hashToken = require('../middleware/hashToken');
const signToken = require('../utils/signToken');
const emailQueue = require('../jobs/emailQueue');

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  // Remove Password
  user.password = undefined;
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

//  MIDDLEWER

// kiểm tra đăng nhập hay không
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  /// phát hành  JWT
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! please log in to get access.', 401),
    );
  }

  // kiểm tra có cùng tải trọng hay không
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // kiểm tra id có còn tồn tại trong db hay không
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does no longer exist.', 401),
    );
  }
  // kiểm tra mk user có thay đổi không
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }
  req.user = currentUser;
  next();
});

// phân quyền
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

// thông tin cá nhân
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// ADMIN CREATE
exports.creatAdmin = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(
      new AppError('You do not have permission to create administrator', 403),
    );
  }
  const newAdmin = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: 'admin',
  });
  createSendToken(newAdmin, 201, res);
});

// USER SIGNUP
exports.userSignup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const token = newUser.createEmailverifyToken();
  await newUser.save({ validateBeforeSave: false });

  const verifyURL = `${req.protocol}://${req.get('host')}/api/v1/users/verifyEmail/${token}`;
  const message = `Click this link to verify your email:\n\n${verifyURL}`;
  console.log('📩 Adding email job to queue...');
  const job = await emailQueue.add({
    to: newUser.email,
    subject: 'Verify your email',
    text: message,
  });

  console.log('✅ Email job added:', job.id);

  createSendToken(newUser, 201, res);
});

// VerifyEmail
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const hashedToken = hashToken(req.params.token);
  const user = await User.findOne({
    verifyToken: hashedToken,
    verifyTokenExpires: { $gt: Date.now() },
  });
  if (!user) return next(new AppError('Token is invalid or has expired', 400));
  user.verified = true;
  user.verifyToken = undefined;
  user.verifyTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });
  createSendToken(user, 200, res);
});

// ResendVerifyEmail
exports.resendVerifyEmail = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError('Email is required', 400));

  const user = await User.findOne({ email });
  if (!user) return next(new AppError('User not found', 404));
  if (user.verified) return next(new AppError('User already verified', 400));

  // Tạo token xác minh mới
  const verifyToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(verifyToken);
  user.verifyToken = hashedToken;
  user.verifyTokenExpires = Date.now() + 10 * 60 * 1000; // 10 phút
  await user.save({ validateBeforeSave: false });

  const verifyURL = `${req.protocol}://${req.get('host')}/api/v1/auth/verifyEmail/${verifyToken}`;

  // Gửi job vào queue
  await emailQueue.add({
    to: user.email,
    subject: 'Re-verify your account OnlyVerified',
    text: `<p>Click on the link to verify your account: <a href=${verifyURL}</a></p>`,
  });
  createSendToken(user, 200, res);
});

// USER LOGIN

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check email, password
  if (!email || !password) {
    return next(new AppError('Please check your email and password again !', 400));
  }
  // check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or Password ', 401));
  }
  //
  createSendToken(user, 201, res);
});

// đôi pass gửi link qua email
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    next(new AppError('There is no user with email address.', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password ? Submit a PATCH requets with your new Password and passwordComfirm to ${resetURL}.\nIf you didn't forget your password ,please ignore this email ! `;

  // email
  try {
    await emailQueue.add({
      to: user.email,
      subject: 'Re-verify your account OnlyVerified',
      text: message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email !',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email . Try again later!', 500),
    );
  }
});

// RESET PASSWORD

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = hashToken(req.params.token);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createSendToken(user, 200, res);
});

// UPDATE PASSWORD
exports.updatePassword = catchAsync(async (req, res, next) => {
  // lấy id người dùng
  const user = await User.findById(req.user.id).select('+password');
  // kiểm tra mk
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('You current password is wrong', 401));
  }
  if (req.body.password !== req.body.passwordConfirm) {
    return next(
      new AppError('New password and authentication password do not match', 400),
    );
  }
  user.password = req.body.password;
  user.passwordConfirm = user.password;
  await user.save();

  //
  createSendToken(user, 200, res);
});

//

exports.recoverAccount = catchAsync(async (req, res, next) => {
  const query = User.findOne({ email: req.body.email }).select('+active');
  query._mongooseOptions.includeInactive = true;
  const user = await query;
  // const user = await User.findOne({ email: req.body.email }).select('+active');
  if (!user || user.active === true) {
    return next(new AppError('Email does not exist or account is active.', 400));
  }

  const restoreToken = user.createRestoreToken();
  await user.save({ validateBeforeSave: false });
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/recoverAccount/${restoreToken}`;
  const message = `If you want to recover your account, please click the link below:\n\n${resetURL}\n\nIf you did not request this, please ignore this email.`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Your password reset token (vaild for 10min)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email !',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email . Try again later!', 500),
    );
  }
});
//
exports.resetAccountToken = catchAsync(async (req, res, next) => {
  const hashedToken = hashToken(req.params.token);
  const userQuery = User.findOne({
    restoreToken: hashedToken,
    restoreTokenExpires: { $gt: Date.now() },
  }).select('+active');

  userQuery._mongooseOptions.includeInactive = true;

  const user = await userQuery;
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.restoreToken = undefined;
  user.restoreTokenExpires = undefined;
  user.active = true;
  await user.save({ validateBeforeSave: false });
  createSendToken(user, 200, res);
});
