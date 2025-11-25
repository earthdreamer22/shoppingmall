const mongoose = require('mongoose');

/**
 * ObjectId 유효성 검증 미들웨어
 * @param {string} paramName - 검증할 파라미터 이름 (예: 'productId', 'userId')
 */
function validateObjectId(paramName) {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      return res.status(400).json({ message: `${paramName}가 필요합니다.` });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: `유효하지 않은 ${paramName} 형식입니다.` });
    }

    next();
  };
}

module.exports = { validateObjectId };
