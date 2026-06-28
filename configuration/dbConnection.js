const mongoose = require("mongoose");

function dbConnection() {
  const url = process.env.MONGODB_URL;

  if (!url) {
    console.error("MONGODB_URL is not defined in environment variables");
    process.exit(1);
  }

  mongoose
    .connect(url)
    .then(() => console.log("Database connected"))
    .catch((error) => {
      console.log("Database Connection Failed", error);
    });
}

module.exports = dbConnection;
