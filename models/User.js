const mongoose = require('mongoose');
const { Schema } = mongoose;

const bcrypt = require('bcrypt-promise');
const generateToken = require('../utils/generate-token');
const Message = require('./Message');

const schema = new Schema({
  username: String,
  hash: String,
  authTokens: [String],

  age: Number,
  sex: String,
  location: String,

});

schema.statics.createAccount = async function({ username, password, age, location, sex }) {
  console.log('creating static', username, password);
  const usernameTaken = await this.findOne({ username });
  if (usernameTaken) {
    return {
      success: false,
      reason: 'username already taken'
    };
  }
  const hash = await bcrypt.hash(password, 10);
  console.log({ hash });
  const authToken = generateToken();
  console.log({ authToken })
  const doc = await this.create({
    username,
    hash,
    authTokens: [authToken],
    age,
    location,
    sex
  });
  console.log({
    action: 'User::createAccount',
    username,
    doc,
    age,
    location,
    sex,
    doc
  });
  return {
    success: !!doc,
    authToken,
    username,
    age,
    location,
    sex,
  };
};

schema.statics.login = async function({ username, password }) {
  console.log('statics login', username, password)
  const foundUser = await this.findOne({ username }).lean();
  console.log({ foundUser })
  if (!foundUser) return { success: false };
  const { hash, _id } = foundUser;
  console.log({ foundUser });
  const success = await bcrypt.compare(password, hash);
  let authToken;
  console.log({ success })
  if (success) {
    authToken = generateToken();
    await this.update({ _id }, { $push: { authTokens: authToken }});
  }
  console.log({
    action: 'User::login',
    username,
    success,
    authToken,
    ...foundUser,
    foundUser
  });
  return { success, authToken, ...foundUser };
};

schema.statics.authToken = async function({ username, authToken }) {
  const foundUser = await this.findOne({
    username,
    authTokens: authToken
  }).lean();
  const success = !!foundUser;
  console.log({
    action: 'User::authToken',
    username,
    success,
    authToken,
  });
  return { success, ...foundUser };
};

schema.statics.getProfile = async function(username) {
  const user = await this.findOne({
    username,
  }).lean();
  const publicMessages = await Message.find({
    isPrivate: false,
    user: user._id
  }).sort({ _id: -1 }).lean();
  return {
    user,
    publicMessages
  };
};

const User = mongoose.model('User', schema);
module.exports = User;