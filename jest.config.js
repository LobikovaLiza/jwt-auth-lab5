module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/?(*.)+(spec|test).js'
    ],
    collectCoverage: false,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'app/**/*.js',
        '!app/config/**',
        '!app/models/index.js',
        '!**/node_modules/**'
    ],
    setupFiles: ['<rootDir>/jest.setup.js'],
    verbose: true,
    testTimeout: 10000,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    // Отключаем автоматическое сброс для контроля в тестах
    resetModules: false,
    // Добавляем игнор паттерны для проблемных файлов
    modulePathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/build/',
        '<rootDir>/dist/'
    ]
};