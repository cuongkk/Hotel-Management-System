const bcrypt = require("bcryptjs");
const staffModel = require("../models/staff.model");
const jwt = require("jsonwebtoken");

module.exports.list = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 10;

    const q = "";
    const by = "name";

    const result = await staffModel.findStaffPaged({ q, by, page, pageSize });

    res.render("pages/staff-list.pug", {
      pageTitle: "Quản lý nhân viên",
      staffs: result.rows,
      q,
      by,
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
};

module.exports.find = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const by = (req.query.by || "name").trim();
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 10;

    const result = await staffModel.findStaffPaged({ q, by, page, pageSize });

    res.render("pages/staff-list.pug", {
      pageTitle: "Quản lý nhân viên",
      staffs: result.rows,

      q,
      by,

      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
};

module.exports.createPost = async (req, res) => {
  try {
    const { username, email, full_name, phone_number, role, password } = req.body;

    if (!username || !email || !full_name || !phone_number || !role || !password) {
      return res.json({ result: "error", message: "Thiếu dữ liệu bắt buộc." });
    }

    if (!["STAFF", "MANAGER"].includes(role)) {
      return res.json({ result: "error", message: "Chức vụ không hợp lệ." });
    }
    const password_hash = await bcrypt.hash(password, 10);

    await staffModel.createUser({
      username: username.trim(),
      email: email.trim(),
      full_name: full_name.trim(),
      phone_number: phone_number.trim(),
      role,
      password_hash: password_hash,
    });

    return res.json({ result: "success", message: "Tạo nhân viên thành công." });
  } catch (err) {
    if (err.code === "23505") {
      return res.json({ result: "error", message: "Username hoặc Email đã tồn tại." });
    }
    console.error(err);
    return res.json({ result: "error", message: "Lỗi hệ thống." });
  }
};

module.exports.create = async (req, res) => {
  const staffTypes = await staffModel.findAllStaffTypes();
  res.render("pages/staff-create.pug", {
    pageTitle: "Thêm nhân viên",
    staffTypes,
  });
};
