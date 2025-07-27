const AppError = require('../utils/appError');
// name :cast DB
const heandlCastErrorDB = err => {
  const message = `Invalid ${err.path} : ${err.value}.`;
  return new AppError(message, 400);
};
//trùng lặp
const heandlDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value :${value} Please use another value ! `;
  return new AppError(message, 400);
};
// xác thực
const heandlValidationErrorDB = err => {
  const validaErrors = Object.values(err.errors).map(val => val.message);

  const message = `Invalid input data.${validaErrors.join('. ')}`;
  return new AppError(message, 400);
};

// JWT Error
const heandlJwtErrorDB = () =>
  new AppError('Invalid Token. Please log in again  ', 401);

// Token Error
const heandlTokenExpiredErrorDB = () =>
  new AppError(' Your token has expired ! Pleas log in again ', 401);

const sendErrorDev = (err, res) => {
  if (res.headersSent) return;

  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //  client err
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // log err

    console.error('ERROR', err);
    // err programming err
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(err);

    if (error.name === 'CastError') error = heandlCastErrorDB(error);
    if (error.code === 11000) error = heandlDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = heandlValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = heandlJwtErrorDB(error);
    if (error.name === 'TokenExpiredError') error = heandlTokenExpiredErrorDB(error);
    sendErrorProd(error, res);
  }
};
