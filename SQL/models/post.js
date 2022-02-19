/* eslint-disable no-param-reassign */
const { DataTypes } = require('sequelize');

const sequelize = require('../database/connection');

const Post = sequelize.define(
  'post',
  {
    _id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  { underscored: false }
);

module.exports = Post;
