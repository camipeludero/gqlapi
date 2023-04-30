module.exports = {
  books: async (user, args, { models }) => {
    return await models.Book.find({ author: user._id }).sort({ _id: -1 });
  },
  favorites: async (user, args, { models }) => {
    return await models.Book.find({ favoritedBy: user._id }).sort({ _id: -1 });
  },
};
