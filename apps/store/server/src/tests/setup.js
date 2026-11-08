// Runs before every test file: env must be set before src/config/env.js is imported.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-1234';
process.env.BCRYPT_COST = '4'; // fast hashing in tests only (default is 12)
process.env.AUTH_RATE_LIMIT_MAX = '1000';
process.env.GLOBAL_RATE_LIMIT_MAX = '100000';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_dummy';
