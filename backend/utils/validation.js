const { validationResult } = require('express-validator');

// middleware for formatting errors from express-validator middleware
// (to customize, see express-validator's documentation)
const handleValidationErrors = (req, _res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    const errors = validationErrors
      .array()
      .map((error) => `${error.msg}`);

    const err = Error('Bad request.');
    err.errors = errors;
    err.status = 400;
    err.title = 'Bad request.';
    next(err);
  }
  next();
};

// Custom middleware function to check the type of the `url` field
const validateUrl = (req, res, next) => {
  if (typeof req.body.url !== 'string') {
    return res.status(400).json({
      message: "Validation error",
      statusCode: 400,
      errors: {
        url: "Review must be a string"
      }
    });
  }
  next();
}


module.exports = {
  handleValidationErrors,
  validateUrl,
};
