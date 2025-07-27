const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');
const hashToken = require('../middleware/hashToken');

//skima
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name !'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email !'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email !'],
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'guide', 'lead-guide'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password !'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password '],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password are not the same !',
    },
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verifyToken: String,
  verifyTokenExpires: Date,

  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,

  restoreToken: String,
  restoreTokenExpires: Date,

  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//  loại bỏ các trường không cần thiết
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v;
    delete ret.passwordConfirm;
    delete ret.passwordChangedAt;
    delete ret.verifyToken;
    return ret;
  },
});

userSchema.pre('save', async function (next) {
  // kiểm tra mật khẩu có thay đổi k
  if (!this.isModified('password')) return next();

  // mã hoá mật khẩu
  this.password = await bcryptjs.hash(this.password, 12);

  // loại bỏ mật xác nhận
  this.passwordConfirm = undefined;
  //this.passwordChangedAt = Date.now() - 1000;
  next();
});

//

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// lọc dữ liệu của active

userSchema.pre(/^find/, function (next) {
  // Nếu có flag `includeInactive`, bỏ qua filter
  if (this._mongooseOptions.includeInactive) return next();

  // Mặc định chỉ lấy user active
  this.find({ active: { $ne: false } });
  next();
});

// so sánh password đã được băm

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  console.log('Candidate:', candidatePassword);
  console.log('User hash:', userPassword);
  return await bcryptjs.compare(candidatePassword, userPassword);
};

// kiểm tra người dùng có thay đổi mk trước lúc cấp JWT

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp; //true:mật khẩu đã được thay đổi sau khi JWT(phải đăng nhập lại)
  }
  return false;
};

// Emai-Verification
userSchema.methods.createEmailverifyToken = function () {
  const createEmailToken = crypto.randomBytes(32).toLocaleString('hex');
  this.verifyToken = hashToken(createEmailToken);
  this.verifyTokenExpires = Date.now() + 10 * 60 * 1000;
  return createEmailToken;
};

// forgotPassword

userSchema.methods.createPasswordResetToken = function () {
  // tạo token => gửi đi
  const resetToken = crypto.randomBytes(32).toString('hex');
  // băm password khi đãn đặt lại
  this.passwordResetToken = hashToken(resetToken);

  //console.log({ resetToken }, this.passwordResetToken);

  // thờ hạn email = 10
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// RecoverAccount

userSchema.methods.createRestoreToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.restoreToken = hashToken(resetToken);
  this.restoreTokenExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
