const Joi = require('joi');

// Validation schemas
const signupSchema = Joi.object({
  email: Joi.string().email().required().max(255),
  password: Joi.string().min(6).max(128).required(),
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).max(20).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const rideRequestSchema = Joi.object({
  pickup: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    address: Joi.string().max(255).optional()
  }).required(),
  dropoff: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    address: Joi.string().max(255).optional()
  }).required(),
  ride_type: Joi.string().valid('standard', 'premium', 'shared').required()
});

// Validation middleware functions
const validateSignup = (req, res, next) => {
  const { error } = signupSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Validation error', 
      details: error.details[0].message 
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Validation error', 
      details: error.details[0].message 
    });
  }
  next();
};

const validateRideRequest = (req, res, next) => {
  const { error } = rideRequestSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Validation error', 
      details: error.details[0].message 
    });
  }
  next();
};

module.exports = {
  validateSignup,
  validateLogin,
  validateRideRequest
};