
const mongoose = require('mongoose');
const { mongoConnectionString } = require('../config');

const User = require('../models/User');

mongoose.connect(mongoConnectionString, { useNewUrlParser: true });

const strlog = what => console.log(JSON.stringify(what, null, 2));


const fakeCredentials = { 
  username: 'chiefsmurph',
  password: 'mypassword'
};

(async () => {
  strlog({
    users: await User.find({})
  });

  const newUser = await User.createAccount(fakeCredentials);
  strlog({ newUser });

  const login = await User.login(fakeCredentials);
  strlog({ login})


  const wrong = await User.login({
    ...fakeCredentials,
    password: 'wrongPassword'
  });

  strlog({ wrong})
})();