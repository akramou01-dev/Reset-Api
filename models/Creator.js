const Sequelize = require('sequelize');
const sequelize = require('../utils/Database');

const Creator = sequelize.define('creator', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: Sequelize.STRING
});

module.exports = Creator;