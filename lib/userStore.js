import Boom from 'boom';
import bcrypt from 'bcrypt';

let UserStore = {
  users: {},

  initialize: () => {
    UserStore.createUser('Sam', 'sam@test.com', 'password');
  },

  createUser: (name, email, password, callback) => {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) => {
        let user = {
          name: name,
          email: email,
          passwordHash: hash
        };

        if (UserStore.users[email]) {
          callback(Boom.conflict('Email already exists, please login.'));
        } else {
          UserStore.users[email] = user;

          if(callback) callback();
        }
      });
    });
  },

  validateUser: (email, password, callback) => {
    let user = UserStore.users[email];


    if (!user) {
      callback(Boom.notFound('User does not exist.'));
    }

    bcrypt.compare(password, user.passwordHash, (err, isValid) => {
      if (!isValid) {
        callback(Boom.unauthorized('Password does not match.'));
      } else {
        callback(null, user);
      }
    })
  }
}

export default UserStore;
