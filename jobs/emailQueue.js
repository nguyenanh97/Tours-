require('dotenv').config(); // Đặt ở đầu!
const Queue = require('bull');
const sendEmail = require('../utils/sendmail');

const emailQueue = new Queue('emailQueue', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

emailQueue.process(async (job, done) => {
  const { to, subject, text } = job.data;
  if (!to) {
    console.error('❌ LỖI: Email người nhận (to) không tồn tại trong job.data');
    console.error('Job data:', job.data); // In đầy đủ để debug
    return done(new Error('Missing "to" field in email job'));
  }

  try {
    await sendEmail({ to, subject, text });
    console.log('✅ Email sent');
    done();
  } catch (err) {
    console.error('❌ Failed to send email:', err);
    done(err);
  }
});
module.exports = emailQueue;
