require('dotenv').config(); // Đọc biến môi trường

const emailQueue = require('./emailQueue'); // Khởi động processor bên trong

console.log('🚀 Email Worker started. Listening for jobs...');

// Log sự kiện job
emailQueue.on('completed', job => {
  console.log(`✅ Job ${job.id} completed.`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed with error: ${err.message}`);
});
