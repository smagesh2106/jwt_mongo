exports.all_routes = (app) => {
  require("./auth")(app);
};
