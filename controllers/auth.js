const User = require('../models/User');
const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = (req, res, next) => {
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation field.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                name: name
            });
            return user.save();
        })
        .then(result => {
            res.status(200).json({
                message: 'Signing up succeed.',
                userId: result._id
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};

exports.login = (req, res, next) => {
    const email = req.body.username;
    const password = req.body.password;
    console.log(password);
    let loadedUser;
    User.findOne({
            where: {
                email: email
            }
        })
        .then(user => {
            if (!user) {
                const error = new Error('Email not register.');
                error.statusCode = 401;
                throw error;
            }
            loadedUser = user;
            return bcrypt.compare(password, user.password)
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Invalid Password');
                error.statusCode = 401;
                throw error;
            };
            // creating JWT for the login
            const token = jwt.sign({
                email: loadedUser.email,
                userId: loadedUser._id
            }, 'secret', {
                expiresIn: '1h'
            });

            res.status(200).json({
                token: token,
                userId: loadedUser._id
            })

        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })

}




exports.getStatus = (req, res, next) => {
    const userId = req.userId;

    Post.findByPk(userId)
        .then(user => {
            if (!user) {
                const error = new Error('User Does not existe.');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                message: 'status fetched successfuly',
                status: user.status
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.updateStatus = (req, res, next) => {
    const userId = req.userId;
    const newStatus = req.body.status;

    User.findByPk(userId)
        .then(user => {
            if (!user) {
                const error = new Error('User doos not existe');
                error.statusCode = 500;
                throw error;
            }
            if (user._id !== userId) {
                const error = new Error('Not Authorized');
                error.statusCode = 500;
                throw error;
            }
            user.status = newStatus;
            return user.save();
        })
        .then(user => {
            res.status(200).json({
                message: 'Status updated successfuly.',
                user: user
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.getStatus = (req, res, next) => {
    const userId = req.userId;


    User.findByPk(userId)
        .then(user => {
            if (!user) {
                const error = new Error('User Does not existe.');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                message: 'status fetched successfuly',
                status: user.status
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.updateStatus = (req, res, next) => {
    const userId = req.userId;
    const newStatus = req.body.status;

    User.findByPk(userId)
        .then(user => {
            if (!user) {
                const error = new Error('User doos not existe');
                error.statusCode = 500;
                throw error;
            }
            if (user._id !== userId) {
                const error = new Error('Not Authorized');
                error.statusCode = 500;
                throw error;
            }
            user.status = newStatus;
            return user.save();
        })
        .then(user => {
            res.status(200).json({
                message: 'Status updated successfuly.',
                user: user
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};