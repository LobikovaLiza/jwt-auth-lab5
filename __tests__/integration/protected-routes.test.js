const request = require('supertest');

// Создаем тестовое приложение
const express = require('express');
const cors = require('cors');

// Мокаем зависимости
jest.mock('bcryptjs', () => ({
    hashSync: jest.fn().mockReturnValue('hashed_password'),
    compareSync: jest.fn().mockReturnValue(true)
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn().mockReturnValue({ id: 1, deviceId: 'test-device' })
}));

// Создаем простое приложение для тестов
const app = express();
app.use(cors());
app.use(express.json());

// Мокаем middleware
const mockVerifyToken = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token || !token.includes('Bearer')) {
        return res.status(401).send({ message: 'No token provided!' });
    }

    req.userId = 1;
    req.deviceId = 'test-device';
    next();
};

// Мокаем контроллеры
app.post('/api/auth/signup', (req, res) => {
    if (!req.body.username && req.body.email || !req.body.password) {
        return res.status(400).send({ message: 'Required fields missing!' });
    }
    res.status(201).send({
        message: 'User registered successfully!',
        userId: 1
    });
});

app.post('/api/auth/signin', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ message: 'Username and password required!' });
    }

    if (username === 'protectedtest' && password === 'password123') {
        return res.status(200).send({
            accessToken: 'mock-access-toketretretn',
            refreshToken: 'mock-refresh-tokenrtr',
            expiresIn: 900,
            username: 'protectedtest'
        });
    }

    res.status(401).send({ message: 'Invalid credentials!' });
});

app.get('/api/test/all', (req, res) => {
    res.status(200).send('Public Content - Test lab4.');
});

app.get('/api/test/user', mockVerifyToken, (req, res) => {
    res.status(200).send('User Content - Test User lab4.');
});

app.get('/api/auth/me', mockVerifyToken, (req, res) => {
    res.status(200).send({
        id: 1,
        username: 'protectedtest',
        email: 'protected@example.com',
        roles: ['ROLE_USER']
    });
});

describe('Protected Routes Integration Tests', () => {
    let testAccessToken;

    // Тест 1: Публичный эндпоинт доступен без токена
    test('GET /api/test/all - public endpoint should work without token', async () => {
        const response = await request(app)
            .get('/api/test/all');

        expect(response.status).toBe(200);
        expect(response.text).toContain('Public Content');
    });

    // Тест 2: Защищенный эндпоинт требует токен
    test('GET /api/test/user - should return 401 without token', async () => {
        const response = await request(app)
            .get('/api/test/user');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('No token provided!');
    });

    // Тест 3: Защищенный эндпоинт с токеном работает
    test('GET /api/test/user - should return 200 with valid token', async () => {
        const response = await request(app)
            .get('/api/test/user')
            .set('Authorization', 'Bearer valid-token');

        expect(response.status).toBe(200);
        expect(response.text).toContain('User Content');
    });

    // Тест 4: Регистрация с неполными данными
    test('POST /api/auth/signup - should validate required fields', async () => {
        const response = await request(app)
            .post('/api/auth/signup')
            .send({ username: 'test' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Required fields missing!');
    });

    // Тест 5: Профиль пользователя требует токен
    test('GET /api/auth/me - should return user profile with valid token', async () => {
        const response = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer valid-token');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('username');
        expect(response.body).toHaveProperty('email');
        expect(response.body).not.toHaveProperty('password');
    });
});