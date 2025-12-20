const deviceUtils = require("../utils/device.utils");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const db = require("../models");
const config = require("../config/auth.config");
const TokenUtils = require("../utils/token.utils");
const User = db.user;
const Role = db.role;

const Op = db.Sequelize.Op;

function getDeviceInfo(req) {
  return {
    deviceId: req.headers['x-device-id'] || req.body.deviceId || 'device-' + Date.now(),
    deviceName: req.headers['x-device-name'] || req.body.deviceName || 'Unknown Device',
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || 'unknown'
  };
}

exports.signup = async (req, res) => {
  try {
    // Проверка обязательных полей
    if (!req.body.username || !req.body.email || !req.body.password) {
      return res.status(400).send({
        message: "Username, email and password are required!"
      });
    }

    // Создание пользователя
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      isActive: true
    });

    // Назначение ролей
    if (req.body.roles) {
      const roles = await Role.findAll({
        where: {
          name: {
            [Op.or]: req.body.roles
          }
        }
      });
      await user.setRoles(roles);
    } else {
      // Назначение роли "user" по умолчанию
      await user.setRoles([1]);
    }

    res.status(201).send({
      message: "User registered successfully!",
      userId: user.id
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).send({
      message: err.message || "Some error occurred while registering user."
    });
  }
};

exports.signin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send({ message: "Username and password required!" });
    }

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!"
      });
    }

    // Получаем информацию об устройстве
    const deviceInfo = getDeviceInfo(req);

    // Генерация токенов
    const accessToken = jwt.sign(
      {
        id: user.id,
        deviceId: deviceInfo.deviceId,
        type: "access"
      },
      config.secret,
      { algorithm: 'HS256', expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        deviceId: deviceInfo.deviceId,
        type: "refresh"
      },
      config.refreshTokenSecret || config.secret,
      { algorithm: 'HS256', expiresIn: '7d' }
    );

    // Получаем текущий массив refreshTokens
    const refreshTokens = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];

    // Проверяем, есть ли уже это устройство
    const existingDeviceIndex = refreshTokens.findIndex(
      device => device.deviceId === deviceInfo.deviceId
    );

    const deviceData = {
      ...deviceInfo,
      refreshToken: refreshToken,
      refreshTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
      lastUsed: new Date().toISOString()
    };

    if (existingDeviceIndex !== -1) {
      // Обновляем существующее устройство
      refreshTokens[existingDeviceIndex] = deviceData;
    } else {
      // Добавляем новое устройство
      refreshTokens.push(deviceData);

      // Применяем лимит устройств
      const limitedTokens = deviceUtils.limitDevices(
        refreshTokens,
        user.deviceLimit || 5
      );

      // Если после лимитирования удалили текущее устройство - ошибка
      const stillExists = limitedTokens.some(
        device => device.deviceId === deviceInfo.deviceId
      );

      if (!stillExists) {
        return res.status(403).send({
          message: `Device limit reached (max ${user.deviceLimit || 5}). Please logout from another device first.`
        });
      }

      // Обновляем массив с учетом лимита
      refreshTokens.splice(0, refreshTokens.length, ...limitedTokens);
    }

    // Сохраняем обновленный массив и обновляем lastLogin
    await user.update({
      refreshTokens: refreshTokens,
      lastLogin: new Date()
    });

    // Получаем роли пользователя
    const roles = await user.getRoles();
    const authorities = roles.map(role => "ROLE_" + role.name.toUpperCase());

    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities,
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresIn: 900, // 15 минут в секундах
      isNewDevice: existingDeviceIndex === -1
    });

  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).send({ message: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).send({ message: "Refresh token required!" });
    }

    // Получаем информацию об устройстве
    const deviceInfo = {
      deviceId: req.headers['x-device-id'] || req.body.deviceId || '',
      deviceName: req.headers['x-device-name'] || req.body.deviceName || 'Unknown Device'
    };
    // Проверяем refresh токен
    const decoded = jwt.verify(
      refreshToken,
      config.refreshTokenSecret || config.secret
    );

    // Проверяем, что deviceId в токене совпадает с deviceId в запросе
    if (decoded.deviceId !== deviceInfo.deviceId) {
      return res.status(401).send({
        message: "Device mismatch!"
      });
    }

    // Находим пользователя
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    // Ищем устройство в массиве refreshTokens
    const refreshTokens = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];
    const deviceIndex = refreshTokens.findIndex(
      device => device.deviceId === decoded.deviceId &&
        device.refreshToken === refreshToken
    );

    if (deviceIndex === -1) {
      return res.status(401).send({
        message: "Refresh token not found or expired!"
      });
    }

    const device = refreshTokens[deviceIndex];

    // Проверяем, не истек ли refresh token
    if (new Date(device.refreshTokenExpires) < new Date()) {
      // Удаляем просроченный токен из массива
      refreshTokens.splice(deviceIndex, 1);
      await user.update({ refreshTokens: refreshTokens });

      return res.status(401).send({
        message: "Refresh token expired!"
      });
    }

    // Генерация новой пары токенов
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        deviceId: deviceInfo.deviceId,
        type: "access"
      },
      config.secret,
      { algorithm: 'HS256', expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      {
        id: user.id,
        deviceId: deviceInfo.deviceId,
        type: "refresh"
      },
      config.refreshTokenSecret || config.secret,
      { algorithm: 'HS256', expiresIn: '7d' }
    );

    // Обновляем запись устройства
    refreshTokens[deviceIndex] = {
      ...device,
      refreshToken: newRefreshToken,
      refreshTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastUsed: new Date().toISOString(),
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent
    };

    // Сохраняем обновленный массив
    await user.update({ refreshTokens: refreshTokens });

    res.status(200).send({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
      deviceId: deviceInfo.deviceId
    });

  } catch (err) {
    console.error('Refresh token error:', err);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).send({
        message: "Refresh token expired!"
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).send({
        message: "Invalid refresh token!"
      });
    }

    res.status(500).send({ message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.userId;
    const deviceId = req.deviceId; // Добавляем из middleware

    if (!userId) {
      return res.status(400).send({ message: "User ID required!" });
    }

    const user = await User.findByPk(userId);

    if (user) {
      // Если передан deviceId - удаляем только это устройство
      if (deviceId) {
        const refreshTokens = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];
        const updatedTokens = deviceUtils.removeDevice(refreshTokens, deviceId);

        await user.update({ refreshTokens: updatedTokens });
      } else {
        // Иначе очищаем все refreshTokens
        await user.update({
          refreshTokens: [],
          refreshToken: null, // Старое поле, если еще существует
          refreshTokenExpires: null
        });
      }
    }

    res.status(200).send({
      message: deviceId ? "Device logged out successfully!" : "Logged out successfully!"
    });

  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).send({ message: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });

    if (!user) {
      return res.status(404).send({
        message: "User not found."
      });
    }

    // Всегда получаем роли через отдельный запрос
    const roles = await user.getRoles();
    const authorities = roles.map(role => "ROLE_" + role.name.toUpperCase());

    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles: authorities,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });

  } catch (err) {
    console.error('Me endpoint error:', err);
    res.status(500).send({
      message: err.message || "Some error occurred while fetching user data."
    });
  }
};

