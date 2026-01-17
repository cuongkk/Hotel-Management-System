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
