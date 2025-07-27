const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
//const userModel = require('../models/userModel');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour must have  less or equal then 40 characters'],
      //minlength: [10, 'A tour must have  more or equal then 10 characters'],
      //validator: [validator.isAlpha, 'A tour must have'],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a Group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficlty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: aesy, medium, difficulty ',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.6,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Ratinf must be below 5.0'],
      set: val => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a name'],
      unique: true,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) Should be below regular price ',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description '],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a image'],
    },
    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  /// không lưu trữ vào DB
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//đặt index để  chuy vấn nhanh hơn

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ startLocation: '2dsphere' });

//
tourSchema.virtual('durationWeeks').get(function () {
  if (!this.duration) return undefined;
  return this.duration / 7;
});

// tham chiếu ngược

tourSchema.virtual('reviews', {
  ref: 'Review', // Model liên kết
  foreignField: 'tour', // trường trong Review => tour
  localField: '_id', // match mới id Tour
});

//DOCUMENT MIDDLEWARE .this (.save(),.create())

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE

// nhúng dữ liệu

// tourSchema.pre('save', async function (next) {
//   const gudesPromises = this.guides.map(async id => await userModel.findById(id));
//   this.guides = await Promise.all(gudesPromises);
//   next();
// });

//tham chiếu
// tourSchema.pre(/^find/, function () {
//   this.populate({
//     path: 'guides',
//     select: '-__v -passwordChangedAt -verified',
//   });
// });

//

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

//
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

//AGGREGATION MIDDLEWARE .this

tourSchema.pre('aggregate', function (next) {
  const firstStage = this.pipeline()[0];
  if (firstStage && firstStage.$geoNear) {
    return next(); // Không thêm $match nếu đã có $geoNear đầu tiên
  }
  // Nếu không có $geoNear ở đầu, thêm $match như cũ
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
