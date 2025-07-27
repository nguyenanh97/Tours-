const { required } = require('joi');
const mongoose = require('mongoose');
const { type } = require('os');
const validate = require('validator');
const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to the user'],
    },
    customer_name: { type: String, trim: true, maxlength: 100, required: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      validate: [validate.isEmail, 'Invalid email'],
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return /^\+?[0-9]{9,15}$/.test(v);
        },
        message: 'Invalid phone number',
      },
    },
    // tour_name: { type: String, required: true, trim: true },
    tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'paid'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    numberOfGuests: {
      type: Number,
      min: 1,
      default: 1,
      required: true,
    },
    sessionId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  },
);
bookingSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v;
    // delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
  },
});

bookingSchema.index({ user: 1, tour: 1, date: 1 }, { unique: true });
const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
