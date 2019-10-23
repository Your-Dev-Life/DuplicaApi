const config = require('../server/config/config');
const logger = require('../server/logger/logger')({ config });
const dbTest = require('../server/utils/db');
const userController = require('../server/api/user/userController');

const initConfig = () => {
  logger.info('Initializing config files for test...');
  process.env.NODE_ENV = 'test';
  config.init();
  dbTest.mongoose.set('bufferCommands', false);
  // dbTest.mongoose.set('debug', config.mongooseDebug);
  logger.info('Config files for test initialized.');
  return config;
};

const initModels = async () => {
  logger.info('Initializing models for test...');
  const models = dbTest.mongoose.modelNames();
  if (models) {
    const results = [];
    for (let i = 0; i < models.length; i += 1) {
      const model = models[i];
      results.push(dbTest.mongoose.models[model].ensureIndexes());
    }
    await Promise.all(results);
  }
  logger.info('Models for test initialized.');
};

const createUserManager = async () => {
  logger.info('Creating user manager...');
  await userController.createManagerUser({
    username: config.userManager,
    password: config.passManager,
  });
  logger.info('User manager created.');
};

const startDB = async () => {
  logger.info('Starting the DB connection...');
  await dbTest.connect();
  logger.info('DB connection started.');
};

const cleanDB = async () => {
  logger.info('Cleaning the DB ...');
  await dbTest.mongoose.connection.dropDatabase();
  logger.info('DB cleaned');
};

const init = async () => {
  initConfig();
  await startDB();
  await cleanDB();
  await initModels();
  await createUserManager();
};

const close = async (done) => {
  logger.info('Closing the DB connection...');
  await dbTest.disconnect();
  logger.info('DB connection closed.');
  done();
};

module.exports = {
  init,
  initConfig,
  close,
};
