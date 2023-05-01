const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const depthLimit = require("graphql-depth-limit");
const { createComplexityLimitRule } = require("graphql-validation-complexity");

const typeDefs = require("./schema");
const resolvers = require("./resolvers");
const models = require("./models");
const db = require("./db");

const app = express();
app.use(cors());

require("dotenv").config();
const PORT = process.env.PORT;

if (process.env.NODE_ENV === "production") {
  db.connect(process.env.MONGODB_URI);
} else {
  db.connect(process.env.MONGODB_URI_DEV);
}

//Auth
const getUser = (token) => {
  if (token) {
    try {
      // return the user information from the token
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // if there's a problem with the token, throw an error
      throw new Error("Session invalid");
    }
  }
};
//Create an instance of Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization;
    const user = getUser(token);
    console.log(user); // for now, let's log the user to the console:
    return { models, user };
  },
  validationRules: [depthLimit(5), createComplexityLimitRule(1000)],
  playground: true,
  introspection: true,
});

//Apply the Apollo GraphQL middleware and set the path to /api
server.start().then(() => server.applyMiddleware({ app, path: "/api" }));

app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
