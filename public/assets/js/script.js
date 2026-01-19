// Sider
document.addEventListener("DOMContentLoaded", () => {
  const sider = document.querySelector(".sider");
  if (sider) {
    const pathNameCurrent = window.location.pathname;
    const pathNameCurrentSplit = pathNameCurrent.split("/");
    const menuList = sider.querySelectorAll("ul.inner-menu li a");
    menuList.forEach((item) => {
      const pathName = item.getAttribute("href");
      const pathNameSplit = pathName.split("/");
      if (pathNameCurrentSplit[0] == pathNameSplit[0] && pathNameCurrentSplit[1] === pathNameSplit[1]) {
        item.classList.add("active");
      }
    });
    const menu = document.querySelector(".sider .inner-menu");

    const role = menu.dataset.role;

    if (role === "STAFF") {
      menuList.forEach((item) => {
        const pathName = item.getAttribute("href");
        if (pathName === "/report" || pathName === "/staff" || pathName === "/admin" || pathName === "/room") {
          item.closest("li").style.display = "none";
        }
      });
    }
    if (role === "ADMIN") {
      menuList.forEach((item) => {
        const pathName = item.getAttribute("href");
        if (pathName === "/staff" || pathName === "/dashboard" || pathName === "/report" || pathName === "/room" || pathName === "/rental") {
          item.closest("li").style.display = "none";
        }
      });
    }
  }
});
//End sider

// Filter Staff

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".filter-btn");
  const byInput = document.getElementById("byInput");
  const qInput = document.getElementById("qInput");

  if (!buttons.length || !byInput || !qInput) return;

  const setMode = (by) => {
    buttons.forEach((btn) => btn.classList.toggle("active", btn.dataset.by === by));
    byInput.value = by;

    if (by === "name") qInput.placeholder = "Nhập tên để tìm...";
    if (by === "phone") qInput.placeholder = "Nhập số điện thoại để tìm...";
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector('input[name="page"]').value = "1";
      setMode(btn.dataset.by);
      qInput.focus();
    });
  });

  setMode(byInput.value || "name");
});
// End Filter Staff

// Menu Mobile
const buttonMenuMobile = document.querySelector(".header .inner-menu");

if (buttonMenuMobile) {
  const sider = document.querySelector(".sider");
  const overlay = document.querySelector(".inner-overlay");

  buttonMenuMobile.addEventListener("click", function () {
    sider.classList.add("active");
    overlay.classList.add("active");
  });

  overlay.addEventListener("click", function () {
    sider.classList.remove("active");
    overlay.classList.remove("active");
  });
}
// End Menu Mobile

// REPORT
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("applyBtnForReport");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const roomName = document.getElementById("roomName")?.value.trim();
    const roomType = document.getElementById("roomType")?.value;

    const params = new URLSearchParams();

    if (roomName) params.append("roomName", roomName);
    if (roomType) params.append("roomType", roomType);

    window.location.href = `/report?${params.toString()}`;
  });
});

// Settings

