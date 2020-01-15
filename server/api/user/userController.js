/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const _ = require('lodash');

const User = require('./userModel');

const userController = ({ middleware, appError, auth }) => {
  const goNext = (user, req, next) => {
    req.userModel = user;
    req.leanUser = user.toObject();
    return next();
  };

  const params = async (req, res, next, id) => {
    await User.findById(id)
      .select('-password -__v')
      .exec()
      .then((user) => {
        if (!user) {
          return next(appError.buildError(null, 403, 'Invalid id'));
        }
        return goNext(user, req, next);
      })
      .catch(appError.catchError(next));
  };

  const me = async (req, res) => {
    await res.json(req.user);
  };

  const list = async (req, res, next) => {
    await User.find({})
      .select('-password -__v')
      .exec()
      .then(users => res.json(users))
      .catch(appError.catchError(next));
  };


  const buildSavedUser = (savedUser) => {
    const adminUser = _.pick(savedUser, ['_id', 'username', 'role']);
    const token = auth.signToken(adminUser);
    return _.assign(adminUser, { token });
  };

  const save = async (user, res, next) => {
    await user.save()
      .then(savedUser => res.json(buildSavedUser(savedUser)))
      .catch(appError.catchError(next, 'Username already exists.'));
  };

  const create = async (req, res, next) => {
    await middleware.appValidation.validateRequest(req, res);
    await save(new User(req.body), res, next);
  };

  const createManagerUser = async (data) => {
    await (new User(data)).save()
      .then(savedUser => buildSavedUser(savedUser));
  };

  const read = async (req, res, next) => {
    if (!req.leanUser) {
      await next(appError.buildError(null, 404, 'User not found!'));
    } else {
      await res.json(req.leanUser);
    }
  };

  const update = async (req, res, next) => {
    await middleware.appValidation.validateRequest(req, res);
    const { userModel } = req;
    const updateUser = req.body;
    _.merge(userModel, updateUser);
    await save(userModel, res, next);
  };

  const deleteUser = async (req, res, next) => {
    await req.userModel.remove()
      .then(removedUser => res.json(removedUser))
      .catch(appError.catchError(next));
  };

  return {
    params,
    me,
    list,
    create,
    createManagerUser,
    read,
    update,
    delete: deleteUser,
  };
};

module.exports = userController;
