const User = require("../models/User");
const Post = require("../models/Post");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const imageClear = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};

module.exports = {
  createUser: async function ({ userInput }, req) {
    console.log(userInput);
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({
        message: "email invalid",
        statusCode: 500,
      });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5, max: 15 })
    ) {
      errors.push({
        message: "password is required and is between 5 and 15 caracters",
        statusCode: 500,
      });
    }
    if (errors.length !== 0) {
      const error = new Error("Invalid inputs !");
      error.data = errors;
      throw error;
    }
    const existingUser = await User.findOne({
      where: { email: userInput.email },
    });
    if (existingUser) {
      const error = new Error("user existe already");
      throw error;
    }
    const hashedPassword = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPassword,
    });
    const userCreated = await user.save();
    return {
      _id: userCreated._id,
      email: userCreated.email,
      name: userCreated.name,
    };
  },
  login: async function ({ email, password }) {
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      const error = new Error("user not found");
      error.code = 404;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("password incorrecte");
      error.code = 500;
      throw error;
    }
    const token = jwt.sign(
      {
        user_id: user._id,
        email: user.email,
      },
      "mustbesecretfornewmadina",
      {
        expiresIn: "1h",
      }
    );
    return {
      token: token,
      user_id: user._id,
    };
  },
  createPost: async function ({ postInput }, req) {
    console.log(postInput);
    if (!req.isAuth) {
      const error = new Error("not authenticated");
      error.code = 401;
      throw error;
    }
    const errors = [];
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 4 })
    ) {
      errors.push({
        message: "title is required and must have at least 4 caracters",
      });
    }
    if (errors.length !== 0) {
      const error = new Error("Invalid inputs !");
      error.data = errors;
      throw error;
    }
    const user = await User.findByPk(req.user_id);
    if (!user) {
      const error = new Error("invalid user");
      error.code = 401;
      throw error;
    }
    const createdPost = await user.createPost({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
    });
    const creator = user.name;
    return {
      _id: createdPost._id,
      title: createdPost.title,
      imageUrl: createdPost.imageUrl,
      content: createdPost.content,
      createdAt: createdPost.createdAt,
      creator: creator,
    };
  },
  Posts: async function ({ page }, req) {
    if (!req.isAuth) {
      const error = new Error("not authenticated");
      error.code = 401;
      throw error;
    }
    if (!page) {
      page = 1;
    }
    const perPage = 2;
    const totalPosts = await Post.count();
    const posts = await Post.findAll({
      order: ["_id"],
      offset: (page - 1) * perPage,
      limit: perPage,
    });
    const new_posts = posts.map(async (p) => {
      const creator = await User.findByPk(p.userId);
      return {
        _id: p._id,
        title: p.title,
        content: p.content,
        createdAt: p.createdAt,
        creator: creator.name,
        imageUrl: p.imageUrl,
      };
    });
    return {
      posts: new_posts,
      totalPosts: totalPosts,
    };
  },
  Post: async function ({ postId }, req) {
    if (!req.isAuth) {
      const error = new Error("not authenticated");
      error.code = 401;
      throw error;
    }
    const post = await Post.findByPk(postId);
    if (!post) {
      const error = new Error("fetching data failed");
      error.code = 404;
      throw error;
    }
    const creator = await User.findByPk(post.userId);
    return {
      _id: post._id,
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      creator: creator.name,
      createdAt: post.createdAt,
    };
  },
  updatePost: async function ({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("not authenticated");
      error.code = 401;
      throw error;
    }
    const post = await Post.findByPk(id);
    if (!post) {
      const error = new Error("Failed to load infos");
      error.code = 404;
      throw error;
    }
    if (post.userId !== req.user_id) {
      const error = new Error("Not authorized");
      error.code = 403;
      throw error;
    }
    const errors = [];
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 4 })
    ) {
      errors.push({
        message: "title is required and must have at least 4 caracters",
      });
    }
    if (errors.length !== 0) {
      const error = new Error("Invalid inputs !");
      error.data = errors;
      throw error;
    }
    post.title = postInput.title;
    post.content = postInput.content;
    if (postInput.imageUrl !== "undefined") {
      imageClear(post.imageUrl);
      post.imageUrl = imageUrl;
    }
    const updatedPost = await post.save();
    const creator = await User.findByPk(updatedPost.userId);
    return {
      _id: updatedPost._id,
      content: updatedPost.content,
      title: updatedPost.title,
      creator: creator.name,
      imageUrl: updatedPost.imageUrl,
      createdAt: updatedPost.createdAt,
    };
  },
  deletePost: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error("not authenticated");
      error.code = 401;
      throw error;
    }
    const post = await Post.findByPk(id);
    if (!post) {
      const error = new Error("Failed to load infos");
      error.code = 404;
      throw error;
    }
    if (post.userId !== req.user_id) {
      const error = new Error("Not authorized");
      error.code = 403;
      throw error;
    }
    imageClear(post.imageUrl);
    await Post.destroy({ where: { _id: post._id } });
    return true;
  },
  Status: async function (args, req) {
    if (!req.isAuth) {
      const error = new Error("not authenticated");
      error.code = 401;
      throw error;
    }
    const user = await User.findByPk(req.user_id);
    if (!user) {
      const error = new Error("User not found");
      error.code = 404;
      throw error;
    }
    return user.status;
  },
  updateStatus: async function ({ status }, req) {
    if (!req.isAuth) {
      const error = new Error("not authenticated");
      error.code = 401;
      throw error;
    }
    const user = await User.findByPk(req.user_id);
    if (!user) {
      const error = new Error("User not found");
      error.code = 404;
      throw error;
    }
    console.log(status); 
    user.status = status ; 
    const new_user = await user.save(); 
    console.log(new_user)
    return{
        _id : new_user._id, 
    };
  },
};
