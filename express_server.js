const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const methodOverride = require('method-override')

const { getUserByEmail } = require('./helpers');
const { urlsForUser } = require('./helpers');
const { generateRandomString } = require('./helpers');

const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));
app.use(bodyParser.urlencoded({extended: true}));
// override with POST having ?_method=DELETE
app.use(methodOverride('_method'));

const urlDatabase = {}; // contains url objects keyed to their shortened URL with the objects containing the associated longURL and userID that created it
const users = {}; // contains user objects keyed to their randomized ID with those objects contianing their id, email, and password

app.get('/', (req, res) => {
  for (const userID of Object.keys(users)) {
    if (req.session.user_id === userID) {
      res.redirect(`/urls`);
    }
  }
  res.redirect(`/login`);
});

app.delete("/logout", (req, res) => {
  req.session = null;
  // res.clearCookie("user_id");
  res.redirect(`/urls`);
});

app.put("/login", (req, res) => {
/*   if (getUserByEmail(req.body.email, users)) {
    return res.send("Error code 400! Email not found in list of registered users!");
  } */
  const user = getUserByEmail(req.body.email, users);
  if (!user) {
    return res.send("Error code 400! Email not found in list of registered users!");
    //res.status(400).send("Email not found in list of registered users!") // use this instead?
  }
  if (bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = users[user.id].id;      // using req now instead of res?
    // res.cookie("user_id", users[user].id);
    return res.redirect(`/urls`);
  }
  return res.send("Error code 400! Incorrect password!");

  /* for (user in users) {
    if (req.body.email === users[user].email) {
      if (bcrypt.compareSync(req.body.password, users[user].password)) {
        req.session.user_id = users[user].id;      // using req now instead of res?
        // res.cookie("user_id", users[user].id);
        return res.redirect(`/urls`);
      }
      return res.send("Error code 400! Incorrect password!");
    }
  }
  return res.send("Error code 400! Email not found in list of registered users!"); */
});

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    return res.send("Error code 400! No email or password entered!");  // return added because it was adding the user in anyway (could use an else here? Gary just told us not to)
  }
  if (getUserByEmail(req.body.email, users)) {
    return res.send("Error code 400! Email already taken!");
  }
  /*  for (user in users) {
    if (req.body.email === users[user].email) {
      return res.send("Error code 400! Email already taken!");  // consider creating a function to do this to DRY code up
    }
  } */
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)  // using bcrypt here now
  };
  req.session.user_id = userID;
  // res.cookie("user_id", userID);
  res.redirect(`/urls`);
});

app.post("/urls", (req, res) => {
  const randomString = generateRandomString();
  if (req.session.user_id === undefined) {
    return res.send("Error! User not logged in, post permission denied!");
  }
  urlDatabase[randomString] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${randomString}`);
});

app.delete("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect(`/urls`);
});

app.put("/urls/:shortURL/redirect", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.put("/urls/:id", (req, res) => {
  if (req.session.user_id === undefined) {
    return res.send("Error! User not logged in, post permission denied!");
  }
  // console.log("which page is this");  // this function is for editing an existing longURL
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;        // why is this different to every other one? Not quite sure
  }
  res.redirect(`/urls`);
});

app.get("/u/:shortURL", (req, res) => {
  // const longURL = urlDatabase[req.params.shortURL]
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: { ...urlsForUser(req.session.user_id, urlDatabase) },
    user_id: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id === undefined) {
    return res.redirect("/login");
  }
  const templateVars = {
    user_id: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user_id: users[req.session.user_id]
  };
  res.render("urls_login", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user_id: users[req.session.user_id]
  };
  res.render("urls_register", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!(urlDatabase[req.params.shortURL])) {
    return res.send("Error! URL for given ID does not exist!");
  }
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.render("urls_show", {shortURL: undefined, longURL: undefined, user_id: undefined}); // used as a placeholder to relay that user is not logged in
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user_id: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});