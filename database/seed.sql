-- =========================================================
-- CLEAN DATA
-- =========================================================
TRUNCATE TABLE
    invoices,
    rental_details,
    rental_slips,
    surcharge_rule_history,
    customer_type_history,
    room_type_history,
    password_reset_otps,
    customers,
    rooms,
    surcharge_rules,
    customer_types,
    room_types,
    users
RESTART IDENTITY CASCADE;

-- =========================================================
-- 1) USERS
-- =========================================================
INSERT INTO users (username, email, password_hash, full_name, phone_number, role, is_active, created_at)
VALUES
('admin',   'admin@hotel.com',   'hash_admin',   'Quản trị hệ thống', NULL,        'ADMIN',   TRUE, NOW()),
('manager', 'manager@hotel.com', 'hash_manager', 'Quản lý khách sạn', '0900000000','MANAGER', TRUE, NOW());

-- add 28 staffs
INSERT INTO users (
    username, email, password_hash, full_name,
    role, is_active, created_at, phone_number
)
SELECT
    'staff' || LPAD(gs::text, 2, '0')                         AS username,
    'staff' || LPAD(gs::text, 2, '0') || '@hotel.com'         AS email,
    'hash_staff' || gs::text                                  AS password_hash,
    'Nhân viên ' || gs::text                                  AS full_name,
    'STAFF'::user_role                                        AS role,
    TRUE                                                      AS is_active,
    NOW() - (random() * interval '200 days')                  AS created_at,
    '090' || LPAD(gs::text, 7, '0')                           AS phone_number
FROM generate_series(1, 28) gs;

-- (Optional) OTP demo (Schema A: FK users(email))
INSERT INTO password_reset_otps (email, otp, expire_at, created_at)
SELECT
    u.email,
    LPAD((floor(random()*1000000))::int::text, 6, '0') AS otp,
    NOW() + interval '10 minutes'                      AS expire_at,
    NOW()                                              AS created_at
FROM users u
WHERE u.role IN ('ADMIN','MANAGER')
ON CONFLICT DO NOTHING;

-- =========================================================
-- 2) MASTER DATA
-- =========================================================
-- 2.1 Room Types (exactly 3)
INSERT INTO room_types (type_name, base_price, max_guests, description, is_active)
VALUES
('Standard', 350000, 2, 'Phòng tiêu chuẩn', TRUE),
('Superior', 450000, 3, 'Phòng nâng cao',   TRUE),
('Deluxe',   650000, 4, 'Phòng cao cấp',    TRUE);

-- 2.2 Customer Types (exactly 2)
INSERT INTO customer_types (customer_type_id, type_name, surcharge_coefficient)
VALUES
('CT001', 'Nội địa', 1.00),
('CT002', 'Quốc tế', 1.50);

-- 2.3 Surcharge Rules (only 1 rule)
INSERT INTO surcharge_rules (rule_name, ratio, extra_guest_threshold, description)
VALUES
('Phụ thu khi vượt 3 người', 0.25, 3, 'Phụ thu theo tỷ lệ khi số người > 3');

-- =========================================================
-- 3) ROOMS (TOTAL = 30)
-- room_id: VARCHAR(10)
-- =========================================================
-- Standard: 10 rooms (room_type_id = 1)
INSERT INTO rooms (room_id, room_name, room_type_id, status, note)
SELECT
    'R' || LPAD(gs::text, 4, '0')                                   AS room_id,
    'Phòng S-' || (100 + gs)::text                                  AS room_name,
    1                                                                AS room_type_id,
    (CASE
        WHEN random() < 0.80 THEN 'AVAILABLE'
        WHEN random() < 0.95 THEN 'OCCUPIED'
        ELSE 'MAINTENANCE'
     END)::room_status                                               AS status,
    NULL                                                             AS note
FROM generate_series(1, 10) gs;

