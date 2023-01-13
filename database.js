const { Sequelize } = require("sequelize");

module.exports = new Sequelize("tecmintdb", "tecmint", "securep@wd", {
  host: "localhost",
  dialect: "postgres",
});
