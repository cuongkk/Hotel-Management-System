-- Clear existing data
TRUNCATE TABLE invoices, rental_details, rental_slips, 
               room_type_history, customer_type_history, surcharge_rule_history,
               customers, rooms, 
               surcharge_rules, customer_types, room_types, users 
RESTART IDENTITY CASCADE;

------------------------------------------------------------------

-- Create account
-- Can use bcrypt for password hashing like below, the password for all users is '123456'
INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES
('admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Nguyễn Quản Trị', 'ADMIN', TRUE),
('staff1', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Lê Lễ Tân', 'STAFF', TRUE),
('staff2', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Trần Phục Vụ', 'STAFF', TRUE);

-- Room Typeps
INSERT INTO room_types (type_name, base_price, max_guests, description) VALUES
('A', 150000, 3, 'Phòng tiêu chuẩn, tối đa 3 người'),
('B', 170000, 3, 'Phòng cao cấp, view đẹp'),
('C', 200000, 3, 'Phòng hạng sang cho gia đình');

-- Customer Types
INSERT INTO customer_types (customer_type_id, type_name, surcharge_coefficient) VALUES
('DOM', 'Khách Nội địa', 1.0),
('FOR', 'Khách Nước ngoài', 1.5);

-- Surcharge Rules
INSERT INTO surcharge_rules (rule_name, ratio, extra_guest_threshold, description) VALUES
('OVER_CAPACITY', 0.25, 3, 'Phụ thu 25% từ khách thứ 3 trở đi');

------------------------------------------------------------------

-- Rooms
-- ID room type: 1=standrard (A), 2=VIP (B), 3=Super VIP (C)
INSERT INTO rooms (room_id, room_name, room_type_id, status, note) VALUES
('P101', 'Phòng 101', 1, 'AVAILABLE', 'Tầng 1, gần sảnh'),
('P102', 'Phòng 102', 1, 'AVAILABLE', 'Tầng 1'),
('P103', 'Phòng 103', 1, 'MAINTENANCE', 'Đang sửa điều hòa'),
('P201', 'Phòng 201', 2, 'AVAILABLE', 'Tầng 2, view biển'),
('P202', 'Phòng 202', 2, 'OCCUPIED', 'Đang có khách thuê'),
('P301', 'Phòng 301', 3, 'AVAILABLE', 'Penthouse');

-- Customers
INSERT INTO customers (full_name, identity_card, address, phone_number, customer_type_id) VALUES
('Nguyễn Văn An', '079123456789', 'TP. Hồ Chí Minh', '0901234567', 'DOM'),
('John Smith', 'PASS123456', 'New York, USA', '0912345678', 'FOR'),
('Lê Thị Bích', '079987654321', 'Đà Nẵng', '0987654321', 'DOM'),
('Yamamoto Ken', 'JP987654', 'Tokyo, Japan', '0999888777', 'FOR');

------------------------------------------------------------------

-- rental slips and rental details for testing
INSERT INTO rental_slips (room_id, created_by, started_at, status, snap_price, snap_max_guests, snap_surcharge_coefficient, snap_surcharge_ratio)
VALUES 
(
    'P202', 
    2, 
    NOW() - INTERVAL '2 days', -- Khách vào từ 2 ngày trước
    'ACTIVE', 
    300000, 
    3,      
    1.5,   
    0.25 
);

INSERT INTO rental_details (rental_slip_id, customer_id) VALUES
(1, 1), -- Nguyễn Văn An
(1, 2); -- John Smith

------------------------------------------------------------------

-- Room P101, rented out and completed last week
INSERT INTO rental_slips (room_id, created_by, started_at, status, snap_price, snap_max_guests, snap_surcharge_coefficient, snap_surcharge_ratio)
VALUES 
('P101', 2, NOW() - INTERVAL '10 days', 'COMPLETED', 150000, 3, 1.0, 0.25);

-- Rentaled by Nguyễn Văn An
INSERT INTO rental_details (rental_slip_id, customer_id) VALUES (2, 1);

-- Create invoice for completed rental slip
INSERT INTO invoices (rental_slip_id, created_by, payer_name, payment_date, total_days, total_amount, note)
VALUES 
(
    2, 
    2, 
    'Nguyễn Văn An', 
    NOW() - INTERVAL '8 days', 
    2, 
    300000, -- 150k * 2 days * ratio 1.0
    'Thanh toán tiền mặt'
);