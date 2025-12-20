
const express = require("express");
const cors = require("cors");

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    // Разрешаем:
    // 1. Запросы без origin (например, curl, Postman, серверные запросы)
    // 2. Локальный development (localhost:8081)
    // 3. Все поддомены Vercel (ваше staging и production окружение)
    // 4. Другие домены, которые могут понадобиться

    const allowedOrigins = [
      'http://localhost:8081',
      /\.vercel\.app$/, // Все домены Vercel
      'https://jwt-auth-lab5.vercel.app', // Ваш production URL
    ];

    if (!origin) return callback(null, true); // Разрешаем запросы без origin

    for (const allowedOrigin of allowedOrigins) {
      if (typeof allowedOrigin === 'string') {
        if (origin === allowedOrigin) return callback(null, true);
      } else if (allowedOrigin.test(origin)) {
        return callback(null, true); // Регулярное выражение для Vercel
      }
    }

    // Для остальных запросов можно вернуть ошибку или разрешить (для тестов)
    // Для демонстрации CI/CD разрешим все
    return callback(null, true);

    // В production лучше вернуть ошибку:
    // return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
const Role = db.role;

app.get('/health', (req, res) => {
  res.status(200).send('OK'); // Просто текст, без JSON
});

// Основной маршрут
app.get("/", (req, res) => {
  res.json({
    message: "JWT Authentication API - Test lab 4",
    status: "running"
  });
});

// Подключение маршрутов
require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);

// Функция инициализации ролей
function initial() {
  Role.findOrCreate({
    where: { id: 1, name: "user" }
  }).then(([role, created]) => {
    if (created) console.log("Created 'user' role");
  });

  Role.findOrCreate({
    where: { id: 2, name: "moderator" }
  }).then(([role, created]) => {
    if (created) console.log("Created 'moderator' role");
  });

  Role.findOrCreate({
    where: { id: 3, name: "admin" }
  }).then(([role, created]) => {
    if (created) console.log("Created 'admin' role");
  });
}

// Синхронизация БД и запуск сервера
const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    // Синхронизация БД (force: true только для разработки!)
    // await db.sequelize.sync({ force: true });
    // console.log('Database synchronized');

    // Инициализация ролей
    // initial();

    // Запуск сервера
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();