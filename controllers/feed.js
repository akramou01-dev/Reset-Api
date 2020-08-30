const { validationResult } = require('express-validator/check');
const Post = require('../models/Post');
const Creator = require('../models/Creator');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const imageClear = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}

exports.getPosts = (req, res, next) => {
    const page = req.query.page || 1;
    let nbrPost;
    let postsPerPage = 2;

    Post
        .count()
        .then(nbrPost => {
            nbrPost = nbrPost;
            return Post.findAll({
                order: ['_id'],
                offset: ((page - 1) * postsPerPage),
                limit: postsPerPage,
            })
        })  
        .then(posts => {

            res.status(200).json({
                message: 'Posts fetched',
                posts: posts,
                totalItems: nbrPost

            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err)
        })
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findByPk(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find the post');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                message: 'Post fetched',
                post: post
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.createPost = (req, res, next) => {
    const userId = req.userId;
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    if (!req.file) {
        const error = new Error('Please inser an image');
        error.statusCode = 422;
        throw (error);
    }
    const imageUrl = req.file.path.replace("\\", "/");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Data incorrecte');
        error.statusCode = 422;
        throw error;
    }
    // create post in the DB
    User.findByPk(userId)
        .then(user => {
            if (!user) {
                const error = new Error('User Does not existe.');
                error.statusCode = 422;
                throw error;
            }
            creator = user;
            return user.createPost({
                title: title,
                content: content,
                imageUrl: imageUrl,
            })
        })
        .then(post => {
            post.creatorId = creator._id
            res.status(201).json({
                message: 'Post createed susscessfuly!',
                post: post,
                creator: {
                    _id: creator._id,
                    name: creator.name
                }
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            };
            next(err);
        });
};


exports.updatePost = (req, res, next) => {
    const userId = req.userId;
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;

    if (req.file) {
        imageUrl = req.file.path.replace("\\", "/");
    };
    if (!imageUrl) {
        const error = new Error('Please enter an image');
        error.statusCode = 500;
        throw error;
    };
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Data incorrecte');
        error.statusCode = 422;
        throw error;
    };
    Post.findByPk(postId)
        .then(post => {
            if (!post) {
                const error = new Error('No post find.');
                error.statusCode = 422;
                throw error;
            }
            if (post.userId !== userId) {
                const error = new Error('Not Authorize')
                error.statusCode = 403;
                throw error;
            }
            post.title = title;
            post.content = content;
            if (imageUrl !== 'undefined') {
                imageClear(post.imageUrl);
                post.imageUrl = imageUrl;
            }
            return post.save()
                .then(updatedPost => {
                    updatedPost.creatorId = userId;
                    res.status(200).json({
                        message: 'The post was updated',
                        post: updatedPost
                    });
                });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            };
            next(err);
        });
};

exports.deletePost = (req, res, next) => {
    const userId = req.userId;
    const postId = req.params.postId;
    Post.findByPk(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Post Does not existe');
                error.statusCode = 500;
                throw error;
            };
            if (post.userId !== userId) {
                const error = new Error('Not Authorize')
                error.statusCode = 403;
                throw error;
            }
            // chek logged in user
            imageClear(post.imageUrl);
            return Post.destroy({
                where: {
                    // cheking the userId
                    _id: post._id
                }
            });
        })
        .then(result => {
            console.log(result);
            res.status(200).json({
                message: 'Post deleted successfuly.'
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            };
            next(err);
        })
}