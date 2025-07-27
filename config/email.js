require('dotenv').config();
const nodemailer = require('nodemailer');

const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: { user: process.env.EMAIL_USERNAME, pass: process.env.EMAIL_PASSWORD },

  // secure: false,
});

// emailTransporter.verify((error, success) => {
//   if (error) {
//     console.error('Email transporter configuration error:', error);
//   } else {
//     console.log('Email transporter is configured and ready.');
//   }
// });
module.exports = emailTransporter;

//# Mac:
//brew services start redis
//# Kiểm tra lại:
//redis-cli ping
