const Sequelize = require('sequelize');
const sequelize = require('./connection');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Op = Sequelize.Op;

// models
db.User = require('../models/user');
db.Post = require('../models/post');

db.Post.belongsTo(db.User, { foreignKey: 'createdBy' });

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

// sequelize
//   .sync({ alter: true })
//   .then((result) => {
//     console.log(result);
//   })
//   .catch((err) => {
//     console.error(err);
//   });

module.exports = db;