document.addEventListener("DOMContentLoaded", () => {
  // 1. Xử lý nút Edit ở phần Quy định (Rule)
  const editButtons = document.querySelectorAll(".inner-change");
  editButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Tìm input cùng cấp với nút bấm
      const input = this.previousElementSibling;
      if (input) {
        if (input.hasAttribute("readonly")) {
          input.removeAttribute("readonly");
          input.style.backgroundColor = "#fff"; // Đổi màu nền sáng lên
          input.focus();
        } else {
          // Bấm lại để khóa (tùy chọn)
          input.setAttribute("readonly", true);
          input.style.backgroundColor = "#f0f0f0";
        }
      }
    });
  });

  // 2. Xử lý Thêm dòng động (Dynamic Rows) - Code cũ của bạn, chỉnh sửa chút xíu
  const handleDynamicRows = (btnId, containerSelector, isCustomerType = false) => {
    const btnAdd = document.getElementById(btnId);
    const container = document.querySelector(containerSelector);

    btnAdd.addEventListener("click", (e) => {
      e.preventDefault();
      const rows = container.querySelectorAll(".row-item");
      const lastRow = rows[rows.length - 1];

      // Clone dòng cuối
      const newRow = lastRow.cloneNode(true);

      // Reset giá trị input
      newRow.querySelectorAll("input").forEach((input) => {
        input.value = "";
        // Nếu là Customer Type ID thì dòng mới phải cho nhập (bỏ readonly, bỏ màu xám)
        if (input.name === "customer_type_id") {
          input.removeAttribute("readonly");
          input.style.backgroundColor = "#fff";
        }
        // Nếu là Room Type ID (hidden) thì phải xóa value đi để Backend biết là Insert
        if (input.name === "room_type_id") {
          input.value = "";
        }
      });

      container.appendChild(newRow);
    });

    // // Xóa hàng (Giữ nguyên code cũ của bạn)
    // container.addEventListener("click", (e) => {
    //   const btnRemove = e.target.closest(".inner-remove");
    //   if (btnRemove) {
    //     const rows = container.querySelectorAll(".row-item");
    //     if (rows.length > 1) {
    //       btnRemove.closest(".row-item").remove();
    //     } else {
    //       alert("Phải giữ lại ít nhất 1 dòng!");
    //     }
    //   }
    // });
  };

  handleDynamicRows("btn-add-customer", "#form-customer-types .inner-list", true);
  handleDynamicRows("btn-add-room", "#form-room-types .inner-list");

  // 3. LOGIC LƯU VÀ VALIDATE
  const btnSave = document.getElementById("btn-save-all");

  btnSave.addEventListener("click", async () => {
    let isValid = true;
    let errorMessage = "";

    // --- Helper Validate ---
    const isNumber = (val) => !isNaN(val) && val.trim() !== "";

    // A. Lấy dữ liệu Rule
    const ratioInput = document.querySelector('input[name="ratio"]');
    const thresholdInput = document.querySelector('input[name="threshold"]');

    if (!isNumber(ratioInput.value) || !isNumber(thresholdInput.value)) {
      isValid = false;
      errorMessage = "Tỷ lệ phụ thu và Số khách quy định phải là số hợp lệ.";
    }

    const ruleData = {
      ratio: parseFloat(ratioInput.value),
      extra_guest_threshold: parseInt(thresholdInput.value),
    };

    // B. Lấy dữ liệu Customer Types
    const customerRows = document.querySelectorAll("#form-customer-types .row-item");
    const customerTypes = [];

    customerRows.forEach((row) => {
      const id = row.querySelector('input[name="customer_type_id"]').value.trim();
      const name = row.querySelector('input[name="type_name"]').value.trim();
      const coeff = row.querySelector('input[name="surcharge_coefficient"]').value.trim();

      if (!id || !name || !coeff) {
        isValid = false;
        errorMessage = "Vui lòng nhập đầy đủ thông tin Loại Khách.";
        return;
      }
      if (!isNumber(coeff)) {
        isValid = false;
        errorMessage = "Hệ số phụ thu phải là số.";
        return;
      }

      customerTypes.push({
        customer_type_id: id,
        type_name: name,
        surcharge_coefficient: parseFloat(coeff),
      });
    });

    // C. Lấy dữ liệu Room Types
    const roomRows = document.querySelectorAll("#form-room-types .row-item");
    const roomTypes = [];

    roomRows.forEach((row) => {
      const id = row.querySelector('input[name="room_type_id"]').value; // Có thể rỗng nếu là dòng mới
      const name = row.querySelector('input[name="room_type_name"]').value.trim();
      const price = row.querySelector('input[name="base_price"]').value.trim();
      const maxGuests = row.querySelector('input[name="max_guests"]').value.trim();

      if (!name || !price || !maxGuests) {
        isValid = false;
        errorMessage = "Vui lòng nhập đầy đủ thông tin Loại Phòng.";
        return;
      }
      if (!isNumber(price) || !isNumber(maxGuests)) {
        isValid = false;
        errorMessage = "Giá và Số khách tối đa phải là số.";
        return;
      }

      roomTypes.push({
        room_type_id: id || null, // Nếu rỗng gửi null để backend biết insert
        type_name: name,
        base_price: parseFloat(price),
        max_guests: parseInt(maxGuests),
      });
    });

    // --- Kiểm tra kết quả Validate ---
    if (!isValid) {
      alert("Lỗi: " + errorMessage);
      return; // Dừng lại không gửi
    }

    // --- Gửi dữ liệu về Server ---
    try {
      const response = await fetch("/admin/setting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule: ruleData, customerTypes, roomTypes }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Cập nhật thành công!");
        window.location.reload();
      } else {
        alert("Lỗi server: " + result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Không thể kết nối đến server.");
    }
  });
});

