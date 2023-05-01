const models = require("../src/models");

//file: src/resolvers/query.js
module.exports = {
  hello: () => "Hello world!",
  books: async () => {
    return await models.Book.find().limit(100);
  },
  book: async (parent, args) => {
    return await models.Book.findById(args.id);
  },
  users: async (parent, args, { models }) => {
    return await models.User.find({}).limit(100);
  },
  user: async (parent, { username }, { models }) => {
    return await models.User.findOne({ username });
  },
  me: async (parent, args, { models, user }) => {
    return await models.User.findById(user.id);
  },
  bookFeed: async (parent, { cursor }, { models }) => {
    // data limit to 5 items
    const limit = 5;
    // set the default hasNextPage value to false
    let hasNextPage = false;
    // if no cursor is passed the default query will be empty
    // this will pull the newest books from the db
    let cursorQuery = {};
    // if there is a cursor
    // our query will look for books with an ObjectId less than that of the cursor
    if (cursor) {
      cursorQuery = { _id: { $lt: cursor } };
    }
    // find the limit + 1 of books in our db, sorted newest to oldest
    let books = await models.Book.find(cursorQuery)
      .sort({ _id: -1 })
      .limit(limit + 1);
    // if the number of books we find exceeds our limit
    // set hasNextPage to true and trim the books to the limit
    if (books.length > limit) {
      hasNextPage = true;
      books = books.slice(0, -1);
    }
    // the new cursor will be the MongoDB object ID of the last item in the feed array
    // last it will return books, cursor and hasNextPage
    const newCursor = books[books.length - 1]._id;
    return {
      books,
      cursor: newCursor,
      hasNextPage,
    };
  },
};
