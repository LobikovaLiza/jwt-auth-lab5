// module.exports = (sequelize, Sequelize) => {
//   const User = sequelize.define("users", {
//     username: {
//       type: Sequelize.STRING
//     },
//     email: {
//       type: Sequelize.STRING
//     },
//     password: {
//       type: Sequelize.STRING
//     }
//   });

//   return User;
// };

module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("users", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },

    refreshTokens: {
      type: Sequelize.TEXT, // или Sequelize.JSONB если PostgreSQL поддерживает
      defaultValue: '[]', // Храним как JSON строку
      get() {
        // Геттер: преобразуем строку в массив при чтении
        const value = this.getDataValue('refreshTokens');
        try {
          return value ? JSON.parse(value) : [];
        } catch (error) {
          console.error('Error parsing refreshTokens:', error);
          return [];
        }
      },
      set(value) {
        // Сеттер: преобразуем массив в строку при записи
        this.setDataValue('refreshTokens',
          typeof value === 'string' ? value : JSON.stringify(value || [])
        );
      }
    },

    refreshTokenExpires: {
      type: Sequelize.DATE,
      allowNull: true
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: Sequelize.DATE,
      allowNull: true
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: true
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: true
    },
    deviceLimit: {
      type: Sequelize.INTEGER,
      defaultValue: 5, // Максимум 5 устройств по умолчанию
      validate: {
        min: 1,
        max: 10
      }
    }
  },
    {
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    });

  return User;
};