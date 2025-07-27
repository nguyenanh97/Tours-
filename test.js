const express = require('express');
const fs = require('fs');
const { json } = require('stream/consumers');
const app = express();
app.use(express.json()); //giúp phân tích dữ liệu JSON từ body của request.
//middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// chuyên đỗi dữ liệu thành json
const tours = JSON.parse(fs.readFileSync(`đường dẫn `));

app.get('/đường dẫn file', (req, res) => {
  // gửi dữ liệu cho phía client (chình duyệt , postman ,hoặc ứng dụng khác gọi api)

  //Build Query
  //1)filtering: xử lý chắc năng tìm kiếm

  // const queryObj = { ...req.query };
  // const excludedFields = ['page', 'sort', 'limit', 'fields'];
  // excludedFields.forEach(el => delete queryObj[el]);

  // //2):Advanced filtering (>= ,>,<=,<) lọc bằng toán tử
  // let queryStr = JSON.stringify(queryObj);
  // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  // let query = Tour.find(JSON.parse(queryStr));

  // //3: Sorting() Sắp xếp
  // if (req.query.sort) {
  //   const sortBy = req.query.sort.split(',').join(' ');
  //   query = query.sort(sortBy);
  // } else {
  //   query = query.sort('-createdAt');
  // }

  // //  fields lấy theo tên
  // if (req.query.fields) {
  //   const fields = req.query.fields.split(',').join(' ');
  //   query = query.select(fields);
  // } else {
  //   query = query.select('-__v');
  // }

  // Pagintion
  // const page = parseInt(req.query.page) || 1;
  // const limit = parseInt(req.query.limit) || 100;
  // const skip = (page - 1) * limit;
  // query = query.skip(skip).limit(limit);

  res.status(200).json({
    status: 'success',
    tours: tours.length,
    data: { tours },
  });
});
// GET tours/:id
app.get('/api/tours/:id', (req, res) => {
  // id: string => id: number
  const id = req.params * 1;
  const tour = tours.find(el => el.id === id);
  // if(id > tours.length)
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  // result ok
  res.status(200),
    json({
      status: 'success',
      data: {
        tour,
      },
    });
});

// P0ST Element
app.post('/api/v1/tours', (req, res) => {
  //console.log(req.body) => {API POST}
  // tạo mới id
  const newId = tours[tours.length - 1].id + 1;
  // hợp nhất obj
  const newTour = Object.assign({ id: newId }, req.body);
  // thêm phần tử vào cuối obj
  tours.push(newTour);
  // đẩy dữ liệu vào file ,chuyển đổi thành chuỗi,trả về kết quả
  fs.writeFile('đường dẫn file muốn ghi', JSON.stringify(tours), err => {
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  });
});

// PATCH tour (Update tour)
app.patch('/api/v1/tours/:id', (req, res) => {
  if (req.params.id > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  s;
  res.status(200).json({
    status: 'successe',
    data: {
      tour: 'Update tour here...',
    },
  });
});

/////Delete Tour
app.patch('/api/v1/tours/:id', (req, res) => {
  if (req.params.id > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  s;
  res.status(204).json({
    status: 'successe',
    data: null,
  });
});

const prot = 3000;
app.listen(prot, () => {
  console.log('kết nối sv thành công ....');
});
// hook vaf middleware :  hook cho phép bạn xử lý các yêu cầu HTTP trước khi chúng đến các trình xử lý tuyến đường của bạn
const mongoose = require('mongoose');
const slugify = require('slugify');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
    },
    duration: {
      type: String,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a Group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficlty'],
    },

    ratingsAverage: {
      type: Number,
      default: 4.6,
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
    priceDiscount: Number,
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
    secretTour: {},
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
// tính số tuần dựa vào số ngày của tours(duration) và không lưu trực tiếp vào database
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
//Document Middleware: runs before(chạy trước) (.save(),.create()) this sẽ trỏ về đối tượng hiện tạ
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE trỏ về đối tượng truy vấn với this

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
/// git filter-repo --path node_modules/ --invert-paths --force xoá toàn bộ file quá 100mb
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // Excute Query
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .pagination();
//   const tours = await features.query;

//   res.status(200).json({
//     status: 'success',
//     result: tours.length,
//     data: {
//       tours,
//     },
//   });
// });

// exports.reviewAll =
//
//
//
//
// catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter)
//     .populate({
//       path: 'tour',
//       select: 'name',
//     })
//     .populate({
//       path: 'user',
//       select: 'name role',
//     });
//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: reviews,
//   });
// });
