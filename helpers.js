const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (email === database[user].email) {
      return database[user];
    }
  }
  return false;
};

const generateRandomString = function() {
  const r = Math.random().toString(36).substr(2, 6);
  return r;
};

const urlsForUser = function(id, database) {
  const matchedURLs = {};
  for (const url in database) {
    if (id === database[url].userID) {
      matchedURLs[url] = { ...database[url] };
    }
  }
  return matchedURLs;
};

module.exports = { 
  getUserByEmail,
  generateRandomString,
  urlsForUser
};