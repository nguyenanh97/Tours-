const AppError = require('./appError');
module.exports = function checkPermissions(doc, user) {
  const isAdmin = user.role === 'admin';
  const isOwner = doc.user && doc.user.toString() === user.id;

  if (doc.user) {
    if (!isOwner && !isAdmin) {
      throw new AppError('You do not have permission to perform this action..', 403);
    }
  } else {
    if (!isAdmin) {
      throw new AppError(
        'Only admins are allowed to manipulate this resource..',
        403,
      );
    }
  }
};
