const express = require('express');
const morgan = require('morgan');
const app = express();

const AppErorr = require('./utils/appError');
const globalErrorHandler = require('./Controllers/errorController');
const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');

//Middlwere
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());
// path html
app.use(express.static(`${__dirname}/public`));
app.use((req, res, next) => {
  console.log('hello middlwere..');
  next();
});
// logger : time
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Route
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Route Err message
app.all('*', (req, res, next) => {
  next(new AppErorr(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);

module.exports = app;
