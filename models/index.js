"use strict";

const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  logging: false,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

sequelize
.authenticate()
.then(() => {
  console.log('Connection has been established successfully.');
})
 .catch(err => {
 console.error('Unable to connect to the database:', err);
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Securities = require("./securities.model.js")(sequelize, Sequelize.DataTypes);
db.Contracts = require("./contracts.model.js")(sequelize, Sequelize.DataTypes);
db.Base_candles = require("./base_candles.model.js")(sequelize, Sequelize.DataTypes);
db.User = require("./users.model.js")(sequelize, Sequelize.DataTypes);
db.Token = require("./token.model.js")(sequelize, Sequelize.DataTypes);

db.User.hasOne(db.Token,
  {
    foreignKey: 'user_id'
  });

db.Contracts.hasMany(db.Base_candles,
  {
    foreignKey: 'contract_id',
    as: 'candles'
  });
db.Securities.hasMany(db.Contracts,
  {
    foreignKey: 'securities_id'
  });

db.sequelize.sync().then(() => {
  console.log("Drop and re-sync db.");
});

module.exports = db;