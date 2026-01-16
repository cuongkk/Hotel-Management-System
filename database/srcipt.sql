ALTER TABLE rental_slips
ADD COLUMN snap_extra_guest_threshold INT NOT NULL;

ALTER TABLE invoices
ADD COLUMN payment_method VARCHAR(50);

UPDATE invoices
SET payment_method = 'Thanh toán tiền mặt',
    note = 'Đã thanh toán bằng tiền mặt'
WHERE payer_name = 'Nguyễn Văn An';

ALTER TABLE rental_slips
ALTER COLUMN snap_surcharge_coefficient DROP DEFAULT;
