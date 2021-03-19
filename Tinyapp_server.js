const express = require('express');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const methodOverride = require('method-override')

const { getUserByEmail } = require('./helpers');
const { urlsForUser } = require('./helpers');
const { generateRandomString } = require('./helpers');
const { getDate } = require('./helpers');

const bcrypt = require('bcrypt');
const PORT = 8080;
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));

const urlDatabase = {}; // contains url objects keyed to their shortURL; those objects contain the longURL, the userID that created it, a visit count, an array of all unique visitors, and an array of objects that list the visitor and time
const users = {}; // contains user objects keyed to their randomized ID; those objects contain that id along with an email and password


app.put("/login", (req, res) => { // logs a user in if the correct email and password are provided
  const user = getUserByEmail(req.body.email, users);
  if (!user) {
    return res.status(400).render("urls_error", { 
      user_id: users[req.session.user_id],
      errorMessage: "Email not found in list of registered users!" });
  }
  if (bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = users[user.id].id;
    return res.redirect(`/urls`);
  }
  return res.status(400).render("urls_error", { 
    user_id: users[req.session.user_id],
    errorMessage: "Incorrect password!" });
});

app.put("/urls/:id", (req, res) => {  // this is for editing the longURL associated with a particular shortURL
  if (req.session.user_id === undefined) {
    return res.status(400).send("User not logged in, post permission denied!"); // this part is to deny curl workarounds...probably
  }
  if (req.session.user_id === urlDatabase[req.params.id].userID) {  
    urlDatabase[req.params.id].longURL = req.body.longURL;
  }
  res.redirect(`/urls`);
});

app.post("/register", (req, res) => { // registers a user if they enter a "valid" email (very loose definition for valid) that isn't already taken and a password field that isn't empty
  if (req.body.email === "" || req.body.password === "") {
    return res.status(400).render("urls_error", { 
      user_id: users[req.session.user_id],
      errorMessage: "No email or password entered!" });
  }
  if (getUserByEmail(req.body.email, users)) {
    return res.status(400).render("urls_error", { 
      user_id: users[req.session.user_id],
      errorMessage: "Email already taken!" });
  }
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.user_id = userID;
  res.redirect(`/urls`);
});

app.post("/urls", (req, res) => { // this generates a shortURL and creates a url object to inject into the urlDatabase
  const randomString = generateRandomString();
  if (req.session.user_id === undefined) {
    return res.status(400).send("User not logged in, post permission denied!"); // I think this is to deny curl workarounds...that sounds about right
  }
  urlDatabase[randomString] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
    visitCount: 0,
    uniqueVisitors: [],
    visitTimes: []
  };
  res.redirect(`/urls/${randomString}`);
});

app.delete("/urls/:shortURL/delete", (req, res) => {  // this deletes URLs from a user's list
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect(`/urls`);
});

app.delete("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/urls`);
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

app.get("/u/:shortURL", (req, res) => { // when a Tinyapp url gets visited, a few things happen:
  let uniqueVisitorID;
  urlDatabase[req.params.shortURL].visitCount++;  // the raw visit count is incremented
  if (req.cookies.uniqueTracker === undefined) {  // a unique visitor is defined as any request coming from the same browser; visiting the link while logged in to Tinyapp with the account that created it, or to a different account, or not logged in at all will collectively still count as the same unique visitor if those requests are all made from the same browser
    uniqueVisitorID = generateRandomString(); // if the url hasn't been visited from a particular browser, a cookie is created and assigned
    res.cookie("uniqueTracker", uniqueVisitorID);
  } else {
    uniqueVisitorID = req.cookies.uniqueTracker;
  };
  if (!(urlDatabase[req.params.shortURL].uniqueVisitors.includes(uniqueVisitorID))) { // when a Tinyapp url is used, the stored cookie value needs to be added to that particular URL's array of unique visitor IDs if it hasn't already
    urlDatabase[req.params.shortURL].uniqueVisitors.push(uniqueVisitorID);
  };
  urlDatabase[req.params.shortURL].visitTimes.push({  // add details of the visitor and time to the url's array of visits
    visitor_id: uniqueVisitorID,
    time_of_visit: getDate()
  })
  res.redirect(urlDatabase[req.params.shortURL].longURL); // send the user to the requested website
});

app.get("/urls/new", (req, res) => {  // allows a logged-in user to access the page where a new shortURL can be created
  if (req.session.user_id === undefined) {
    return res.redirect("/login");
  }
  const templateVars = {
    user_id: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL/redirect", (req, res) => { // to redirect edit requests made by hitting the edit button on /urls
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {  // loads the edit page for a shortURL if it exists and if the user that created it is logged in; if not, it doesn't play any details about the URL and displays a line informing the user to log in
  if (!(urlDatabase[req.params.shortURL])) {
    return res.status(400).render("urls_error", { 
      user_id: users[req.session.user_id],
      errorMessage: "URL for given ID does not exist!" });
  }
  const templateVars = {
    correctUser: true,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user_id: users[req.session.user_id],
    visitCount: urlDatabase[req.params.shortURL].visitCount,
    uniqueCount: urlDatabase[req.params.shortURL].uniqueVisitors.length,
    visitTimes: [ ...urlDatabase[req.params.shortURL].visitTimes ]
  };
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    templateVars.correctUser = false;
    return res.render("urls_show", templateVars);
  }
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {  // displays a list of urls created by a particular user
  const templateVars = {
    urls: { ...urlsForUser(req.session.user_id, urlDatabase) },
    user_id: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get('/', (req, res) => {  // if a valid user is logged-in, renders the homepage; otherwise, renders the login page
  for (const userID of Object.keys(users)) {
    if (req.session.user_id === userID) {
      return res.redirect(`/urls`);
    }
  }
  res.redirect(`/login`);
});

app.get("/urls.json", (req, res) => { // I'm pretty sure I don't need this
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}!`);
});