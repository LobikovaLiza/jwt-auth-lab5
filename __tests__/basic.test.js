const { verifyToken } = require('../../../app/middleware/authJwt');
const jwt = require('jsonwebtoken');

// Мокаем jwt и конфиг
jest.mock('jsonwebtoken');
jest.mock('../../../app/config/auth.config', () => ({
    secret: 'test-secret-key'
}));

describe('AuthJwt Middleware - verifyToken', () => {
    let mockReq, mockRes, mockNext;

    // Перед каждым тестом создаём свежие объекты
    beforeEach(() => {
        mockReq = {
            headers: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        mockNext = jest.fn();
        // Сбрасываем все моки
        jest.clearAllMocks();
    });

    test('должен вернуть 403, если токен не предоставлен', () => {
        // Act: Вызываем middleware
        verifyToken(mockReq, mockRes, mockNext);

        // Assert: Проверяем, что вернулась ошибка и next не был вызван
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.send).toHaveBeenCalledWith({
            message: 'No token provided!'
        });
        expect(mockNext).not.toHaveBeenCalled();
    });

    test('должен вернуть 401, если токен не содержит deviceId', () => {
        // Arrange: Настраиваем запрос с токеном
        mockReq.headers['authorization'] = 'Bearer some.invalid.token';
        // Мокаем jwt.verify, чтобы он вернул объект БЕЗ deviceId
        jwt.verify.mockReturnValue({ id: 123 });

        // Act
        verifyToken(mockReq, mockRes, mockNext);

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith('some.invalid.token', 'test-secret-key');
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.send).toHaveBeenCalledWith({
            message: 'Token missing device information!',
            code: 'TOKEN_MISSING_DEVICE'
        });
        expect(mockNext).not.toHaveBeenCalled();
    });

    test('должен вызвать next() и добавить userId/deviceId в req для валидного токена', () => {
        // Arrange
        mockReq.headers['authorization'] = 'Bearer valid.token.here';
        const mockDecoded = { id: 42, deviceId: 'test-device-001' };
        jwt.verify.mockReturnValue(mockDecoded);

        // Act
        verifyToken(mockReq, mockRes, mockNext);

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith('valid.token.here', 'test-secret-key');
        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.userId).toBe(42);
        expect(mockReq.deviceId).toBe('test-device-001');
        // Убеждаемся, что НЕ было отправлено сообщение об ошибке
        expect(mockRes.status).not.toHaveBeenCalled();
        expect(mockRes.send).not.toHaveBeenCalled();
    });
});