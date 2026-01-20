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
INSERT INTO users (
    username, email, password_hash, full_name,
    phone_number, role, is_active, created_at
)
VALUES
('admin',   'admin@hotel.com',   '$2b$10$mzO/rBgBhJe93MMnG3Ln5esm/vBDRqHszNdea2E7bZBAmPb90IeXK',   'Quan tri he thong', NULL,        'ADMIN',   TRUE, NOW()),
('manager', 'manager@hotel.com', '$2b$10$mzO/rBgBhJe93MMnG3Ln5esm/vBDRqHszNdea2E7bZBAmPb90IeXK', 'Quan ly khach san', '0900000000','MANAGER', TRUE, NOW());

-- staffs (28)
INSERT INTO users (
    username, email, password_hash, full_name,
    role, is_active, created_at, phone_number
)
SELECT
    'staff' || LPAD(gs::text, 2, '0'),
    'staff' || LPAD(gs::text, 2, '0') || '@hotel.com',
    '$2b$10$mzO/rBgBhJe93MMnG3Ln5esm/vBDRqHszNdea2E7bZBAmPb90IeXK',
    'Nhan vien ' || gs::text,
    'STAFF'::user_role,
    TRUE,
    NOW() - (random() * interval '200 days'),
    '090' || LPAD(gs::text, 7, '0')
FROM generate_series(1, 28) gs;

-- OTPs
INSERT INTO password_reset_otps (email, otp, expire_at, created_at)
SELECT
    u.email,
    LPAD((floor(random()*1000000))::int::text, 6, '0'),
    NOW() + interval '10 minutes',
    NOW()
FROM users u
WHERE u.role IN ('ADMIN','MANAGER')
ON CONFLICT DO NOTHING;

-- =========================================================
-- 2) MASTER DATA
-- =========================================================
-- Room Types
INSERT INTO room_types (type_name, base_price, max_guests, description, is_active)
VALUES
('Standard', 350000, 2, 'Phong tieu chuan', TRUE),
('Superior', 450000, 3, 'Phong nang cao',   TRUE),
('Deluxe',   650000, 4, 'Phong cao cap',    TRUE);

-- Customer Types
INSERT INTO customer_types (customer_type_id, type_name, surcharge_coefficient)
VALUES
('CT001', 'Noi dia', 1.00),
('CT002', 'Quoc te', 1.50);

-- Surcharge Rule (1 rule)
INSERT INTO surcharge_rules (rule_name, ratio, extra_guest_threshold, description)
VALUES
('Phu thu vuot nguoi', 0.25, 3, 'Phu thu khi vuot nguoi');

-- =========================================================
-- 3) ROOMS (30)
-- =========================================================
-- Standard
INSERT INTO rooms (room_id, room_name, room_type_id, status)
SELECT
    'R' || LPAD(gs::text, 4, '0'),
    'Phong S-' || (100 + gs),
    rt.room_type_id,
    (ARRAY['AVAILABLE','OCCUPIED'])[1 + floor(random()*2)]::room_status
FROM generate_series(1, 10) gs
JOIN room_types rt ON rt.type_name = 'Standard';

-- Superior
INSERT INTO rooms (room_id, room_name, room_type_id, status)
SELECT
    'R' || LPAD((gs+10)::text, 4, '0'),
    'Phong U-' || (200 + gs),
    rt.room_type_id,
    (ARRAY['AVAILABLE','OCCUPIED'])[1 + floor(random()*2)]::room_status
FROM generate_series(1, 10) gs
JOIN room_types rt ON rt.type_name = 'Superior';

-- Deluxe
INSERT INTO rooms (room_id, room_name, room_type_id, status)
SELECT
    'R' || LPAD((gs+20)::text, 4, '0'),
    'Phong D-' || (300 + gs),
    rt.room_type_id,
    (ARRAY['AVAILABLE','OCCUPIED'])[1 + floor(random()*2)]::room_status
FROM generate_series(1, 10) gs
JOIN room_types rt ON rt.type_name = 'Deluxe';

-- =========================================================
-- 4) CUSTOMERS (600)
-- =========================================================
INSERT INTO customers (
    full_name, identity_card, address, phone_number, customer_type_id
)
SELECT
    'Khach ' || gs,
    (100000000000 + gs)::text,
    'Viet Nam',
    '09' || LPAD(gs::text, 8, '0'),
    (CASE WHEN random() < 0.8 THEN 'CT001' ELSE 'CT002' END)
