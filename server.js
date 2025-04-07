const mongoose = require('mongoose');
const app = require('./app');
const dotenv = require('dotenv');
//config
dotenv.config({ path: './config.env' });
const DB = process.env.MONGO_URI.replace(
  '<PASSWORD>',
  process.env.DB_PASSWORD
);
mongoose.connect(DB, {}).then(() => {
  console.log('DB connection success ful!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on prot ${port}`);
});
