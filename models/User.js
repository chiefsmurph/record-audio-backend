const mongoose = require('mongoose');
const { Schema } = mongoose;

const bcrypt = require('bcrypt-promise');
const generateToken = require('../utils/generate-token');

const schema = new Schema({
  username: String,
  hash: String,
  authTokens: [String],
});

schema.statics.createAccount = async function({ username, password }) {
  console.log('creating static', username, password);
  const hash = await bcrypt.hash(password, 10);
  console.log({ hash });
  const authToken = generateToken();
  console.log({ authToken })
  const doc = await new this({
    username,
    hash,
    authTokens: [authToken]
  });
  console.log({
    action: 'User::createAccount',
    username,
  });
  return {
    success: !!doc,
    doc
  };
};

schema.statics.login = async function({ username, password }) {
  const foundUser = await this.findOne({ username }, { hash: 1 });
  if (!foundUser) return { success: false };
  const { hash, _id } = foundUser;
  // console.log({ response });
  const success = await bcrypt.compare(password, hash);
  let authToken;
  if (success) {
    authToken = generateToken();
    await this.update({ _id }, { $push: { authTokens: authToken }});
  }
  console.log({
    action: 'User::login',
    username,
    success,
    authToken
  });
  return { success, authToken };
};

schema.statics.authToken = async function({ username, authToken }) {
  const success = await this.find({
    username,
    authTokens: authToken
  });
  console.log({
    action: 'User::authToken',
    username,
    success,
  });
  return { success };
};

const User = mongoose.model('User', schema);
module.exports = User;