exports.getDevices = async (req, res) => {
  try {
    const userId = req.userId;
    const currentDeviceId = req.deviceId; // Текущее устройство из токена

    const user = await User.findByPk(userId, {
      attributes: ['id', 'refreshTokens', 'deviceLimit']
    });

    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    const refreshTokens = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];

    // Форматируем устройства для ответа
    const devices = refreshTokens.map(device => ({
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      os: device.os,
      browser: device.browser,
      ipAddress: device.ipAddress,
      createdAt: device.createdAt,
      lastUsed: device.lastUsed || device.createdAt,
      isActive: true, // Все устройства в массиве считаем активными
      isCurrent: device.deviceId === currentDeviceId
    }));

    res.status(200).send({
      devices: devices,
      total: devices.length,
      limit: user.deviceLimit || 5,
      currentDeviceId: currentDeviceId
    });

  } catch (err) {
    console.error('Get devices error:', err);
    res.status(500).send({ message: err.message });
  }
};

exports.logoutDevice = async (req, res) => {
  try {
    const userId = req.userId;
    const { deviceId } = req.params; // ID устройства которое нужно разлогинить

    if (!deviceId) {
      return res.status(400).send({ message: "Device ID required!" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    const refreshTokens = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];

    // Проверяем, существует ли такое устройство
    const deviceExists = refreshTokens.some(device => device.deviceId === deviceId);

    if (!deviceExists) {
      return res.status(404).send({ message: "Device not found!" });
    }

    // Удаляем устройство из массива
    const updatedTokens = deviceUtils.removeDevice(refreshTokens, deviceId);

    await user.update({ refreshTokens: updatedTokens });

    // Проверяем, выходим ли мы с текущего устройства
    const isCurrentDevice = deviceId === req.deviceId;

    res.status(200).send({
      message: "Device logged out successfully!",
      deviceId: deviceId,
      isCurrentDevice: isCurrentDevice,
      remainingDevices: updatedTokens.length
    });

  } catch (err) {
    console.error('Logout device error:', err);
    res.status(500).send({ message: err.message });
  }
};

exports.logoutOtherDevices = async (req, res) => {
  try {
    const userId = req.userId;
    const currentDeviceId = req.deviceId;

    if (!currentDeviceId) {
      return res.status(400).send({ message: "Current device ID not found!" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    const refreshTokens = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];

    // Оставляем только текущее устройство
    const updatedTokens = refreshTokens.filter(
      device => device.deviceId === currentDeviceId
    );

    const loggedOutCount = refreshTokens.length - updatedTokens.length;

    await user.update({ refreshTokens: updatedTokens });

    res.status(200).send({
      message: `Logged out from ${loggedOutCount} other devices!`,
      loggedOutCount: loggedOutCount,
      currentDeviceId: currentDeviceId
    });

  } catch (err) {
    console.error('Logout other devices error:', err);
    res.status(500).send({ message: err.message });
  }
};

exports.renameDevice = async (req, res) => {
  try {
    const userId = req.userId;
    const { deviceId } = req.params;
    const { deviceName } = req.body;

    if (!deviceId || !deviceName) {
      return res.status(400).send({
        message: "Device ID and new name required!"
      });
    }

    if (deviceName.trim().length === 0) {
      return res.status(400).send({
        message: "Device name cannot be empty!"
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    const refreshTokens = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];
    const deviceIndex = refreshTokens.findIndex(
      device => device.deviceId === deviceId
    );

    if (deviceIndex === -1) {
      return res.status(404).send({ message: "Device not found!" });
    }

    // Обновляем имя устройства
    refreshTokens[deviceIndex].deviceName = deviceName.trim();

    await user.update({ refreshTokens: refreshTokens });

    res.status(200).send({
      message: "Device renamed successfully!",
      deviceId: deviceId,
      deviceName: deviceName.trim()
    });

  } catch (err) {
    console.error('Rename device error:', err);
    res.status(500).send({ message: err.message });
  }
};

