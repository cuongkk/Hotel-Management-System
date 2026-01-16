TRUNCATE TABLE
    invoices,
    rental_details,
    rental_slips,
    surcharge_rule_history,
    customer_type_history,
    room_type_history,
    customers,
    rooms,
    surcharge_rules,
    customer_types,
    room_types,
    users
RESTART IDENTITY CASCADE;

-- =========================================================
-- 1) USERS (many employees)
-- =========================================================
INSERT INTO users (username, password_hash, full_name, role, is_active, created_at)
VALUES
('admin',   'hash_admin',   'Quản trị hệ thống', 'ADMIN',   TRUE, NOW()),
('manager', 'hash_manager', 'Quản lý khách sạn', 'MANAGER', TRUE, NOW());

-- add 28 staffs
INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at)
SELECT
    'staff' || LPAD(gs::text, 2, '0')                       AS username,
    'staff' || LPAD(gs::text, 2, '0') || '@hotel.com'       AS email,
    'hash_staff' || gs::text                                AS password_hash,
    'Nhân viên ' || gs::text                                AS full_name,
    'STAFF'::user_role                                      AS role,
    TRUE                                                    AS is_active,
    NOW() - (random() * interval '200 days')                AS created_at
FROM generate_series(1, 28) gs;


-- =========================================================
-- 2) MASTER DATA
-- =========================================================

-- 2.1 Room Types (exactly 3)
INSERT INTO room_types (type_name, base_price, max_guests, description, is_active)
VALUES
('Standard', 350000, 2, 'Phòng tiêu chuẩn', TRUE),
('Superior', 450000, 3, 'Phòng nâng cao',   TRUE),
('Deluxe',   650000, 4, 'Phòng cao cấp',    TRUE);

-- 2.2 Customer Types (exactly 2)  (PK is VARCHAR(10))
INSERT INTO customer_types (customer_type_id, type_name, surcharge_coefficient)
VALUES
('CT001', 'Nội địa', 1.00),
('CT002', 'Quốc tế', 1.50);

-- 2.3 Surcharge Rules (only 1 rule)
INSERT INTO surcharge_rules (rule_name, ratio, extra_guest_threshold, description)
VALUES
('Phụ thu khi vượt 3 người', 0.25, 3, 'Phụ thu theo tỷ lệ khi số người > 3');

-- =========================================================
-- 3) ROOMS (many rooms per type)
-- room_id: VARCHAR(10), room_name required
-- =========================================================
-- Standard: 30 rooms
INSERT INTO rooms (room_id, room_name, room_type_id, status, note)
SELECT
    'R' || LPAD(gs::text, 4, '0')                                  AS room_id,
    'Phòng S-' || (100 + gs)::text                                 AS room_name,
    1                                                               AS room_type_id,
    (CASE
        WHEN random() < 0.75 THEN 'AVAILABLE'
        WHEN random() < 0.92 THEN 'OCCUPIED'
        ELSE 'MAINTENANCE'
     END)::room_status                                              AS status,
    NULL                                                            AS note
FROM generate_series(1, 30) gs;

-- Superior: 25 rooms
INSERT INTO rooms (room_id, room_name, room_type_id, status, note)
SELECT
    'R' || LPAD((gs + 30)::text, 4, '0')                            AS room_id,
    'Phòng U-' || (200 + gs)::text                                  AS room_name,
    2                                                               AS room_type_id,
    (CASE
        WHEN random() < 0.78 THEN 'AVAILABLE'
        WHEN random() < 0.93 THEN 'OCCUPIED'
        ELSE 'MAINTENANCE'
     END)::room_status                                              AS status,
    NULL                                                            AS note
FROM generate_series(1, 25) gs;

-- Deluxe: 20 rooms
INSERT INTO rooms (room_id, room_name, room_type_id, status, note)
SELECT
    'R' || LPAD((gs + 55)::text, 4, '0')                            AS room_id,
    'Phòng D-' || (300 + gs)::text                                  AS room_name,
    3                                                               AS room_type_id,
    (CASE
        WHEN random() < 0.80 THEN 'AVAILABLE'
        WHEN random() < 0.94 THEN 'OCCUPIED'
        ELSE 'MAINTENANCE'
     END)::room_status                                              AS status,
    NULL                                                            AS note
FROM generate_series(1, 20) gs;

-- =========================================================
-- 4) CUSTOMERS (many customers)
-- identity_card UNIQUE NOT NULL
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
-- 5) HISTORY TABLES (optional, create some records)
-- =========================================================
-- room_type_history: simulate a few changes by manager (user_id = 2)
INSERT INTO room_type_history (room_type_id, changed_by, old_price, new_price, old_max_guests, new_max_guests, changed_at)
VALUES
(1, 2, 350000, 370000, 2, 2, NOW() - interval '120 days'),
(2, 2, 450000, 480000, 3, 3, NOW() - interval '90 days'),
(3, 2, 650000, 700000, 4, 4, NOW() - interval '60 days');

