const express = require("express");
require("dotenv").config();
console.log("JWT_SECRET_KEY =", process.env.JWT_SECRET_KEY);
const { pool, query } = require("./configs/database.config.js");
const { pathAdmin } = require("./configs/variable.config");
const path = require("path");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const indexRouter = require("./routes/index.route.js");

const reportRouter = require("./routes/report.route.js");
const rentalRouter = require("./routes/rental.route.js");
const cookieParser = require("cookie-parser");

// Tạo biến toàn cục cho Backend
global.pathAdmin = pathAdmin;

// Tạo biến toàn cục cho pug
app.locals.pathAdmin = pathAdmin;

//Thiết lập thư mục chứa pug
app.set("views", path.join(__dirname, "views"));

//Thiết lập pug làm view engine
app.set("view engine", "pug");

//Thiết lập thư mục chứa file tĩnh
app.use(express.static(path.join(__dirname, "public")));

// Đọc được cookie
app.use(cookieParser());

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
    process.exit(1);
  });
