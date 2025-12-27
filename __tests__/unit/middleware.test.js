const { verifyToken } = require('../../app/middleware/authJwt');

// Мокаем config
jest.mock('../../app/config/auth.config', () => ({
    secret: 'test-secret'
}));

// Мокаем jwt отдельно
const jwt = require('jsonwebtoken');
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn()
}));

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        next = jest.fn();

        // Сброс моков
        jest.clearAllMocks();
    });

    test('should return 403 without token', () => {
        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalledWith({
            message: 'No token provided!'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('should call next with valid token containing deviceId', () => {
        req.headers.authorization = 'Bearer valid-token';
        jwt.verify.mockReturnValue({
            id: 1,
            deviceId: 'test-device'
        });

        verifyToken(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
        expect(next).toHaveBeenCalled();
        expect(req.userId).toBe(1);
        expect(req.deviceId).toBe('test1111-device');
    });

    test('should return 401 for token without deviceId', () => {
        req.headers.authorization = 'Bearer invalid-token';
        jwt.verify.mockReturnValue({
            id: 1
            // Нет deviceId!
        });

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            message: 'Token missing device information!',
            code: 'TOKEN_MISSING_DEVICE'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('should handle expired token', () => {
        req.headers.authorization = 'Bearer expired-token';

        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        jwt.verify.mockImplementation(() => {
            throw error;
        });

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            message: 'Token expired!',
            code: 'TOKEN_EXPIRED'
        });
    });

    test('should handle invalid token', () => {
        req.headers.authorization = 'Bearer invalid-token';

        jwt.verify.mockImplementation(() => {
            throw new Error('Invalid token');
        });

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            message: 'Invalid token!',
            code: 'INVALID_TOKEN'
        });
    });
});