const { query } = require("../configs/database.config");
const { calculateNights } = require("../helpers/calculateNights.helper");

module.exports.payment = async (req, res) => {
  try {
    const roomId = req.params.room_id;

    const getData = (roomId) => query(`
      SELECT
        r.room_id, r.room_name,
        rs.rental_slip_id, rs.started_at,
        rs.snap_price, rs.snap_max_guests,    
        rs.snap_surcharge_coefficient,
        rs.snap_extra_guest_threshold,
        rs.snap_surcharge_ratio,
        ARRAY_AGG(DISTINCT c.full_name) FILTER (WHERE c.full_name IS NOT NULL) AS customer_names,
        BOOL_OR(ct.customer_type_id = 'FOR') AS has_foreign
      FROM rooms r
      JOIN rental_slips rs ON r.room_id = rs.room_id AND rs.status = 'ACTIVE'
      LEFT JOIN rental_details rd ON rs.rental_slip_id = rd.rental_slip_id
      LEFT JOIN customers c ON rd.customer_id = c.customer_id
      LEFT JOIN customer_types ct ON c.customer_type_id = ct.customer_type_id
      WHERE rs.room_id = $1
      GROUP BY r.room_id, r.room_name, rs.rental_slip_id, rs.started_at,
               rs.snap_price, rs.snap_max_guests, rs.snap_surcharge_coefficient,
               rs.snap_extra_guest_threshold, rs.snap_surcharge_ratio;
    `, [roomId]);

    const result = await getData(roomId);

    if (result.rows.length === 0) {
      return res.redirect('/dashboard');
    }

    const data = result.rows[0];
    const stayDays = calculateNights(data.started_at);
    
    // calculate total base price
    let totalPrice = Number(data.snap_price) * stayDays;
    
    // surcharge for extra guests
    let surchargeTotal = 0;
    const currentGuestCount = data.customer_names ? data.customer_names.length : 0;
    if (currentGuestCount >= Number(data.snap_extra_guest_threshold)) {
      surchargeTotal = totalPrice * Number(data.snap_surcharge_ratio);
    }
    totalPrice += surchargeTotal;
    
    // surcharge for foreign guests
    console.log(data.snap_surcharge_ratio);
    if (data.has_foreign) {
      totalPrice *= Number(data.snap_surcharge_coefficient);
    }

    res.render("pages/payment.pug", {
      pageTitle: "Thanh toán",
      bookingData: {
        rentalSlipId: data.rental_slip_id,
        roomId: data.room_id,
        roomName: data.room_name,
        customers: data.customer_names || [],
        hasForeign: Boolean(data.has_foreign),
        checkIn: new Date(data.started_at).toLocaleDateString('vi-VN'),
        stayDays,
        pricePerNight: data.snap_price,
        extraGuestThreshold: (surchargeTotal === 0 ? 0 : data.snap_extra_guest_threshold),
        surchargeRatio: data.snap_surcharge_ratio,
        surchargeCoeff: data.snap_surcharge_coefficient,
        totalPrice: Math.round(totalPrice)
      }
    });
  } catch (error) {
    console.error("Error fetching booking data:", error);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports.processPayment = async (req, res) => {
  const roomId = req.params.room_id;
  
  const { paymentMethod, note, customerName, totalPrice } = req.body;
  console.log(req.body);
  
  const currentUserId = 1; 

  try {
    await query('BEGIN');

    const slipResult = await query(
      `SELECT rental_slip_id, started_at FROM rental_slips WHERE room_id = $1 AND status = 'ACTIVE'`,
      [roomId]
    );

    if (slipResult.rows.length === 0) {
      await query('ROLLBACK');
      return res.redirect(`/payment/${roomId}/failed?reason=no_active_booking`);
    }

    const slip = slipResult.rows[0];
    const totalDays = calculateNights(slip.started_at);

    await query(
      `INSERT INTO invoices 
      (rental_slip_id, created_by, payer_name, total_amount, note, payment_date, payment_method, total_days)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)`,
      [
        slip.rental_slip_id, 
        currentUserId, 
        customerName || 'Khách lẻ', 
        totalPrice, 
        note,
        paymentMethod, 
        totalDays
      ]
    );

    await query(
      `UPDATE rental_slips SET status = 'COMPLETED' WHERE rental_slip_id = $1`,
      [slip.rental_slip_id]
    );

    await query(
      `UPDATE rooms SET status = 'AVAILABLE' WHERE room_id = $1`,
      [roomId]
    );

    await query('COMMIT');

    res.redirect(`/payment/${roomId}/success`);

  } catch (error) {
    await query('ROLLBACK');
    console.error("Payment Process Error:", error);
    res.redirect(`/payment/${roomId}/failed`);
  }
};

module.exports.success = (req, res) => {
  res.render("pages/payment-success.pug", {
    pageTitle: "Thanh toán thành công",
    roomId: req.params.room_id
  });
};

module.exports.failed = (req, res) => {
  res.render("pages/payment-failed.pug", {
    pageTitle: "Thanh toán thất bại",
    roomId: req.params.room_id
  });
};