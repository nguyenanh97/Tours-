const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorPord = (err, res) => {
  //  client err
  if (err.isOperational) {
    res.status(statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // log err

    console.log('ERROR', err);
    // err programming err
    res.status(500).json({
      status: 'error',
      massage: 'Something went very wrong!',
    });
  }
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'Error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorPord(err, res);
  }
};