-- customer_type_history: simulate coefficient update
INSERT INTO customer_type_history (customer_type_id, changed_by, old_coefficient, new_coefficient, changed_at)
VALUES
('CT002', 2, 1.50, 1.55, NOW() - interval '75 days');

-- surcharge_rule_history: simulate ratio update
INSERT INTO surcharge_rule_history (rule_id, changed_by, old_ratio, new_ratio, old_threshold, new_threshold, changed_at)
VALUES
(1, 2, 0.25, 0.30, 3, 3, NOW() - interval '50 days');

-- =========================================================
-- 6) RENTAL SLIPS (many rentals with snapshot)
-- rental_status: ('ACTIVE','COMPLETED','CANCELLED')
-- snapshot fields required: snap_price, snap_max_guests, snap_surcharge_coefficient, snap_surcharge_ratio
-- =========================================================
WITH rule AS (
    SELECT ratio, extra_guest_threshold FROM surcharge_rules WHERE rule_id = 1
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
    SELECT user_id FROM users WHERE role IN ('ADMIN','MANAGER','STAFF')
)
INSERT INTO rental_slips (
    room_id, created_by, started_at, status,
    snap_price, snap_max_guests, snap_surcharge_coefficient, snap_surcharge_ratio
)
SELECT
    rp.room_id,
    (SELECT user_id FROM u ORDER BY random() LIMIT 1)                                             AS created_by,
    NOW() - (random() * interval '180 days')                                                      AS started_at,
    (CASE
        WHEN random() < 0.70 THEN 'COMPLETED'
        WHEN random() < 0.93 THEN 'ACTIVE'
        ELSE 'CANCELLED'
     END)::rental_status                                                                          AS status,
    rp.base_price                                                                                 AS snap_price,
    rp.max_guests                                                                                 AS snap_max_guests,
    cp.surcharge_coefficient                                                                      AS snap_surcharge_coefficient,
    (SELECT ratio FROM rule)                                                                      AS snap_surcharge_ratio
FROM generate_series(1, 900) gs
JOIN LATERAL (SELECT * FROM rooms_pick ORDER BY random() LIMIT 1) rp ON TRUE
JOIN LATERAL (SELECT * FROM cust_pick  ORDER BY random() LIMIT 1) cp ON TRUE;

-- =========================================================
-- 7) RENTAL DETAILS (assign guests to each rental)
-- rule threshold is 3, so we often generate 2..5 guests
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
-- 8) INVOICES (for COMPLETED rentals only)
-- invoices.rental_slip_id is UNIQUE
-- total_amount = (daily + surcharge_if_guest>3) * days
-- daily = snap_price * snap_surcharge_coefficient
-- surcharge_if_guest>3 = daily * snap_surcharge_ratio
-- =========================================================
WITH guest_counts AS (
    SELECT rental_slip_id, COUNT(*)::int AS guest_count
    FROM rental_details
    GROUP BY rental_slip_id
),
completed AS (
    SELECT
        rs.rental_slip_id,
        rs.created_by,
        rs.started_at,
        rs.snap_price,
        rs.snap_max_guests,
        rs.snap_surcharge_coefficient,
        rs.snap_surcharge_ratio,
        gc.guest_count
    FROM rental_slips rs
    JOIN guest_counts gc ON gc.rental_slip_id = rs.rental_slip_id
    WHERE rs.status = 'COMPLETED'
),
calc AS (
    SELECT
        rental_slip_id,
        created_by,
        (1 + floor(random() * 7))::int                                                     AS total_days,      -- 1..7
        (started_at + (1 + floor(random() * 7)) * interval '1 day')                        AS payment_date,
        guest_count,
        (snap_price * snap_surcharge_coefficient)                                          AS daily,
        snap_surcharge_ratio
    FROM completed
)
INSERT INTO invoices (rental_slip_id, created_by, payer_name, payment_date, total_days, total_amount, note)
SELECT
    c.rental_slip_id,
    c.created_by,
    'Người trả #' || c.rental_slip_id::text,
    c.payment_date,
    c.total_days,
    ROUND(
        (c.daily + (CASE WHEN c.guest_count > 3 THEN c.daily * c.snap_surcharge_ratio ELSE 0 END))
        * c.total_days
    , 2)                                                                                   AS total_amount,
    CASE WHEN c.guest_count > 3 THEN 'Có phụ thu (vượt 3 người)' ELSE 'Không phụ thu' END  AS note
FROM calc c
ON CONFLICT (rental_slip_id) DO NOTHING;


