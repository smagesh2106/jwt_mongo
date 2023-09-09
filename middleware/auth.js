const jwt = require("jsonwebtoken");

const config = process.env;

const verifyToken = async (req, res, next) => {
  //const token = req.headers["x-access-token"];
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    let tok = token.split(/\s+/);
    if (tok.length != 2) {
      return res.status(401).send("Invalid Token");
    }
    const decoded = await jwt.verify(tok[1], config.TOKEN_KEY);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
};
module.exports.auth = verifyToken;
