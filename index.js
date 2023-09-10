const http = require("http");
const app = require("./app");
const server = http.createServer(app);

const { APP_PORT } = process.env;
const port = process.env.PORT || APP_PORT;

// server listening
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
