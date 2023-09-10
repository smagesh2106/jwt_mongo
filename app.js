const http = require("http");
const express = require("express");
const compression = require("compression");
const app = express();

require("dotenv").config({ path: __dirname + "/.env" });
require("./config/database").connect();

const all_routes = require("./routes").all_routes;

app.use(express.json());
app.use(compression());
all_routes(app);

const server = http.createServer(app);

const { APP_PORT } = process.env;
const port = process.env.PORT || APP_PORT;

// server listening
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
