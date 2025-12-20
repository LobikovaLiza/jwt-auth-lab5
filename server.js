
const express = require("express");
const cors = require("cors");

const app = express();

let corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
const Role = db.role;

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
    await db.sequelize.sync({ force: true });
    console.log('Database synchronized');

    // Инициализация ролей
    initial();

    // Запуск сервера
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();