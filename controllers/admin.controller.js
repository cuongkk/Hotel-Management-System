const settingModel = require("../models/setting.model");

module.exports.setting = async (req, res, next) => {
  try {
    const [rule, customerTypes, roomTypes] = await Promise.all([settingModel.getSurchargeRule(), settingModel.findAllCustomerTypes(), settingModel.findAllRoomTypes()]);

    res.render("pages/setting.pug", {
      pageTitle: "Cài đặt hệ thống",
      rule: rule || {},
      customerTypes: customerTypes,
      roomTypes: roomTypes,
      pageTitle: "Cài đặt",
    });
  } catch (err) {
    next(err);
  }
};

module.exports.updateSetting = async (req, res, next) => {
  try {
    const { rule, customerTypes, roomTypes } = req.body;

    // Validate backend 1 lần nữa nếu cần (để chắc chắn)
    if (!rule || !customerTypes || !roomTypes) {
      return res.status(400).json({ message: "Thiếu dữ liệu gửi lên." });
    }

    await settingModel.updateAllSettings(rule, customerTypes, roomTypes);

    res.json({ message: "Cập nhật thành công!" });
  } catch (err) {
    console.error("Update Setting Error:", err);
    res.status(500).json({ message: "Lỗi hệ thống khi lưu cấu hình." });
  }
};
