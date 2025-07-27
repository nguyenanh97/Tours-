require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const app = express();

const rateLimit = require('./middleware/rateLimit');
const helmet = require('helmet');
const mongoSanitinze = require('express-mongo-sanitize');
const hpp = require('hpp');
const sanitizeMiddleware = require('./middleware/xssClean');
const compression = require('compression');
const timeout = require('express-timeout-handler');
const { validationResult } = require('express-validator');
const logger = require('./utils/logger');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRouter');
const bookingRouter = require('./routes/bookingRouter');
const webhookRouter = require('./routes/webhookRouter');

// Router Handler Webhook
app.use('/webhook', webhookRouter);

// -- Global Middleware

// Set security HTTP headers with enhanced configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    referrerPolicy: { policy: 'same-origin' },
  }),
);

// Compression middleware
app.use(compression());

// Timeout handler
app.use(
  timeout.handler({
    timeout: 30000,
    onTimeout: function (req, res) {
      logger.error('Request timeout');
      res.status(503).send('Service unavailable. Please retry.');
    },
  }),
);

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api', rateLimit);

// Body parser with validation middleware
app.use(express.json({ limit: '10kb' }));
app.use((req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
});

// Data Sanitization against NoSQL query injection
app.use(mongoSanitinze());

// XSS protection
app.use(sanitizeMiddleware);

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ['duration', 'difficulty', 'price', 'ratingsAverage'],
    checkBody: true,
    checkQuery: true,
  }),
);

// Serving static files
app.use(express.static(`${__dirname}/public`));

// Request logging middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

///xử lý webhook route cùng express ()raw

// Global error handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Enhanced error handling
app.use((err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    status: err.status,
  });
  globalErrorHandler(err, req, res, next);
});

module.exports = app;
