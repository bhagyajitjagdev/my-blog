const Sequelize = require('sequelize');

const config = {
  SQL: {
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PWD,
    database: process.env.DATABASE,
    host: process.env.DATABASE_HOST,
    dialect: 'mysql',
  },
};

const sequelize = new Sequelize(config.SQL.database, config.SQL.username, config.SQL.password, config.SQL);

module.exports = sequelize;
