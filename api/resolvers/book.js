module.exports = {
  author: async (book, args, { models }) => {
    return await models.User.findById(book.author);
  },
  favoritedBy: async (book, args, { models }) => {
    return await models.User.find({ _id: { $in: book.favoritedBy } });
  },
};
