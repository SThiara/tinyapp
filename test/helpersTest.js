const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');
const { urlsForUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testUrlDatabase = {
  "abcdef": {
    longURL: "https://www.google.com",
    userID: "123456",
    visit_count: 0,
    unique_visitors: ["turkey"],
    visit_times: []
  },
  "123456": {
    longURL: "https://www.apple.com",
    userID: "abcdef",
    visit_count: 0,
    unique_visitors: ["lurkey"],
    visit_times: []
  },
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert(user.id, expectedOutput);
  });
  it('should return false with an invalid email', function() {
    const user = getUserByEmail("user@example.coom", testUsers);
    assert.isFalse(user, false);
  });
});

describe('urlsForUser', function() {
  it('should return the entire URL object if a userID exists within the urlDatabase', function() {
    const user = urlsForUser("123456", testUrlDatabase);
    const expectedOutput = {
      "abcdef": {
        longURL: "https://www.google.com",
        userID: "123456",
        visit_count: 0,
        unique_visitors: ["turkey"],
        visit_times: []
      }
    };
    assert(user, expectedOutput);
  });
});