const config = require("dotenv").config({ path: __dirname + "/.env" });
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./model/user");
const auth = require("./middleware/auth").auth;

const app = express();

app.use(express.json());

// Logic goes here
//Register User
app.post("/register", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    if (!(email && password && first_name && last_name)) {
      return res.send(400, "All input is requried");
    }

    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.send(409, "User already exists.");
    }

    let encPasswd = await bcrypt.hash(password, 10);
    const user = User.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: encPasswd,
    });
    res.status(201).json({ success: "user registered, pls login." });
  } catch (err) {
    res.status(400).send("unable to create a user ", err);
  }
});

//Login
app.post("/login", async (req, res) => {
  try {
    // Get user input
    const { email, password } = req.body;

    // Validate user input
    if (!(email && password)) {
      return res.status(400).send("All input is required");
    }
    // Validate if user exist in our database
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Create token
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );
      //console.log(config.parsed);
      return res.status(200).json({ token: token });
    } else {
      return res.status(400).json({ error: "Invalid Credentials" });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Invalid Credentials" });
  }
});

app.get("/welcome", auth, (req, res) => {
  return res.status(200).json({ welcome: req.user });
});

//change-password
app.post("/change-password", auth, async (req, res) => {
  try {
    // Get user input
    const { password, password2 } = req.body;
    const { email } = req.user;
    console.log("body :", req.body);
    console.log("user :", req.user);
    // Validate user input
    if (!(password && password2)) {
      return res.status(400).send("All input requried Mismatched password");
    }

    if (password != password2) {
      return res.status(400).send("Missmatched passwords");
    }

    // Validate if user exist in our database
    let encPasswd = await bcrypt.hash(password2, 10);
    const filter = { email: email };
    const update = { password: encPasswd };
    await User.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
    });
    return res.status(201).json({ result: "success" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Invalid Credentials" });
  }
});

// This should be the last route else any after it won't work
app.use("*", (req, res) => {
  res.status(404).json({
    success: "false",
    message: "Page not found",
    error: {
      statusCode: 404,
      message: "You reached a route that is not defined on this server",
    },
  });
});

// Forgot password
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  await User.findOne({ email })
    .then((user) => {
      let reset_token = bcrypt.hash(user.first_name + user.last_name, 15);
    })
    .catch((err) => {
      return res.status(400).send({ error: "User not found" });
    });
});

module.exports = app;
