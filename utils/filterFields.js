module.exports = function (obj, allowedFields = []) {
  const filter = {};
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) {
      filter[key] = obj[key];
    } else {
      throw new AppError(`Field "${key}" is not allowed to update`, 400);
    }
  });
  return filter;
};
