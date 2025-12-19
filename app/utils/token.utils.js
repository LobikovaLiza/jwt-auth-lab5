const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");

class TokenUtils {
    // Генерация access токена
    static generateAccessToken(userId) {
        return jwt.sign(
            { id: userId, type: "access" },
            config.secret,
            {
                algorithm: "HS256",
                expiresIn: config.accessTokenExpiresIn
            }
        );
    }

    // Генерация refresh токена
    static generateRefreshToken(userId) {
        return jwt.sign(
            { id: userId, type: "refresh" },
            config.refreshTokenSecret || config.secret,
            {
                algorithm: "HS256",
                expiresIn: config.refreshTokenExpiresIn || "7d"
            }
        );
    }

    // Генерация пары токенов
    static generateTokenPair(userId) {
        return {
            accessToken: this.generateAccessToken(userId),
            refreshToken: this.generateRefreshToken(userId)
        };
    }

    static verifyToken(token, isRefresh = false) {
        try {
            const secret = isRefresh ? (config.refreshTokenSecret || config.secret) : config.secret;
            return jwt.verify(token, secret);
        } catch (error) {
            return null;
        }
    }

    // Проверка access токена
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, config.secret);
        } catch (error) {
            return null;
        }
    }

    // Проверка refresh токена
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, config.refreshTokenSecret);
        } catch (error) {
            return null;
        }
    }

    // Получение данных из токена без проверки
    static decodeToken(token) {
        return jwt.decode(token);
    }

    // Проверка, истек ли токен
    static isTokenExpired(decodedToken) {
        if (!decodedToken || !decodedToken.exp) return true;
        return Date.now() >= decodedToken.exp * 1000;
    }
}

module.exports = TokenUtils;