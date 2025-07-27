require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Review = require('../models/reviewModel');
const connectDB = require('../config/db');
connectDB()
  .then(async () => {
    console.log('✅ MongoDB connected');

    try {
      await Review.syncIndexes();
      console.log('✅ Review indexes synced successfully!');
    } catch (err) {
      console.error('❌ Error syncing indexes:', err);
    } finally {
      mongoose.connection.close(); // Đóng kết nối sau khi hoàn tất
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err);
  });
