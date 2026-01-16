import random
import hashlib
from datetime import datetime, timedelta

import psycopg2
from psycopg2.extras import execute_values
from faker import Faker

# =========================
# CONFIG
# =========================
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "hotel_management",   
    "user": "postgres",
    "password": "123456"
}

SEED = 23120224
random.seed(SEED)
fake = Faker("vi_VN")
Faker.seed(SEED)

N_USERS = 12
N_ROOM_TYPES = 6
N_ROOMS = 40
N_CUSTOMER_TYPES = 4
N_CUSTOMERS = 240
N_RULES = 3
N_RENTALS = 260

USER_ROLES = ["ADMIN", "MANAGER", "STAFF"]
ROOM_STATUS = ["AVAILABLE", "OCCUPIED", "MAINTENANCE"]
RENTAL_STATUS = ["ACTIVE", "COMPLETED", "CANCELLED"]


# =========================
# HELPERS
# =========================
def sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def rand_past_datetime(days_back: int = 180) -> datetime:
    seconds = random.randint(0, days_back * 24 * 3600)
    return datetime.now() - timedelta(seconds=seconds)


def connect():
    return psycopg2.connect(**DB_CONFIG)


def make_code(prefix: str, n: int, width: int = 3) -> str:
    return f"{prefix}{n:0{width}d}"