-- Superior: 10 rooms (room_type_id = 2)
INSERT INTO rooms (room_id, room_name, room_type_id, status, note)
SELECT
    'R' || LPAD((gs + 10)::text, 4, '0')                             AS room_id,
    'Phòng U-' || (200 + gs)::text                                   AS room_name,
    2                                                                AS room_type_id,
    (CASE
        WHEN random() < 0.80 THEN 'AVAILABLE'
        WHEN random() < 0.95 THEN 'OCCUPIED'
        ELSE 'MAINTENANCE'
     END)::room_status                                               AS status,
    NULL                                                             AS note
FROM generate_series(1, 10) gs;

-- Deluxe: 10 rooms (room_type_id = 3)
INSERT INTO rooms (room_id, room_name, room_type_id, status, note)
SELECT
    'R' || LPAD((gs + 20)::text, 4, '0')                             AS room_id,
    'Phòng D-' || (300 + gs)::text                                   AS room_name,
    3                                                                AS room_type_id,
    (CASE
        WHEN random() < 0.80 THEN 'AVAILABLE'
        WHEN random() < 0.95 THEN 'OCCUPIED'
        ELSE 'MAINTENANCE'
     END)::room_status                                               AS status,
    NULL                                                             AS note
FROM generate_series(1, 10) gs;

-- =========================================================
-- 4) CUSTOMERS
-- =========================================================
INSERT INTO customers (full_name, identity_card, address, phone_number, customer_type_id)
SELECT
    'Khách ' || gs::text                                      AS full_name,
    (100000000000 + gs)::text                                 AS identity_card,
    'Việt Nam'                                                AS address,
    ('09' || LPAD((10000000 + gs)::text, 8, '0'))             AS phone_number,
    (CASE WHEN random() < 0.80 THEN 'CT001' ELSE 'CT002' END) AS customer_type_id
FROM generate_series(1, 600) gs;

-- =========================================================
-- 5) HISTORY TABLES (optional)
-- =========================================================
INSERT INTO room_type_history (room_type_id, changed_by, old_price, new_price, old_max_guests, new_max_guests, changed_at)
VALUES
(1, 2, 350000, 370000, 2, 2, NOW() - interval '120 days'),
(2, 2, 450000, 480000, 3, 3, NOW() - interval '90 days'),
(3, 2, 650000, 700000, 4, 4, NOW() - interval '60 days');

INSERT INTO customer_type_history (customer_type_id, changed_by, old_coefficient, new_coefficient, changed_at)
VALUES
('CT002', 2, 1.50, 1.55, NOW() - interval '75 days');

INSERT INTO surcharge_rule_history (rule_id, changed_by, old_ratio, new_ratio, old_threshold, new_threshold, changed_at)
VALUES
(1, 2, 0.25, 0.30, 3, 3, NOW() - interval '50 days');

-- =========================================================
-- 6) RENTAL SLIPS (Schema A snapshot đầy đủ)
-- =========================================================
WITH rule AS (
    SELECT ratio, extra_guest_threshold
    FROM surcharge_rules
    WHERE rule_id = 1
),
rooms_pick AS (
    SELECT r.room_id, rt.base_price, rt.max_guests
    FROM rooms r
    JOIN room_types rt ON rt.room_type_id = r.room_type_id
),
cust_pick AS (
    SELECT c.customer_id, ct.surcharge_coefficient
    FROM customers c
    JOIN customer_types ct ON ct.customer_type_id = c.customer_type_id
),
u AS (
    SELECT user_id FROM users
)
INSERT INTO rental_slips (
    room_id, created_by, started_at, status,
    snap_price, snap_max_guests,
    snap_surcharge_coefficient, snap_extra_guest_threshold, snap_surcharge_ratio
)
SELECT
    rp.room_id,
    (SELECT user_id FROM u ORDER BY random() LIMIT 1)                                  AS created_by,
    -- started_at rải từ 2025-10-01 đến 2026-01-31 (để đủ dữ liệu trước hóa đơn)
    (timestamp '2025-10-01'
      + random() * (timestamp '2026-01-31 23:59:59' - timestamp '2025-10-01'))         AS started_at,
    (CASE
        WHEN random() < 0.70 THEN 'COMPLETED'
        WHEN random() < 0.93 THEN 'ACTIVE'
        ELSE 'CANCELLED'
     END)::rental_status                                                               AS status,
    rp.base_price                                                                       AS snap_price,
    rp.max_guests                                                                       AS snap_max_guests,
    cp.surcharge_coefficient                                                            AS snap_surcharge_coefficient,
    (SELECT extra_guest_threshold FROM rule)                                             AS snap_extra_guest_threshold,
    (SELECT ratio FROM rule)                                                            AS snap_surcharge_ratio