// End Settings

// ROOM

document.addEventListener("DOMContentLoaded", function () {
  const searchRoom = document.getElementById("searchRoom");
  const filterStatus = document.getElementById("filterStatus");
  const filterTypeRoom = document.getElementById("filterTypeRoom");
  const roomItems = document.querySelectorAll(".room-item");
  const noResult = document.getElementById("noResult");

  if (!searchRoom || !filterStatus || !filterTypeRoom) return;

  function filterRooms() {
    const searchText = searchRoom.value.toLowerCase().trim();
    const statusValue = filterStatus.value;
    const typeRoomValue = filterTypeRoom.value;

    let visibleCount = 0;

    roomItems.forEach((item) => {
      const name = item.dataset.name;
      const type = item.dataset.type;
      const status = item.dataset.status;

      const matchesSearch = name.includes(searchText);
      const matchesStatus = statusValue === "ALL" || status === statusValue;
      const matchesType = typeRoomValue === "ALL" || type === typeRoomValue;

      if (matchesSearch && matchesStatus && matchesType) {
        item.classList.remove("hidden");
        visibleCount++;
      } else {
        item.classList.add("hidden");
      }
    });

    if (visibleCount === 0) {
      noResult.classList.remove("hidden");
      noResult.classList.add("flex");
    } else {
      noResult.classList.add("hidden");
      noResult.classList.remove("flex");
    }
  }

  searchRoom.addEventListener("input", filterRooms);
  filterStatus.addEventListener("change", filterRooms);
  filterTypeRoom.addEventListener("change", filterRooms);
});

// RENTAL

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("applyBtnForRental");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const roomName = document.getElementById("roomNameInput")?.value.trim();
    const status = document.getElementById("statusSelect")?.value;
    const roomType = document.getElementById("roomTypeSelect")?.value;
    const params = new URLSearchParams();

    if (roomName) params.append("roomName", roomName);
    if (status) params.append("status", status);
    if (roomType) params.append("roomType", roomType);

    window.location.href = `/rental?${params.toString()}`;
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const guestCountInput = document.getElementById("guestCount");
  const customerRows = document.getElementById("customerRows");

  if (!guestCountInput || !customerRows) return;

  const maxGuest = Number(guestCountInput.getAttribute("max")) || 1;
  const minGuest = Number(guestCountInput.getAttribute("min")) || 1;

  function renderCustomerRows(count) {
    customerRows.innerHTML = "";
    for (let i = 0; i < count; i++) {
      customerRows.insertAdjacentHTML(
        "beforeend",
        `
        <tr>
          <td>${i + 1}</td>
          <td><input type="text" name="customers[${i}][name]" id="name"></td>
          <td>
            <select name="customers[${i}][type]">
              <option value="DOM">Nội địa</option>
              <option value="FOR">Nước ngoài</option>
            </select>
          </td>
          <td><input type="text" name="customers[${i}][idCard]" id="idCard"></td>
          <td><input type="text" name="customers[${i}][phone]" id="phone"></td>
        </tr>
        `,
      );
    }
  }

  function updateRows() {
    let count = parseInt(guestCountInput.value, 10);

    if (isNaN(count) || count < minGuest) count = minGuest;
    if (count > maxGuest) count = maxGuest;

    guestCountInput.value = count;
    renderCustomerRows(count);
  }

  if (!guestCountInput.value) guestCountInput.value = "1";
  updateRows();

  guestCountInput.addEventListener("input", updateRows);
  guestCountInput.addEventListener("change", updateRows);
});

