const pool = require("../configs/database.config");
const db = require("../configs/database.config");


module.exports.list = async (req, res) => {
  try {
    const { roomName, status, roomType } = req.query;

    let sqlForReport = `
      SELECT DISTINCT
        r.room_id AS room_id,
        r.room_name,
        rt.type_name AS room_type,
        rt.max_guests AS max_guest,
        rt.base_price AS price,
        r.status,
        u.full_name AS receptionist
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.room_type_id
      LEFT JOIN rental_slips rs 
        ON r.room_id = rs.room_id AND rs.status = 'ACTIVE'
      LEFT JOIN users u ON rs.created_by = u.user_id
      WHERE 1=1
    `;

    const values = [];
    let idx = 1;

    if (roomName) {
      sqlForReport += ` AND r.room_name ILIKE $${idx++}`;
      values.push(`%${roomName}%`);
    }

    if (status) {
      sqlForReport += ` AND r.status = $${idx++}::room_status`;
      values.push(status);
    }

    if (roomType) {
      sqlForReport += ` AND rt.type_name = $${idx++}`;
      values.push(roomType);
    }

    sqlForReport += ` ORDER BY r.room_id`;

    const result = await pool.query(sqlForReport, values);

    res.render("pages/rental-list", {
      pageTitle: "Quản lý thuê phòng",
      rooms: result.rows,
      filters: { roomName, status, roomType },
    });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).send("Server error");
  }
};

module.exports.createPost = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { roomId, roomName, roomType, price, startDate, customers } = req.body;

    let finalPrice = parseFloat(price);
    if (customers.length > 2) finalPrice *= 1.25;

    const hasForeign = customers.some((c) => c.type === "Nước ngoài");

    if (hasForeign) finalPrice *= 1.5;

    await client.query("BEGIN");
    const insertSlip = `
      INSERT INTO rental_slips (room_id, created_by, started_at, status, snap_price,
        snap_max_guests, snap_surcharge_coefficient,
        snap_surcharge_ratio)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING rental_slip_id
    `;
    const slipResult = await client.query(insertSlip, [
      roomId,
      1,              //Cần accessToken để biết ai đang thực hiện
      startDate,
      'ACTIVE',
      finalPrice,
      customers.length,
      hasForeign ? 1.5 : 1.0,
      customers.length > 2 ? 1.25 : 1.0,
    ]);

    const rentalSlipId = slipResult.rows[0].rental_slip_id;

    for (const c of customers) {
      let customerId;
      const check = await client.query(
        "SELECT customer_id FROM customers WHERE identity_card = $1",
        [c.idCard]
      );
      if (check.rows.length > 0) {
        customerId = check.rows[0].customer_id;
      } else {
        const insertCustomer = `
          INSERT INTO customers (full_name, identity_card, address, phone_number, customer_type_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING customer_id
        `;
        const custResult = await client.query(insertCustomer, [
          c.name,
          c.idCard,
          c.address || null,
          c.phone,
          c.customer_type_id || null,
        ]);
        customerId = custResult.rows[0].customer_id;
      }
      await client.query(
        "INSERT INTO rental_details (rental_slip_id, customer_id) VALUES ($1, $2)",
        [rentalSlipId, customerId]
      );
    }

    const result = await client.query( 
      `SELECT 
        r.room_id,
        r.room_name, 
        rt.type_name AS room_type, 
        rt.base_price AS price, 
        rt.max_guests 
      FROM rooms r LEFT JOIN room_types rt ON r.room_type_id = rt.room_type_id 
      WHERE r.room_id = $1`, 
      [roomId] 
    ); 
      
    const room = result.rows[0];

    await client.query("COMMIT");

    res.render("pages/rental-create", {
      pageTitle: "Lập phiếu thuê phòng",
      room,
      rentalSlipId,
      finalPrice,
      roomName,
      roomType,
      startDate,
      customers,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DB error:", err);
    res.status(500).send("Server error");
  } finally {
    client.release();
  }
};

module.exports.createGet = async (req, res) => {
  try {
    const { roomId } = req.query;

    const sql = ` 
      SELECT 
        r.room_id AS room_id, 
        r.room_name, 
        rt.type_name AS room_type, 
        rt.base_price AS price, 
        rt.max_guests 
      FROM rooms r LEFT JOIN room_types rt ON r.room_type_id = rt.room_type_id 
      WHERE r.room_id = $1 
    `;

    const result = await pool.query(sql, [roomId]);

    const room = result.rows[0];
    res.render("pages/rental-create", {
    pageTitle: "Lập phiếu thuê phòng",
    room,
    });

  } catch (error) {
    res.status(500).send("Server error");
  }
};

