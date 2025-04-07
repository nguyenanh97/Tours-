const express = require('express');
const route = express.Router();
const userControll = require('../Controllers/userController');
route.route('/').get(userControll.getAllUsers).post(userControll.createUser);

route
  .route('/:id')
  .get(userControll.getUserID)
  .patch(userControll.updateUser)
  .delete(userControll.deleteUser);
module.exports = route;
