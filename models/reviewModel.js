const mongoose = require('mongoose');
const Tour = require('./tourModel');
const { start } = require('repl');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not by empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour '],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
reviewSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v;
    delete ret.durationWeeks;
    return ret;
  },
});

// MIDDLEWARE

// đặt chỉ mục
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Tính trung bình Rating

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },

    // {
    //   $group: {
    //     _id: { tour: '$tour', user: '$user' },
    //     count: { $sum: 1 },
    //   },
    // },
    // { $match: { count: { $gt: 1 } } },
  ]);
  if (stats.length > 0) {
    const tour = await Tour.findById(tourId);
    if (!tour) return;
    if (
      tour.ratingsQuantity !== stats[0].nRating ||
      tour.ratingsAverage !== stats[0].avgRating
    ) {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating,
      });
    }
  } else {
    // Nếu không còn review nào, đặt về mặc định
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 5,
    });
  }
};

// Hàm dùng lại để tính rating
async function recalcRatingFromDoc(doc) {
  if (doc && doc.tour) {
    await doc.constructor
      .calcAverageRatings(doc.tour)
      .catch(err => console.error('Failed to calculate average rating:', err));
  }
}

// Khi tạo review mới
reviewSchema.post('save', function () {
  recalcRatingFromDoc(this);
});

// Trước khi cập nhật hoặc xóa: lưu lại doc cũ
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.reviewDoc = await this.model.findOne(this.getQuery());
  next();
});

// Sau khi cập nhật hoặc xóa: tính lại rating
reviewSchema.post(/^findOneAnd/, async function () {
  await recalcRatingFromDoc(this.reviewDoc);
});

// reviewSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'user',
//     select: 'name ',
//   }).populate({
//     path: 'tour',
//     select: 'name ',
//   });
//   next();
// });
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
