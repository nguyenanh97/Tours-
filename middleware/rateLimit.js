const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP ,plaese try again in an hour !',
});
module.exports = limiter;
