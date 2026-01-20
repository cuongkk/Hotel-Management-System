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

module.exports.deleteCustomerType = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await settingModel.countCustomersByType(id);

    if (count > 0) {
      return res.status(400).json({
        message: `Không thể xóa. Có ${count} khách hàng thuộc loại này.`,
      });
    }

    await settingModel.deleteCustomerType(id);
    res.json({ message: "Xóa loại khách thành công." });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa loại khách." });
  }
};

module.exports.deleteRoomType = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await settingModel.countRoomsByType(id);

    if (count > 0) {
      return res.status(400).json({
        message: `Không thể xóa. Có ${count} phòng thuộc loại này.`,
      });
    }

    await settingModel.deleteRoomType(id);
    res.json({ message: "Xóa loại phòng thành công." });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa loại phòng." });
  }
};
