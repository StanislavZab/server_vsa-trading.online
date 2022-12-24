module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("user", {
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isActivated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      activationLink: {
        type: DataTypes.STRING,
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: 'user',
      }
    },
    {
      timestamps: false,
    });
    return User;
  };