const models = require("../src/models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  AuthenticationError,
  ForbiddenError,
} = require("apollo-server-express");
require("dotenv").config();
const gravatar = require("../gravatar");

module.exports = {
  addBook: async (parent, args, { models, user }) => {
    if (!user) {
      throw new AuthenticationError("You must login to create a new book");
    }
    return await models.Book.create({
      title: args.title,
      author: new mongoose.Types.ObjectId(user.id),
    });
  },
  updateBook: async (parent, { id, title }, { models, user }) => {
    if (!user) {
      throw new AuthenticationError("You must sign in to update a book.");
    }
    //get the book by Id
    const book = await models.Book.findById(id);
    //check book author and current user are not same raise forbidden error
    if (book && String(book.author) !== user.id) {
      throw new ForbiddenError("You don't have permission to modify the book");
    }
    return await models.Book.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $set: {
          title,
        },
      },
      {
        new: true,
      }
    );
  },
  deleteBook: async (parent, { id }, { models, user }) => {
    if (!user) {
      throw new AuthenticationError("You must sign in to delete a book.");
    }

    const book = await models.Book.findById(id);

    if (book && String(book.author) !== user.id) {
      throw new ForbiddenError("You don't have permissions to delete the book");
    }
    console.log("book", book);
    try {
      await book.deleteOne();
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  },

  signUp: async (parent, { username, email, password }, { models }) => {
    // normalize email address
    email = email.trim().toLowerCase();
    // hash the password
    const hashed = await bcrypt.hash(password, 10);
    // create the gravatar url
    const avatar = gravatar(email);
    try {
      const user = await models.User.create({
        username,
        email,
        avatar,
        password: hashed,
      });
      // create and return the json web token
      return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    } catch (err) {
      console.log(err);
      throw new Error("Error creating account");
    }
  },
  signIn: async (parent, { username, email, password }, { models }) => {
    if (email) {
      email = email.trim().toLowerCase();
    }
    const user = await models.User.findOne({
      $or: [{ email }, { username }],
    });
    // if there is no user, throw an authentication error
    if (!user) {
      throw new AuthenticationError("Error signing in");
    }
    // if the passwords don't match, throw an authentication error
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AuthenticationError("Error signing in");
    }
    // create and return the json web token
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  },
  toggleFavorite: async (parent, { id }, { models, user }) => {
    if (!user) {
      throw new AuthenticationError("You must sign in.");
    }
    // check user already made it favorite the book
    let bookCheck = await models.Book.findById(id);

    const hasUser = bookCheck.favoritedBy.indexOf(user.id);
    // if the user exists in the list
    // pull them from the list and reduce the favoriteCount by 1
    if (hasUser >= 0) {
      return await models.Book.findByIdAndUpdate(
        id,
        {
          $pull: {
            favoritedBy: new mongoose.Types.ObjectId(user.id),
          },
          $inc: {
            favoriteCount: -1,
          },
        },
        {
          // Set new to true to return the updated doc
          new: true,
        }
      );
    } else {
      // if the user doesn't exist in the list
      // add them to the list and increment the favoriteCount by 1
      return await models.Book.findByIdAndUpdate(
        id,
        {
          $push: {
            favoritedBy: new mongoose.Types.ObjectId(user.id),
          },
          $inc: {
            favoriteCount: 1,
          },
        },
        {
          new: true,
        }
      );
    }
  },
};
