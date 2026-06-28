require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dbConnection = require("./configuration/dbConnection.js");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
dbConnection();
app.use(routes);

app.get("/", function (req, res) {
  res.send("Auth API");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
