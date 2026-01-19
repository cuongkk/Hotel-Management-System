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

-- =========================
-- 1) USERS
-- =========================
INSERT INTO users (username, password_hash, full_name, role, is_active, created_at)
VALUES
('admin', 'hash_admin', 'Quan tri he thong', 'ADMIN', TRUE, NOW()),
('manager', 'hash_manager', 'Quan ly khach san', 'MANAGER', TRUE, NOW());

INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at)
SELECT
    'staff' || LPAD(gs::text, 2, '0'),
    'staff' || LPAD(gs::text, 2, '0') || '@hotel.com',
    'hash_staff' || gs::text,
    'Nhan vien ' || gs::text,
    'STAFF'::user_role,
    TRUE,
    NOW() - (random() * interval '200 days')
FROM generate_series(1, 28) gs;

-- =========================
-- 2) MASTER DATA
-- =========================
INSERT INTO room_types (type_name, base_price, max_guests, description, is_active)
VALUES
('Standard', 350000, 2, 'Phong tieu chuan', TRUE),
('Superior', 450000, 3, 'Phong nang cao', TRUE),
('Deluxe', 650000, 4, 'Phong cao cap', TRUE);

INSERT INTO customer_types (customer_type_id, type_name, surcharge_coefficient)
VALUES
('CT001', 'Noi dia', 1.00),
('CT002', 'Quoc te', 1.50);

INSERT INTO surcharge_rules (rule_name, ratio, extra_guest_threshold, description)
VALUES
('Phu thu vuot 3 nguoi', 0.25, 3, 'Phu thu khi vuot so nguoi');

-- =========================
-- 3) ROOMS
-- =========================
INSERT INTO rooms (room_id, room_name, room_type_id, status)
SELECT
    'R' || LPAD(gs::text, 4, '0'),
    'Phong S-' || (100 + gs)::text,
    1,
    'AVAILABLE'
FROM generate_series(1, 30) gs;

-- =========================
-- 4) CUSTOMERS
-- =========================
INSERT INTO customers (full_name, identity_card, address, phone_number, customer_type_id)
SELECT
    'Khach ' || gs::text,
    (100000000000 + gs)::text,
    'Viet Nam',
    '09' || LPAD((10000000 + gs)::text, 8, '0'),
    'CT001'
FROM generate_series(1, 100) gs;

-- =========================
-- 5) RENTAL SLIPS
-- =========================
INSERT INTO rental_slips (
    room_id, created_by, status,
    snap_price, snap_max_guests, snap_surcharge_coefficient, snap_surcharge_ratio
)
SELECT
    r.room_id,
    1,
    'COMPLETED',
    rt.base_price,
    rt.max_guests,
    1.0,
    0.25
FROM rooms r
JOIN room_types rt ON rt.room_type_id = r.room_type_id
LIMIT 50;