# =========================
# MAIN
# =========================
def main():
    conn = connect()
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            # -------------------------------------------------------
            # 0) OPTIONAL: clear data (comment out if you don't want)
            # -------------------------------------------------------
            cur.execute("""
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
            """)

            # --------------------
            # 1) users
            # --------------------
            users_rows = []
            for i in range(N_USERS):
                username = f"user{i+1}"
                full_name = fake.name()
                role = "ADMIN" if i == 0 else random.choice(USER_ROLES)
                users_rows.append((
                    username,
                    sha256_hex("123456"),
                    full_name,
                    role,
                    True,
                    rand_past_datetime(365)
                ))

            execute_values(cur, """
                INSERT INTO users (username, password_hash, full_name, role, is_active, created_at)
                VALUES %s
                RETURNING user_id
            """, users_rows)
            user_ids = [r[0] for r in cur.fetchall()]

            # --------------------
            # 2) room_types
            # --------------------
            type_candidates = [
                ("Standard", 350000, 2, "Phòng tiêu chuẩn"),
                ("Superior", 450000, 2, "Phòng nâng cao"),
                ("Deluxe", 650000, 3, "Phòng cao cấp"),
                ("Family", 800000, 4, "Phòng gia đình"),
                ("Suite", 1200000, 4, "Phòng suite"),
                ("Dorm", 200000, 6, "Phòng nhiều giường"),
            ]
            random.shuffle(type_candidates)
            room_type_rows = []
            for i in range(N_ROOM_TYPES):
                name, price, maxg, desc = type_candidates[i % len(type_candidates)]
                price = round(price * random.uniform(0.95, 1.15), 2)
                maxg = int(maxg)
                room_type_rows.append((name, price, maxg, desc, True))

            execute_values(cur, """
                INSERT INTO room_types (type_name, base_price, max_guests, description, is_active)
                VALUES %s
                RETURNING room_type_id, base_price, max_guests
            """, room_type_rows)

            rt = cur.fetchall()
            room_type_ids = [r[0] for r in rt]
            room_type_snapshot = {r[0]: (float(r[1]), int(r[2])) for r in rt}

            # --------------------
            # 3) customer_types (PK: VARCHAR(10))
            # --------------------
            # schema: customer_type_id VARCHAR(10) PRIMARY KEY
            ct_defs = [
                ("Nội địa", 1.00),
                ("Quốc tế", 1.50),
                ("VIP", 1.20),
                ("Doanh nghiệp", 1.10),
            ][:N_CUSTOMER_TYPES]

            customer_type_rows = []
            customer_type_ids = []
            coeff_by_type = {}
            for i, (name, coeff) in enumerate(ct_defs, start=1):
                ct_id = make_code("CT", i, 3)  # CT001...
                customer_type_ids.append(ct_id)
                coeff_by_type[ct_id] = float(coeff)
                customer_type_rows.append((ct_id, name, coeff))

            execute_values(cur, """
                INSERT INTO customer_types (customer_type_id, type_name, surcharge_coefficient)
                VALUES %s
            """, customer_type_rows)

            # --------------------
            # 4) surcharge_rules
            # --------------------
            rule_rows = [
                ("Phụ thu quá số khách", 0.25, 3, "Vượt ngưỡng khách sẽ phụ thu"),
                ("Phụ thu mùa cao điểm", 0.15, 3, "Tăng nhẹ mùa cao điểm"),
                ("Phụ thu lễ tết", 0.35, 3, "Tăng dịp lễ tết"),
            ][:N_RULES]

            execute_values(cur, """
                INSERT INTO surcharge_rules (rule_name, ratio, extra_guest_threshold, description)
                VALUES %s
                RETURNING rule_id, ratio, extra_guest_threshold
            """, rule_rows)

            rules = cur.fetchall()
            rule_ids = [r[0] for r in rules]
            ratio_by_rule = {r[0]: float(r[1]) for r in rules}
            threshold_by_rule = {r[0]: int(r[2]) for r in rules}

            # --------------------
            # 5) rooms (PK: room_id VARCHAR(10), has room_name)
            # --------------------
            rooms_rows = []
            room_ids = []
            for i in range(1, N_ROOMS + 1):
                room_id = make_code("R", i, 3)  # R001...
                room_ids.append(room_id)
                room_name = f"Phòng {random.choice(['A','B','C','D'])}{random.randint(101, 999)}"
                room_type_id = random.choice(room_type_ids)
                status = random.choices(ROOM_STATUS, weights=[0.70, 0.22, 0.08], k=1)[0]
                note = random.choice([None, "", "Gần thang máy", "View đẹp", "Hơi ồn", "Mới sửa"])
                rooms_rows.append((room_id, room_name, room_type_id, status, note))

            execute_values(cur, """
                INSERT INTO rooms (room_id, room_name, room_type_id, status, note)
                VALUES %s
            """, rooms_rows)

            # --------------------
            # 6) customers
            # --------------------
            # identity_card unique NOT NULL
            used_ids = set()
            customers_rows = []
            customer_ids = []
            customer_type_of_customer = {}

            for _ in range(N_CUSTOMERS):
                full_name = fake.name()
                # generate unique identity_card
                identity = str(random.randint(10**11, 10**12 - 1))
                while identity in used_ids:
                    identity = str(random.randint(10**11, 10**12 - 1))
                used_ids.add(identity)

                addr = fake.address().replace("\n", ", ")
                phone = fake.msisdn()[:10]
                ctype = random.choice(customer_type_ids)

                customers_rows.append((full_name, identity, addr, phone, ctype))

            execute_values(cur, """
                INSERT INTO customers (full_name, identity_card, address, phone_number, customer_type_id)
                VALUES %s
                RETURNING customer_id, customer_type_id
            """, customers_rows)

            for cid, ctype in cur.fetchall():
                customer_ids.append(cid)
                customer_type_of_customer[cid] = ctype

            # --------------------
            # 7) history tables (optional but you have them)
            # --------------------
            # 7.1 room_type_history
            rth_rows = []
            for _ in range(max(1, N_ROOM_TYPES // 2)):
                rt_id = random.choice(room_type_ids)
                changed_by = random.choice(user_ids)
                old_price, old_max = room_type_snapshot[rt_id]
                new_price = round(old_price * random.uniform(1.02, 1.15), 2)
                new_max = old_max + random.choice([0, 1])
                rth_rows.append((rt_id, changed_by, old_price, new_price, old_max, new_max, rand_past_datetime(300)))

            execute_values(cur, """
                INSERT INTO room_type_history
                    (room_type_id, changed_by, old_price, new_price, old_max_guests, new_max_guests, changed_at)
                VALUES %s
            """, rth_rows)

            # 7.2 customer_type_history
            cth_rows = []
            for _ in range(max(1, N_CUSTOMER_TYPES // 2)):
                ct_id = random.choice(customer_type_ids)
                changed_by = random.choice(user_ids)
                old_coeff = coeff_by_type[ct_id]
                new_coeff = round(old_coeff * random.uniform(1.02, 1.10), 2)
                cth_rows.append((ct_id, changed_by, old_coeff, new_coeff, rand_past_datetime(300)))

            execute_values(cur, """
                INSERT INTO customer_type_history
                    (customer_type_id, changed_by, old_coefficient, new_coefficient, changed_at)
                VALUES %s
            """, cth_rows)

            # 7.3 surcharge_rule_history
            srh_rows = []
            for _ in range(max(1, N_RULES)):
                rule_id = random.choice(rule_ids)
                changed_by = random.choice(user_ids)
                old_ratio = ratio_by_rule[rule_id]
                new_ratio = round(old_ratio * random.uniform(1.05, 1.25), 2)
                old_th = threshold_by_rule[rule_id]
                new_th = max(0, old_th + random.choice([-1, 0, 1]))
                srh_rows.append((rule_id, changed_by, old_ratio, new_ratio, old_th, new_th, rand_past_datetime(300)))

            execute_values(cur, """
                INSERT INTO surcharge_rule_history
                    (rule_id, changed_by, old_ratio, new_ratio, old_threshold, new_threshold, changed_at)
                VALUES %s
            """, srh_rows)

            # --------------------
            # 8) rental_slips + rental_details
            # --------------------
            rental_rows = []
            rental_meta = []

            for _ in range(N_RENTALS):
                room_id = random.choice(room_ids)
                created_by = random.choice(user_ids)
                started_at = rand_past_datetime(240)

                status = random.choices(RENTAL_STATUS, weights=[0.55, 0.40, 0.05], k=1)[0]

                # snapshots from the room_type of the room
                # we need room_type_id for that room:
                # easiest: pick from rooms_rows snapshot data we created earlier
                # build quick map:
            # build map once
            room_to_type = {r[0]: r[2] for r in rooms_rows}

            for _ in range(N_RENTALS):
                room_id = random.choice(room_ids)
                created_by = random.choice(user_ids)
                started_at = rand_past_datetime(240)
                status = random.choices(RENTAL_STATUS, weights=[0.55, 0.40, 0.05], k=1)[0]

                rt_id = room_to_type[room_id]
                snap_price, snap_max = room_type_snapshot[rt_id]

                # choose one main customer for coefficient snapshot
                main_customer = random.choice(customer_ids)
                ctype = customer_type_of_customer[main_customer]
                snap_coeff = coeff_by_type[ctype]

                # choose rule snapshot
                rule_id = random.choice(rule_ids)
                snap_ratio = ratio_by_rule[rule_id]

                rental_rows.append((
                    room_id, created_by, started_at, status,
                    snap_price, snap_max, snap_coeff, snap_ratio
                ))
                rental_meta.append({
                    "main_customer": main_customer,
                    "snap_price": snap_price,
                    "snap_max": snap_max,
                    "snap_coeff": snap_coeff,
                    "snap_ratio": snap_ratio,
                    "started_at": started_at,
                    "created_by": created_by,
                    "status": status
                })

            execute_values(cur, """
                INSERT INTO rental_slips
                    (room_id, created_by, started_at, status,
                     snap_price, snap_max_guests, snap_surcharge_coefficient, snap_surcharge_ratio)
                VALUES %s
                RETURNING rental_slip_id
            """, rental_rows)

            rental_ids = [r[0] for r in cur.fetchall()]

            # rental_details: 1..snap_max (+ sometimes exceed)
            detail_rows = []
            for rid, meta in zip(rental_ids, rental_meta):
                snap_max = int(meta["snap_max"])
                guests = random.randint(1, max(1, snap_max))
                if random.random() < 0.25:
                    guests = min(snap_max + random.randint(1, 3), 8)

                chosen = {meta["main_customer"]}
                while len(chosen) < guests:
                    chosen.add(random.choice(customer_ids))

                for cid in chosen:
                    detail_rows.append((rid, cid))

            execute_values(cur, """
                INSERT INTO rental_details (rental_slip_id, customer_id)
                VALUES %s
                ON CONFLICT DO NOTHING
            """, detail_rows)

            # --------------------
            # 9) invoices (only for COMPLETED rentals)
            # --------------------
            invoice_rows = []
            for rid, meta in zip(rental_ids, rental_meta):
                if meta["status"] != "COMPLETED":
                    continue

                days = random.randint(1, 10)
                payment_date = meta["started_at"] + timedelta(days=days, hours=random.randint(1, 12))
                payer_name = fake.name()

                # approximate guests
                guests = random.randint(1, int(meta["snap_max"]) + 2)

                daily = float(meta["snap_price"]) * float(meta["snap_coeff"])

                surcharge = 0.0
                if guests > int(meta["snap_max"]):
                    surcharge = daily * float(meta["snap_ratio"])

                total_amount = (daily + surcharge) * days
                note = random.choice([None, "", "Tiền mặt", "Chuyển khoản", "Quẹt thẻ"])

                invoice_rows.append((
                    rid, meta["created_by"], payer_name,
                    payment_date, days, round(total_amount, 2), note
                ))

            if invoice_rows:
                execute_values(cur, """
                    INSERT INTO invoices
                        (rental_slip_id, created_by, payer_name, payment_date,
                         total_days, total_amount, note)
                    VALUES %s
                """, invoice_rows)

        conn.commit()
        print("✅ Generate dữ liệu thành công")

    except Exception as e:
        conn.rollback()
        print("❌ Lỗi, rollback.")
        raise e

    finally:
        conn.close()


if __name__ == "__main__":
    main()