document.addEventListener("DOMContentLoaded", () => {
  if (window.__rentalCreateInit) return;
  window.__rentalCreateInit = true;

  const form = document.querySelector("#rental-create-form");
  if (!form) return;

  const guestCountInput = document.getElementById("guestCount");
  const startDateInput = document.getElementById("startDate");
  const customerRows = document.getElementById("customerRows");
  const saveBtn = document.getElementById("saveBtn");

  const validation = new JustValidate("#rental-create-form", {
    focusInvalidField: true,
    lockForm: true,
  });

  validation.addField("#startDate", [
    { rule: "required", errorMessage: "Vui lòng chọn ngày bắt đầu thuê" },
    {
      validator: (value) => {
        const v = (value || "").trim();
        if (!v) return false;
        const selected = new Date(v + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selected >= today;
      },
      errorMessage: "Ngày bắt đầu thuê không được nhỏ hơn hôm nay",
    },
  ]);

  validation.addField("#guestCount", [
    { rule: "required", errorMessage: "Vui lòng nhập số lượng khách" },
    {
      validator: (value) => {
        const n = Number(value);
        const min = Number(guestCountInput.getAttribute("min")) || 1;
        const max = Number(guestCountInput.getAttribute("max")) || 1;
        return Number.isInteger(n) && n >= min && n <= max;
      },
      errorMessage: "Số lượng khách vượt quá giới hạn cho phép",
    },
  ]);

  function validateCustomers() {
    const rows = customerRows.querySelectorAll("tr");
    if (!rows.length) return { ok: false, message: "Vui lòng nhập thông tin khách hàng" };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const name = row.querySelector(`input[name="customers[${i}][name]"]`)?.value.trim() || "";
      const idCard = row.querySelector(`input[name="customers[${i}][idCard]"]`)?.value.trim() || "";
      const phone = row.querySelector(`input[name="customers[${i}][phone]"]`)?.value.trim() || "";

      if (!name) return { ok: false, message: `Khách #${i + 1}: Vui lòng nhập họ tên` };

      if (!/^\d{9}(\d{3})?$/.test(idCard)) return { ok: false, message: `Khách #${i + 1}: CCCD/CMND phải 9 hoặc 12 chữ số` };

      if (!/^0\d{9}$/.test(phone)) return { ok: false, message: `Khách #${i + 1}: SĐT phải đúng định dạng (VD: 0901234567)` };
    }

    return { ok: true };
  }

  guestCountInput.addEventListener("input", () => validation.revalidateField("#guestCount"));
  startDateInput.addEventListener("change", () => validation.revalidateField("#startDate"));

  validation.onSuccess(async () => {
    const custCheck = validateCustomers();
    if (!custCheck.ok) {
      if (typeof notyf !== "undefined") notyf.error(custCheck.message);
      else alert(custCheck.message);
      return;
    }

    const roomId = document.getElementById("roomId").value;
    const roomName = document.getElementById("roomName").value;
    const roomType = document.getElementById("roomType").value;
    const price = document.getElementById("price").value;
    const startDate = document.getElementById("startDate").value;

    const customers = [];
    const rows = customerRows.querySelectorAll("tr");

    rows.forEach((row, i) => {
      const name = row.querySelector(`input[name="customers[${i}][name]"]`).value.trim();
      const type = row.querySelector(`select[name="customers[${i}][type]"]`).value;
      const idCard = row.querySelector(`input[name="customers[${i}][idCard]"]`).value.trim();
      const phone = row.querySelector(`input[name="customers[${i}][phone]"]`).value.trim();

      customers.push({ stt: i + 1, name, type, idCard, phone });
    });

    const payload = { roomId, roomName, roomType, price, startDate, customers };

    try {
      saveBtn.disabled = true;

      const res = await fetch("/rental/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error("Server không trả JSON. Preview: " + text.slice(0, 80));
      }

      const data = await res.json();

      if (data.result === "error") {
        notyf.error(data.message || "Tạo phiếu thuê thất bại");
        saveBtn.disabled = false;
        return;
      }

      Notify("success", data.message || "Tạo phiếu thuê thành công");
      window.location.href = "/rental";
    } catch (err) {
      console.error(err);
      notyf.error(err.message || "Tạo phiếu thuê thất bại. Vui lòng thử lại.");
      saveBtn.disabled = false;
    }
  });
});
