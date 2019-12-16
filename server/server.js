const express = require('express');

const api = require('./api');
const auth = require('./auth/authRoutes');

const server = ({ middleware }) => {
  const app = express();

  // Setup the app middleware's
  middleware.appMiddleware(app);

  // Setup the api routes
  app.use('/api/', api);
  app.use('/auth/', auth);

  // Setup the global error handling
  app.use(middleware.errorHandlingMiddleware);
  return app;
};


// Exports the app for tests
module.exports = server;
