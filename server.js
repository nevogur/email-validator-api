const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { validateEmail, checkDisposableDomain, checkMXRecords } = require('./emailValidator');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Railway deployment (fixes rate limiting with X-Forwarded-For header)
app.set('trust proxy', 1);

// RapidAPI key validation
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-rapidapi-key'] || req.headers['X-RapidAPI-Key'];
  
  // For development, allow requests without API key
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // In production, require RapidAPI key
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid RapidAPI key via x-rapidapi-key header'
    });
  }
  
  // Basic validation - RapidAPI keys typically start with specific patterns
  if (apiKey.length < 10) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'Invalid RapidAPI key format'
    });
  }
  
  // Note: In a real RapidAPI integration, you would validate the key
  // against RapidAPI's validation endpoint, but for now we'll accept
  // any reasonably formatted key
  
  next();
};

// Rate limiting with different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.'
  }
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // stricter limit for validation endpoint
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.'
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(generalLimiter);

// Enhanced request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.get('User-Agent') || 'Unknown';
  console.log(`${timestamp} - ${req.method} ${req.path} - ${req.ip} - ${userAgent}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API documentation endpoint
app.get('/docs', (req, res) => {
  res.json({
    name: "Email Validator API",
    version: "1.0.0",
    description: "Validates email addresses and detects disposable domains",
    endpoints: {
      "/mailcheck": {
        method: "GET",
        parameters: {
          email: "string (required) - Email address to validate"
        },
        headers: {
          "x-rapidapi-key": "string (required) - RapidAPI key for authentication"
        },
        description: "Validates email addresses and returns detailed information"
      },
      "/health": {
        method: "GET",
        description: "Health check endpoint"
      }
    }
  });
});

// Main email validation endpoint (temporarily without API key validation for testing)
app.get('/mailcheck', strictLimiter, async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email parameter is required',
        message: 'Please provide an email address to validate',
        example: '/mailcheck?email=test@example.com'
      });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    
    if (!emailValidation.isValid) {
      return res.json({
        email: email,
        valid: false,
        reason: emailValidation.reason,
        domain: emailValidation.domain,
        mx_host: null,
        mx_info: null,
        mx_ip: null
      });
    }

    // Check if domain is disposable
    const disposableCheck = await checkDisposableDomain(emailValidation.domain);
    
    // Get MX records
    const mxRecords = await checkMXRecords(emailValidation.domain);

    const response = {
      email: email,
      valid: !disposableCheck.isDisposable,
      reason: disposableCheck.isDisposable ? 'Blacklist' : 'Valid',
      domain: emailValidation.domain,
      mx_host: mxRecords.primary,
      mx_info: mxRecords.info,
      mx_ip: mxRecords.ip
    };

    res.json(response);

  } catch (error) {
    console.error('Error validating email:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while validating the email',
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Email Validator API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API docs: http://localhost:${PORT}/docs`);
  console.log(`API endpoint: http://localhost:${PORT}/mailcheck?email=test@example.com`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
