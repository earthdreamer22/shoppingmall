const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'unavailable', 'booked'],
      default: 'available',
    },
    note: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// 날짜별 유니크 인덱스
scheduleSchema.index({ date: 1 }, { unique: true });

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
