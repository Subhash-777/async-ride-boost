const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      message: 'Duplicate entry error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Data already exists'
    });
  }

  if (err.code === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({
      message: 'Database table not found',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Database configuration error'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Authentication failed'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired',
      error: 'Please login again'
    });
  }

  // Validation errors
  if (err.isJoi) {
    return res.status(400).json({
      message: 'Validation error',
      error: err.details[0].message
    });
  }

  // Default error
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'Something went wrong'
  });
};

module.exports = errorHandler;