const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// console.log('✅ MONGO_URI:', process.env.MONGO_URI); // kiểm tra có giá trị không
// console.log('✅ DB_PASSWORD:', process.env.DB_PASSWORD); // kiểm tra có giá trị không

const connectDB = async () => {
  try {
    const DB = process.env.MONGO_URI.replace('<PASSWORD>', process.env.DB_PASSWORD);
    console.log('✅ Full DB connection string:', DB);

    const conn = await mongoose.connect(DB, {});
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err); // Hiện lỗi chi tiết ở đây
    process.exit(1);
  }
};

module.exports = connectDB;
