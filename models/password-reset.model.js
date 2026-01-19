const { query } = require("../configs/database.config.js");

module.exports.cleanupExpired = async () => {
  await query(`DELETE FROM password_reset_otps WHERE expire_at < NOW()`);
};

// Tìm OTP theo email (để chặn gửi lại nếu còn OTP chưa hết hạn)
module.exports.findByEmail = async (email) => {
  const result = await query(
    `
    SELECT id, email, otp, expire_at, created_at
    FROM password_reset_otps
    WHERE email = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [email],
  );
  return result.rows[0] || null;
};

// Tạo OTP mới
module.exports.create = async ({ email, otp, expire_at }) => {
  const result = await query(
    `
    INSERT INTO password_reset_otps (email, otp, expire_at)
    VALUES ($1, $2, $3)
    RETURNING id, email, otp, expire_at, created_at
    `,
    [email, otp, expire_at],
  );
  return result.rows[0];
};

// Tìm OTP còn hiệu lực theo email + otp (được dùng trong otpPasswordPost)
module.exports.findValid = async (email, otp) => {
  const result = await query(
    `
    SELECT id, email, otp, expire_at, created_at
    FROM password_reset_otps
    WHERE email = $1
      AND otp = $2
      AND expire_at >= NOW()
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [email, otp],
  );
  return result.rows[0] || null;
};

// Xóa OTP theo email (sau khi xác thực hoặc hết hạn)
module.exports.deleteByEmail = async (email) => {
  await query(`DELETE FROM password_reset_otps WHERE email = $1`, [email]);
};
