const getUserByEmail = function(email, database) {
  for (user in database) {
    if (email === database[user].email) {
      return database[user];
    }
  }
  return false;
};

module.exports = { getUserByEmail };