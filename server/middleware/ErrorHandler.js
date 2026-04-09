// Centralized Error Handling Middleware
// Provides consistent error responses across the entire application

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Not Found handler - for unmatched routes
export const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
};

// Global error handler - catches all unhandled errors
export const errorHandler = (err, req, res, next) => {
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Error:', err.message);
        console.error('Stack:', err.stack);
    }

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        const errors = err.errors.map(e => ({
            field: e.path,
            message: e.message
        }));
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            details: errors
        });
    }

    // Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
        const field = err.errors[0]?.path || 'unknown';
        return res.status(409).json({
            success: false,
            error: 'Duplicate entry',
            field,
            message: `A record with this ${field} already exists`
        });
    }

    // Sequelize foreign key errors
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            success: false,
            error: 'Invalid reference',
            message: 'Referenced record does not exist'
        });
    }

    // Sequelize database errors
    if (err.name === 'SequelizeDatabaseError') {
        return res.status(500).json({
            success: false,
            error: 'Database error',
            message: 'An error occurred while processing your request'
        });
    }

    // JSON parsing errors
    if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON',
            message: 'Request body contains invalid JSON'
        });
    }

    // Custom application errors
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
            ...(err.details && { details: err.details })
        });
    }

    // Default: Internal server error
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? 'Internal server error' : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

// API Response helper - consistent success responses
export const apiResponse = (res, statusCode, message, data = null) => {
    const response = {
        success: true,
        message,
        timestamp: new Date().toISOString()
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

// Error creator for consistent error objects
export class AppError extends Error {
    constructor(message, statusCode, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}