FROM generate_series(1, 600) gs;

-- =========================================================
-- 5) HISTORY
-- =========================================================
INSERT INTO room_type_history (
    room_type_id, changed_by,
    old_price, new_price,
    old_max_guests, new_max_guests,
    changed_at
)
SELECT
    rt.room_type_id, 2,
    rt.base_price - 20000,
    rt.base_price,
    rt.max_guests,
    rt.max_guests,
    NOW() - interval '90 days'
FROM room_types rt;

INSERT INTO customer_type_history (
    customer_type_id, changed_by,
    old_coefficient, new_coefficient, changed_at
)
VALUES
('CT002', 2, 1.45, 1.50, NOW() - interval '75 days');

INSERT INTO surcharge_rule_history (
    rule_id, changed_by,
    old_ratio, new_ratio,
    old_threshold, new_threshold,
    changed_at
)
SELECT
    rule_id, 2,
    ratio - 0.05, ratio,
    extra_guest_threshold, extra_guest_threshold,
    NOW() - interval '50 days'
FROM surcharge_rules
LIMIT 1;

-- =========================================================
-- 6) RENTAL SLIPS (900)
-- =========================================================
WITH rule AS (
    SELECT ratio, extra_guest_threshold
    FROM surcharge_rules
    ORDER BY rule_id
    LIMIT 1
),
rooms_list AS (
    SELECT array_agg(room_id ORDER BY room_id) AS room_ids FROM rooms
),
users_list AS (
    SELECT array_agg(user_id ORDER BY user_id) AS user_ids FROM users
),
room_info AS (
    SELECT r.room_id, rt.base_price, rt.max_guests
    FROM rooms r
    JOIN room_types rt ON rt.room_type_id = r.room_type_id
),
cust_pick AS (
    SELECT customer_id, surcharge_coefficient
    FROM customers c
    JOIN customer_types ct ON ct.customer_type_id = c.customer_type_id
)
INSERT INTO rental_slips (
    room_id, created_by, started_at, status,
    snap_price, snap_max_guests,
    snap_surcharge_coefficient,
    snap_extra_guest_threshold,
    snap_surcharge_ratio
)
SELECT
    rl.room_ids[1 + ((gs-1) % array_length(rl.room_ids,1))],
    ul.user_ids[1 + ((gs-1) % array_length(ul.user_ids,1))],
    timestamp '2025-10-01'
        + random() * (timestamp '2026-01-31' - timestamp '2025-10-01'),
    (ARRAY['COMPLETED','ACTIVE','CANCELLED'])[1 + floor(random()*3)]::rental_status,
    ri.base_price,
    ri.max_guests,
    cp.surcharge_coefficient,
    r.extra_guest_threshold,
    r.ratio
FROM generate_series(1,900) gs
CROSS JOIN rooms_list rl
CROSS JOIN users_list ul
JOIN room_info ri ON ri.room_id = rl.room_ids[1 + ((gs-1) % array_length(rl.room_ids,1))]
JOIN LATERAL (SELECT * FROM cust_pick ORDER BY random() LIMIT 1) cp ON TRUE
CROSS JOIN rule r;

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
    LIMIT (2 + floor(random()*4))::int
) c ON TRUE
ON CONFLICT DO NOTHING;

-- =========================================================
-- 8) INVOICES
-- =========================================================
INSERT INTO invoices (
    rental_slip_id, created_by, payer_name,
    payment_method, payment_date,
    total_days, total_amount, note
)
SELECT
    rs.rental_slip_id,
    rs.created_by,
    'Nguoi tra #' || rs.rental_slip_id,
    (ARRAY['CASH','BANK_TRANSFER','CARD'])[1 + floor(random()*3)],
    NOW() - interval '30 days',
    d.days,
    ROUND(d.days * rs.snap_price * rs.snap_surcharge_coefficient, 2),
    'Thanh toan'
FROM rental_slips rs
JOIN LATERAL (
    SELECT (1 + floor(random()*7))::int AS days
) d ON TRUE
WHERE rs.status = 'COMPLETED'
ON CONFLICT DO NOTHING;
