const { model } = require('mongoose');
const xssClean = require('xss');
function sanitizeInput(obj) {
  if (typeof obj === 'object' && typeof obj !== null) {
    for (let key in obj) {
      if (typeof key[obj] === 'object') {
        sanitizeInput(obj[key]);
      } else if (typeof obj[key] === 'string') {
        obj[key] = xssClean(obj[key]);
      }
    }
  }
}
const sanitizeMiddleware = (req, res, next) => {
  sanitizeInput(req.body);
  sanitizeInput(req.params);
  sanitizeInput(req.query);
  next();
};
module.exports = sanitizeMiddleware;
