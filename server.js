require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

process.on('uncaughtException', err => {
  logger.error('Uncaught Exception:', {
    message: err.message,
    name: err.name,
    stack: err.stack,
  });
  console.error(err);
  console.log('UncaughtException! Shutting Down...');
  process.exit(1);
});

connectDB();

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  logger.info(`App running on port ${port}`);
});

// UnHandled Rejection
process.on('unhandledRejection', err => {
  logger.error('Unhandled Rejection:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  console.log('Unhandled Rejection! Shutting Down...');
  server.close(() => {
    process.exit(1);
  });
});
