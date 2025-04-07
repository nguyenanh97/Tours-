const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../../models/tourModel');
const dotenv = require('dotenv');
//config
dotenv.config({ path: './config.env' });
// DB Altas
const DB = process.env.MONGO_URI.replace('<PASSWORD>', process.env.DB_PASSWORD);
mongoose.connect(DB, {}).then(() => {
  console.log('DB connection success ful!');
});
// Read File
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));
// Import  Data ( --import)
const importDB = async () => {
  try {
    await Tour.create(tours);
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
