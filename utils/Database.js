    const Sequelize = require('sequelize');

    const sequelize = new Sequelize(
        'REST_API_1',
        'root',
        'Mot de passe 12', {
            dialect: 'mysql',
            host: 'localhost', 
            logging : false
        }
    );

    module.exports = sequelize;