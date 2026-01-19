const jwt = require("jsonwebtoken");
const profileModel = require("../models/profile.model");

module.exports.view = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const userId = decoded.user_id;

    if (!userId) return res.redirect("/account/login");

    const profile = await profileModel.getById(userId);

    return res.render("pages/profile.pug", {
      pageTitle: "Thông tin cá nhân",
      profile,
    });
  } catch (err) {
    next(err);
  }
};

module.exports.update = async (req, res) => {
  try {
    const token = req.cookies.token;

    const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET_KEY);

    const userId = decoded.user_id;
    if (!userId) return res.json({ result: "error", message: "Chưa đăng nhập." });

    const { email, phone_number } = req.body;

    const payload = {};
    if (typeof email === "string") payload.email = email.trim();
    if (typeof phone_number === "string") payload.phone_number = phone_number.trim();

    if (!payload.email && !payload.phone_number) {
      return res.json({ result: "error", message: "Không có dữ liệu cần cập nhật." });
    }

    await profileModel.updateEmailPhone(userId, payload);

    return res.json({ result: "success", message: "Cập nhật thành công." });
  } catch (err) {
    if (err.code === "23505") {
      return res.json({ result: "error", message: "Email đã được sử dụng." });
    }
    console.error(err);
    return res.json({ result: "error", message: "Lỗi hệ thống." });
  }
};
