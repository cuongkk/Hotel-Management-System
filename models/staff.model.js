const { query } = require("../configs/database.config.js");

module.exports.findAllStaffTypes = async () => {
  const sql = `
    SELECT DISTINCT role
    FROM users
		WHERE role != 'ADMIN' AND role != 'MANAGER'
  `;
  const result = await query(sql);
  return result.rows.map((row) => row.role);
};

module.exports.findAllStaff = async ({ q } = {}) => {
  const keyword = (q || "").trim();

  if (keyword) {
    const sql = `
      SELECT user_id, username, full_name, phone_number, email, role, is_active, created_at
      FROM users
      WHERE (role = 'STAFF' OR role = 'MANAGER')
				AND (
					username ILIKE $1
					OR full_name ILIKE $1
				)
      ORDER BY user_id DESC
    `;
    const result = await query(sql, [`%${keyword}%`]);
    return result.rows;
  }

  const sql = `
    SELECT user_id, username, full_name, phone_number, email, role, is_active, created_at
    FROM users
    WHERE (role = 'STAFF' OR role = 'MANAGER')
    ORDER BY user_id DESC
  `;
  const result = await query(sql);
  return result.rows;
};

module.exports.findStaffPaged = async ({ q, by, page = 1, pageSize = 10 }) => {
  const keyword = (q || "").trim();
  const mode = by === "phone" ? "phone" : "name";

  page = Math.max(parseInt(page, 10) || 1, 1);
  pageSize = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 100);
  const offset = (page - 1) * pageSize;

  let where = `WHERE role IN ('STAFF','MANAGER')`;
  const params = [];
  let p = 1;

  if (keyword) {
    if (mode === "phone") {
      where += ` AND phone_number ILIKE $${p}`;
    } else {
      where += ` AND full_name ILIKE $${p}`;
    }
    params.push(`%${keyword}%`);
    p++;
  }

  const countSql = `SELECT COUNT(*)::int AS total FROM users ${where}`;
  const countRes = await query(countSql, params);
  const total = countRes.rows[0]?.total || 0;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  if (page > totalPages) {
    page = totalPages;
  }
  const finalOffset = (page - 1) * pageSize;

  const dataSql = `
    SELECT user_id, username, full_name, role, is_active, created_at, phone_number
    FROM users
    ${where}
    ORDER BY user_id DESC
    LIMIT $${p} OFFSET $${p + 1}
  `;
  const dataRes = await query(dataSql, [...params, pageSize, finalOffset]);

  return {
    rows: dataRes.rows,
    total,
    page,
    pageSize,
    totalPages,
  };
};

module.exports.createUser = async ({ username, email, password_hash, full_name, role, phone_number }) => {
  const sql = `
    INSERT INTO users (username, email, password_hash, full_name, role, phone_number, is_active, created_at)
    VALUES ($1, $2, $3, $4, $5::user_role, $6, TRUE, NOW())
    RETURNING user_id
  `;
  return query(sql, [username, email, password_hash, full_name, role, phone_number]);
};
