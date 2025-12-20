process.env.NODE_ENV = 'test';

// Базовые настройки для всех тестов
jest.setTimeout(10000);

// Минимальные глобальные моки
global.console = {
    ...console,
    // Оставляем только важные логи
    // log: jest.fn(),
    // error: jest.fn(),
    // warn: jest.fn()
};

// Базовая мокировка dotenv
jest.mock('dotenv', () => ({
    config: jest.fn()
}));