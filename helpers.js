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

const getDate = function() {
  const today = new Date();

  let day = today.getDate();
  if (day < 10) {
    day = `0${day}`;
  }

  const monthNum = today.getMonth();
  let month;
  switch(monthNum) {
    case 0:
      month = "January";
      break;
    case 1:
      month = "February";
      break;
    case 2:
      month = "March";
      break;
    case 3:
      month = "April";
      break;
    case 4:
      month = "May";
      break;
    case 5:
      month = "June";
      break;
    case 6:
      month = "July";
      break;
    case 7:
      month = "August";
      break;
    case 8:
      month = "September";
      break;
    case 9:
      month = "October";
      break;
    case 10:
      month = "November";
      break;
    case 11:
      month = "December";
      break;
  }

  const year = today.getFullYear();

  let am_pm = "a.m.";
  let hour = today.getHours();
  hour -= 7;
  if (hour < 0) {
    hour += 24;
  }
  if (hour > 11) {
    hour -= 12;
    am_pm = "p.m.";
  }
  if (hour === 0 && am_pm === "a.m.") {
    hour = 12;
  }

  const minute = today.getMinutes();
  
  return (`${month}/${day}/${year} at ${hour}:${minute} ${am_pm}`);
}

module.exports = { 
  getUserByEmail,
  generateRandomString,
  urlsForUser,
  getDate
};