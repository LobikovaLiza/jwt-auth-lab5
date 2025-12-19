// app/utils/device.utils.js
module.exports = {
    // Ограничивает количество устройств, удаляя самые старые
    limitDevices: function (devices, limit) {
        if (devices.length <= limit) {
            return devices;
        }

        // Сортируем по дате создания (самые старые первыми)
        const sorted = [...devices].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.lastUsed || 0);
            const dateB = new Date(b.createdAt || b.lastUsed || 0);
            return dateA - dateB;
        });

        // Возвращаем только последние `limit` устройств
        return sorted.slice(-limit);
    },

    // Удаляет устройство по deviceId
    removeDevice: function (devices, deviceId) {
        return devices.filter(device => device.deviceId !== deviceId);
    }
};