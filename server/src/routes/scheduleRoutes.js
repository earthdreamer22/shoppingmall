const express = require('express');
const Schedule = require('../models/Schedule');
const { asyncHandler } = require('../utils/asyncHandler');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// 공개 API: 일정 목록 조회 (월별)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { year, month } = req.query;

    let startDate, endDate;

    if (year && month) {
      startDate = new Date(Number(year), Number(month) - 1, 1);
      endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
    } else {
      // 기본: 현재 월
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const schedules = await Schedule.find({
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    res.json(schedules);
  })
);

// 관리자 API: 일정 생성/수정
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { date, status, note } = req.body;

    if (!date) {
      return res.status(400).json({ message: '날짜를 입력해주세요.' });
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const schedule = await Schedule.findOneAndUpdate(
      { date: dateObj },
      { status: status || 'available', note: note || '' },
      { upsert: true, new: true }
    );

    res.json(schedule);
  })
);

// 관리자 API: 일정 삭제
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await Schedule.findByIdAndDelete(id);

    res.json({ message: '일정이 삭제되었습니다.' });
  })
);

// 관리자 API: 일괄 업데이트
router.put(
  '/bulk',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { schedules } = req.body;

    if (!Array.isArray(schedules)) {
      return res.status(400).json({ message: '잘못된 요청입니다.' });
    }

    const operations = schedules.map((item) => {
      const dateObj = new Date(item.date);
      dateObj.setHours(0, 0, 0, 0);

      return {
        updateOne: {
          filter: { date: dateObj },
          update: { status: item.status, note: item.note || '' },
          upsert: true,
        },
      };
    });

    await Schedule.bulkWrite(operations);

    res.json({ message: '일정이 업데이트되었습니다.' });
  })
);

module.exports = router;
