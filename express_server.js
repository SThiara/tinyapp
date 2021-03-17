const express = require('express');
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080;

app.use(cookieParser());
app.set('view engine', 'ejs');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

/* const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}; */

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = { 
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
}

function generateRandomString() {
  const r = Math.random().toString(36).substr(2, 6);
  return r;
}

function urlsForUser(id) {
  const matchedURLs = {};
  for (url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      matchedURLs[url] = { ...urlDatabase[url] };
    }
  }
  return matchedURLs;
}

app.get('/', (req, res) => {
  res.send("Hello!");
})

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  for (user in users) {
    if (req.body.email === users[user].email) {
      if (req.body.password === users[user].password) {
        res.cookie("user_id", users[user].id);
        //res.cookie(users[user].id, users[user].id);
        //res.cookie(user_id, users[user].id);
        return res.redirect(`/urls`);
      }
      return res.send("Error code 400! Incorrect password!");
    }
  }
  return res.send("Error code 400! Email not found in list of registered users!");
});

app.post("/register", (req, res) => { 
  if (req.body.email === "" || req.body.password === "") {
    return res.send("Error code 400! No email or password entered!");  // return added because it was adding the user in anyway (could use an else here? Gary just told us not to)
  }
  for (user in users) {
    if (req.body.email === users[user].email) {
      return res.send("Error code 400! Email already taken!");  // consider creating a function to do this to DRY code up
    }
  }
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: req.body.password
  }
  res.cookie("user_id", userID);
  //res.cookie(users[user].id, users[user].id);
  res.redirect(`/urls`); 
});

app.post("/urls", (req, res) => {
  const randomString = generateRandomString();
  urlDatabase[randomString] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"]
  };
  res.redirect(`/urls/${randomString}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL]
  };
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL/redirect", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/urls/:id", (req, res) => {
  // console.log("which page is this");  // this function is for editing an existing longURL
  if (req.cookies["user_id"] === urlDatabase[req.params.id].userID) {
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
    urls: { ...urlsForUser(req.cookies["user_id"]) },
    user_id: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"] === undefined) {
    return res.redirect("/login");
  }
  const templateVars = { 
    user_id: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { 
    user_id: users[req.cookies["user_id"]]
  };
  res.render("urls_login", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { 
    user_id: users[req.cookies["user_id"]]
  };
  res.render("urls_register", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (req.cookies["user_id"] !== urlDatabase[req.params.shortURL].userID) {
    return res.render("urls_show", {shortURL: undefined, longURL: undefined, user_id: undefined}); // used as a placeholder to relay that user is not logged in
  }
  const templateVars = { 
    shortURL: req.params.shortURL,
     longURL: urlDatabase[req.params.shortURL].longURL,
     user_id: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
})