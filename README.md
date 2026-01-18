# 🏨 Hotel Management System – NodeJS + Yarn + PostgreSQL

Hệ thống quản lý khách sạn được xây dựng bằng **NodeJS, Express, Pug, Yarn và PostgreSQL**.

---

## 1. Yêu cầu hệ thống

| Phần mềm   | Phiên bản |
| ---------- | --------- |
| NodeJS     | >= 18     |
| Yarn       | >= 1.22   |
| PostgreSQL | >= 14     |
| pgAdmin 4  | Mới nhất  |

---

## 2. Tải source code

```bash
git clone https://github.com/yourname/Hotel-Management-System.git
cd Hotel-Management-System
```

Hoặc giải nén file zip vào thư mục bất kỳ.

---

## 3. Cài thư viện (CHỈ 1 LỆNH DUY NHẤT)

```bash
yarn install
```

→ Yarn sẽ tự cài toàn bộ thư viện dựa trên `package.json` và `yarn.lock`.

---

## 4. Cấu hình database

Copy file mẫu:

```bash
copy .env.example .env
```

Mở file `.env` và chỉnh lại:

```env
PORT=3000

PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=123456
PGDATABASE=QLKhachSan
```

---

## 5. Cấu trúc project
<pre>
Hotel-Management-System/
├── index.js
├── package.json
├── yarn.lock
├── .env
│
├── configs/
│ └── database.config.js
├── controllers/
├── routes/
├── views/ (Pug)
├── public/ (CSS, Images)
└── README.md
</pre>
---

## 6. Chạy hệ thống

```bash
yarn start
```

---

## 7. Truy cập hệ thống

| Chức năng       | URL                                                                |
| --------------- | ------------------------------------------------------------------ |
| Trang đăng nhập | [http://localhost:3000](http://localhost:3000)                     |
| Dashboard       | [http://localhost:3000/dashboard](http://localhost:3000/dashboard) |
| Kiểm tra DB     | [http://localhost:3000/db-check](http://localhost:3000/db-check)   |

---

## 8. Lưu ý

- Không commit file `.env` lên GitHub
- Mỗi máy cần tạo `.env` riêng
- Sau khi clone source, **chỉ cần `yarn install` rồi `yarn start` là chạy**
