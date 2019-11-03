const mongoose = require('mongoose');
const { Schema } = mongoose;

const bcrypt = require('bcrypt-promise');
const generateToken = require('../utils/generate-token');

const schema = new Schema({
  username: String,
  hash: String,
  authTokens: [String],
});

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

schema.statics.createAccount = async function({ username, password }) {
  const doc = await this.create({
    username,
    hash: await bcrypt.hash(password, 10),
    authTokens: [generateToken()]
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

const User = mongoose.model('User', schema);
module.exports = User;