const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model"); // model pg

module.exports.verifyToken = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect(`/account/login`);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const existAccount = await userModel.findByUsername(decoded.username);

    if (!existAccount || existAccount.is_active !== true) {
      res.clearCookie("token");
      return res.redirect(`/account/login`);
    }

    req.account = existAccount;
    res.locals.account = existAccount;
    return next();
  } catch (error) {
    res.clearCookie("token");
    return res.redirect(`/account/login`);
  }
};

module.exports.verifyResetToken = async (req, res, next) => {
  const token = req.cookies.resetToken;

  if (!token) {
    return res.redirect(`/account/login`);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const existAccount = await userModel.findByEmail(decoded.email);
    existAccount.type = decoded.type;
    if (!existAccount || existAccount.is_active !== true) {
      res.clearCookie("resetToken");
      return res.redirect(`/account/login`);
    }

    req.account = existAccount;
    res.locals.account = existAccount;
    return next();
  } catch (error) {
    res.clearCookie("resetToken");
    return res.redirect(`/account/login`);
  }
};

module.exports.requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.account) return res.redirect(`/account/login`);

    const role = (req.account.role || "").toUpperCase();
    const ok = allowedRoles.map((r) => r.toUpperCase()).includes(role);

    if (!ok) {
      return res.status(403).render("pages/error-404", { pageTitle: "Trang không tồn tại" });
    }
    return next();
  };
};
