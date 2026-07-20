require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dbConnection = require("./configuration/dbConnection.js");
const { initEmailTransport } = require("./helpers/emailHelper");
const routes = require("./routes");
const dns = require("node:dns/promises");

const app = express();
const PORT = process.env.PORT || 8000;

dns.setServers(["8.8.8.8", "8.8.4.4"]);
app.use(cors());
app.use(express.json());
app.use(routes);

app.get("/", function (req, res) {
  res.send("Auth API");
});

async function startServer() {
  await dbConnection();

  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    try {
      await initEmailTransport();
    } catch (error) {
      console.error("Failed to initialize mail transport:", error.message);
    }
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
