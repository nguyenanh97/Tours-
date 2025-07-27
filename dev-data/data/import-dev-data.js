const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');
//config
require('dotenv').config();
// DB Altas
const DB = process.env.MONGO_URI.replace('<PASSWORD>', process.env.DB_PASSWORD);
mongoose.connect(DB, {}).then(() => {
  console.log('DB connection success ful!');
});
// Read File
const tours = JSON.parse(fs.readFileSync(`${__dirname}/japan_tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// Import  Data ( --import)
const importDB = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    // await Review.create(reviews);
    console.log('Data successfully loaded !');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
// All Delete Data()
const deleteDb = async () => {
  try {
    await Tour.deleteMany();
    await Review.deleteMany();
    await User.deleteMany();
    console.log(' Data successfully delete!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
//All:  --import || delete DB
if (process.argv[2] === '--import') {
  importDB();
} else if (process.argv[2] === '--delete') {
  deleteDb();
}
//node ./dev-data/data/import-dev-data.js --delete
//node ./dev-data/data/import-dev-data.js --import
