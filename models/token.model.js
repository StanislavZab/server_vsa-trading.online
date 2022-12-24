//const Users = require('./users.model');

module.exports = (sequelize, DataTypes) => {
    const Token = sequelize.define("token", {
      user_id: {
        type: DataTypes.INTEGER
      },
      refreshToken: {
        type: DataTypes.STRING,
      }
    },
    {
      timestamps: false,
    });
    return Token;
  };