const express = require("express");
require("dotenv").config();

const { pool, query } = require("./configs/database.config.js");
const path = require("path");
const app = express();
const port = 3000;

const indexRouter = require("./routes/index.route.js");

//Thiết lập thư mục chứa pug
app.set("views", path.join(__dirname, "views"));

//Thiết lập pug làm view engine
app.set("view engine", "pug");

//Thiết lập thư mục chứa file tĩnh
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

pool
  .connect()
  .then((client) => {
    console.log("✅ Connected to PostgreSQL");
    client.release();

    app.listen(port, () => {
      console.log(`✅ Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Cannot connect to PostgreSQL:", err.message);
    process.exit(1);
  });
