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
    await User.create({
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
          expiresIn: "12h",
        }
      );
      //console.log(config.parsed);
      return res.status(200).json({ token });
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

// Forgot password
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      let reset_token = await bcrypt.hash(user.first_name + user.last_name, 5);
      const resetLink = `http://${process.env.APP_HOST}:${process.env.APP_PORT}/reset-password?email=${user.email}&token=${reset_token}`;

      let now = Date.now();
      //2 hours into the future
      let future = Date.now() + 2 * 60 * 60 * 1000;
      //update resetToken in the DB
      await User.findOneAndUpdate(
        { email },
        { reset_token, reset_token_expiry: future },
        { new: true, upsert: true }
      );
      //send email

      //return reset link
      return res.status(200).json({
        resetLink,
      });
    } else {
      return res.status(400).send({ error: "User not found" });
    }
  } catch (err) {
    return res.status(400).send({ error: "User not found" });
  }
});

// Reset password
app.post("/reset-password", async (req, res) => {
  const { password, password2 } = req.body;
  if (!(password && password2)) {
    return res.status(400).send("All input requried Mismatched password");
  }
  if (password != password2) {
    return res.status(400).send("Missmatched passwords");
  }
  let email = req.query.email;
  let token = req.query.token;
  try {
    const user = await User.findOne({ email });
    if (user.reset_token != token) {
      return res.status(400).send("Reset token did not match");
    }
    if (Date.now() > user.reset_token_expiry) {
      return res.status(400).send("Token has expired, pls try again.");
    }
    let encPasswd = await bcrypt.hash(password2, 10);
    const filter = { email: email };
    const update = { password: encPasswd };
    await User.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
    });
    return res.status(201).send("password reset successfully.");
  } catch (err) {
    return res.status(400).send({ error: "User not found" });
  }
});

module.exports = app;
