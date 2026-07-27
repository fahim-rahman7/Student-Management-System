const { rateLimit } = require("express-rate-limit");

const rateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    skipSuccessfulRequests: true,
    limit: 2,
    message: {
        error: "Too many requests, please try again later."
    }
});

module.exports = { rateLimiter };