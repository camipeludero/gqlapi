//Include mongoose library
mongoose = require("mongoose");
module.exports = {
  connect: (DB_URL) => {
    mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    //Log an error if we fail to connect
    mongoose.connection.on("error", (err) => {
      console.error(err);
      console.log("MongoDB connection failed: " + DB_URL);

      process.exit();
    });
    mongoose.connection.once("open", () => console.log("Connected to MongoDB"));
  },

  //close the connection
  close: () => {
    mongoose.connection.close();
  },
};
