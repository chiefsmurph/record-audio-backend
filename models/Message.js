const mongoose = require('mongoose');
const { Schema } = mongoose;

// const bcrypt = require('bcrypt-promise');
// const generateToken = require('../utils/generate-token');

const schema = new Schema({
  timestamp: { type : Date, default: Date.now },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  name: String,
  fileName: String,
  isPrivate: {
    type: Boolean,
    default: false
  },
  recipientUser: String
});

schema.statics.getFeed = async function(username) {

  const getCondition = condition => 
    this
      .find(condition)
      .sort({ _id: -1 })
      .limit(20)
      .populate('user', {
        username: 1,
        age: 1,
        sex: 1,
        location: 1,
        _id: 0
      })
      .lean();
  
  return {
    public: await getCondition({
      isPrivate: false
    }),
    private: await getCondition({
      isPrivate: true,
      recipientUser: username
    })
  };
};

const Message = mongoose.model('Message', schema);
module.exports = Message;