FROM generate_series(1, 900) gs
JOIN LATERAL (SELECT * FROM rooms_pick ORDER BY random() LIMIT 1) rp ON TRUE
JOIN LATERAL (SELECT * FROM cust_pick  ORDER BY random() LIMIT 1) cp ON TRUE;

-- =========================================================
-- 7) RENTAL DETAILS
-- =========================================================
INSERT INTO rental_details (rental_slip_id, customer_id)
SELECT
    rs.rental_slip_id,
    c.customer_id
FROM rental_slips rs
JOIN LATERAL (
    SELECT customer_id
    FROM customers
    ORDER BY random()
    LIMIT (2 + floor(random() * 4))::int   -- 2..5 guests
) c ON TRUE
ON CONFLICT DO NOTHING;

-- =========================================================
-- 8) INVOICES (Schema A) - chỉ trong 11/2025 -> 01/2026
-- =========================================================
WITH params AS (
    SELECT
      timestamp '2025-11-01 00:00:00' AS from_dt,
      timestamp '2026-01-31 23:59:59' AS to_dt
),
guest_counts AS (
    SELECT rental_slip_id, COUNT(*)::int AS guest_count
    FROM rental_details
    GROUP BY rental_slip_id
),
completed AS (
    SELECT
        rs.rental_slip_id,
        rs.created_by,
        rs.snap_price,
        rs.snap_surcharge_coefficient,
        rs.snap_surcharge_ratio,
        rs.snap_extra_guest_threshold,
        gc.guest_count
    FROM rental_slips rs
    JOIN guest_counts gc ON gc.rental_slip_id = rs.rental_slip_id
    WHERE rs.status = 'COMPLETED'
),
calc AS (
    SELECT
        c.rental_slip_id,
        c.created_by,
        (1 + floor(random() * 7))::int                                                     AS total_days, -- 1..7
        -- payment_date random trong range [11/2025..01/2026]
        (p.from_dt + random() * (p.to_dt - p.from_dt))                                      AS payment_date,
        c.guest_count,
        c.snap_extra_guest_threshold,
        (c.snap_price * c.snap_surcharge_coefficient)                                       AS daily,
        c.snap_surcharge_ratio,
        p.from_dt,
        p.to_dt
    FROM completed c
    CROSS JOIN params p
)
INSERT INTO invoices (
    rental_slip_id, created_by, payer_name,
    payment_method, payment_date,
    total_days, total_amount, note
)
SELECT
    x.rental_slip_id,
    x.created_by,
    'Người trả #' || x.rental_slip_id::text                                                AS payer_name,
    (ARRAY['CASH','BANK_TRANSFER','CARD'])[1 + floor(random()*3)]                           AS payment_method,
    x.payment_date,
    x.total_days,
    ROUND(
        (
          x.daily
          + (CASE
                WHEN x.guest_count > x.snap_extra_guest_threshold
                THEN x.daily * x.snap_surcharge_ratio
                ELSE 0
             END)
        ) * x.total_days
    , 2)                                                                                    AS total_amount,
    CASE
      WHEN x.guest_count > x.snap_extra_guest_threshold
      THEN 'Có phụ thu (vượt ' || x.snap_extra_guest_threshold::text || ' người)'
      ELSE 'Không phụ thu'
    END                                                                                     AS note
FROM calc x
ON CONFLICT (rental_slip_id) DO NOTHING;
