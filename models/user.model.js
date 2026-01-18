const { query } = require("../configs/database.config.js");

module.exports.findByEmail = async (email) => {
  const sql = `
    SELECT user_id, username, email, password_hash, full_name, role, is_active, created_at
    FROM users
    WHERE email = $1
    LIMIT 1
  `;
  const { rows } = await query(sql, [email]);
  return rows[0] || null;
};

module.exports.findByUsername = async (username) => {
  const sql = `
    SELECT user_id, username, email, password_hash, full_name, role, is_active, created_at
    FROM users
    WHERE username = $1
    LIMIT 1
  `;
  const { rows } = await query(sql, [username]);
  return rows[0] || null;
};

module.exports.create = async ({ username, email, password_hash, full_name, role = "STAFF", is_active = true }) => {
  const sql = `
    INSERT INTO users (username, email, password_hash, full_name, role, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING user_id, username, email, full_name, role, is_active, created_at
  `;
  const { rows } = await query(sql, [username, email, password_hash, full_name, role, is_active]);
  return rows[0];
};

module.exports.updatePasswordByEmail = async (email, password_hash) => {
  const sql = `
    UPDATE users
    SET password_hash = $2
    WHERE email = $1
  `;
  await query(sql, [email, password_hash]);
};

module.exports.activateByEmail = async (email) => {
  const sql = `UPDATE users SET is_active = TRUE WHERE email = $1`;
  await query(sql, [email]);
};
