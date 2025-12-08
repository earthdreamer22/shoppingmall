const { z } = require('zod');

function validate(schema, target = 'body') {
  return (req, res, next) => {
    const data = req[target];
    const result = schema.safeParse(data);
    if (result.success) {
      req[target] = result.data;
      return next();
    }

    const errors = result.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`);
    return res.status(400).json({ message: '요청 데이터가 올바르지 않습니다.', errors });
  };
}

module.exports = { validate, z };
