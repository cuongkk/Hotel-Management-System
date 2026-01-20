const loginForm = document.querySelector("#login-form");
if (loginForm) {
  const validation = new JustValidate("#login-form");
  validation
    .addField("#username", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập username",
      },
    ])
    .addField("#password", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập mật khẩu",
      },
      {
        rule: "minLength",
        value: 6,
        errorMessage: "Mật khẩu phải có ít nhất 6 ký tự",
      },
      {
        rule: "maxLength",
        value: 30,
        errorMessage: "Mật khẩu không được vượt quá 30 ký tự",
      },
      // {
      //   rule: "customRegexp",
      //   value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/,
      //   errorMessage: "Mật khẩu phải chứa ít nhất một chữ cái và một số",
      // },
    ])
    .onSuccess((event) => {
      const username = event.target.username.value;
      const password = event.target.password.value;
      const rememberPassword = event.target.remember.checked;

      const dataFinal = {
        username: username,
        password: password,
        rememberPassword: rememberPassword,
      };
      fetch(`/account/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataFinal),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.result == "error") {
            notyf.error(data.message);
          }

          if (data.result == "success") {
            // notyf.success(data.message);
            Notify(data.result, data.message);
            window.location.href = `/dashboard`;
          }
        });
    });
}
// End Login Form

// Forgot Password Form
const forgotPasswordForm = document.querySelector("#forgot-password-form");
if (forgotPasswordForm) {
  const validation = new JustValidate("#forgot-password-form");
  validation
    .addField("#email", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập email",
      },
      {
        rule: "email",
        errorMessage: "Vui lòng nhập đúng định dạng email",
      },
    ])
    .onSuccess((event) => {
      const email = event.target.email.value;
      const dataFinal = {
        email: email,
      };
      fetch(`/account/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataFinal),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.result == "error") {
            notyf.error(data.message);
          }

          if (data.result == "success") {
            // notyf.success(data.message);
            Notify(data.result, data.message);
            window.location.href = `/account/otp-password?email=${email}`;
          }
        });
    });
}
// End Forgot Password Form

// Reset Password Form
const resetPasswordForm = document.querySelector("#reset-password-form");
if (resetPasswordForm) {
  const validation = new JustValidate("#reset-password-form");
  validation
    .addField("#password", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập mật khẩu",
      },
      {
        rule: "customRegexp",
        value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/,
        errorMessage: "Mật khẩu phải chứa ít nhất một chữ cái và một số",
      },
      {
        rule: "minLength",
        value: 6,
        errorMessage: "Mật khẩu phải có ít nhất 6 ký tự",
      },
      {
        rule: "maxLength",
        value: 30,
        errorMessage: "Mật khẩu không được vượt quá 30 ký tự",
      },
      {
        rule: "customRegexp",
        value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/,
        errorMessage: "Mật khẩu phải chứa ít nhất một chữ cái và một số",
      },
    ])
    .addField("#confirmPassword", [
      {
        rule: "required",
        errorMessage: "Vui lòng xác nhận mật khẩu",
      },
      {
        validator: (value, fields) => {
          return value === fields["#password"].elem.value;
        },
        errorMessage: "Mật khẩu xác nhận không khớp",
      },
    ])
    .onSuccess((event) => {
      const password = event.target.password.value;

      const finalData = {
        password: password,
      };

      fetch(`/account/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.result == "error") {
            notyf.error(data.message);
          }
          if (data.result == "success") {
            // notyf.success(data.message);
            Notify(data.result, data.message);
            window.location.href = `/account/login`;
          }
        });
    });
}

// OTP Password Form
const otpPasswordForm = document.querySelector("#otp-password-form");
if (otpPasswordForm) {
  const validation = new JustValidate("#otp-password-form");
  validation
    .addField("#otp", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập mã OTP",
      },
    ])
    .onSuccess((event) => {
      const otp = event.target.otp.value;
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get("email");

      const dataFinal = {
        email: email,
        otp: otp,
      };

      fetch(`/account/otp-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataFinal),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.result == "error") {
            notyf.error(data.message);
          }

          if (data.result == "success") {
            // notyf.success(data.message);
            Notify(data.result, data.message);
            window.location.href = `/account/reset-password?email=${email}`;
          }
        });
    });
}
// End OTP Password Form

// Form staff create
const form = document.querySelector("#staff-create-form");

if (form) {
  const validation = new JustValidate("#staff-create-form");

  validation
    .addField("#name", [
      { rule: "required", errorMessage: "Vui lòng nhập họ tên" },
      { rule: "minLength", value: 2, errorMessage: "Họ tên quá ngắn" },
    ])
    .addField("#email", [
      { rule: "required", errorMessage: "Vui lòng nhập email" },
      { rule: "email", errorMessage: "Email không hợp lệ" },
    ])
    .addField("#phone", [
      { rule: "required", errorMessage: "Vui lòng nhập số điện thoại" },
      {
        validator: (value) => /^0\d{9}$/.test(value.trim()),
        errorMessage: "SĐT phải đúng định dạng (VD: 0901234567)",
      },
    ])
    .addField("#type", [{ rule: "required", errorMessage: "Vui lòng chọn chức vụ" }])
    .addField("#password", [
      { rule: "required", errorMessage: "Vui lòng nhập mật khẩu" },
      { rule: "minLength", value: 6, errorMessage: "Mật khẩu tối thiểu 6 ký tự" },
    ])
    .onSuccess((event) => {
      const full_name = event.target.name.value.trim();
      const email = event.target.email.value.trim();
      const phone_number = event.target.phone.value.trim();
      const role = event.target.type.value; // STAFF | MANAGER
      const password = event.target.password.value;

      const username = email.split("@")[0];

      const dataFinal = {
        username,
        email,
        full_name,
        phone_number,
        role,
        password,
      };

      fetch(`/staff/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataFinal),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.result === "error") {
            if (typeof notyf !== "undefined") notyf.error(data.message);
            else notyf.error(data.message);
            return;
          }

          Notify("success", data.message);
          window.location.href = "/staff";
        })
        .catch(() => {
          Notify("error", "Có lỗi xảy ra, vui lòng thử lại.");
        });
    });
}
// End Form staff create

// Profile Form
const profileForm = document.querySelector("#profile-form");
if (profileForm) {
  const emailInput = document.querySelector("#email");
  const phoneInput = document.querySelector("#phone");
  const editButtons = document.querySelectorAll(".inner-change");

  editButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const field = btn.dataset.field;
      if (field === "email") {
        emailInput.disabled = false;
        emailInput.focus();
      }
      if (field === "phone") {
        phoneInput.disabled = false;
        phoneInput.focus();
      }
    });
  });

  const validation = new JustValidate("#profile-form");

  validation
    .addField("#email", [
      {
        validator: () => emailInput.disabled || emailInput.value.trim().length > 0,
        errorMessage: "Vui lòng nhập email",
      },
      {
        validator: () => emailInput.disabled || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()),
        errorMessage: "Email không hợp lệ",
      },
    ])
    .addField("#phone", [
      {
        validator: () => phoneInput.disabled || phoneInput.value.trim().length > 0,
        errorMessage: "Vui lòng nhập số điện thoại",
      },
      {
        validator: (value) => phoneInput.disabled || /^0\d{9}$/.test(value.trim()),
        errorMessage: "SĐT phải đúng định dạng (VD: 0901234567)",
      },
      {
        rule: "maxLength",
        value: 10,
        errorMessage: "Số điện thoại không được vượt quá 10 ký tự",
      },
    ])
    .onSuccess(() => {
      const payload = {};
      if (!emailInput.disabled) payload.email = emailInput.value.trim();
      if (!phoneInput.disabled) payload.phone_number = phoneInput.value.trim();

      if (Object.keys(payload).length === 0) {
        notyf.error("Không có dữ liệu để cập nhật.");
        return;
      }

      fetch("/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.result === "error") {
            notyf.error(data.message);
            return;
          }
          notyf.success(data.message);
          emailInput.disabled = true;
          phoneInput.disabled = true;
        })
        .catch((err) => {
          console.error(err);
          notyf.error("Cập nhật thất bại. Vui lòng thử lại.");
        });
    });
}

//End Profile Form

// Room Update Form
const roomUpdateForm = document.querySelector("#room-update-form");

if (roomUpdateForm) {
  roomUpdateForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const roomId = roomUpdateForm.getAttribute("data-id");

    const formData = new FormData(roomUpdateForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`/room/update/${roomId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.result === "success") {
        Notify("success", result.message);
        window.location.href = "/room";
      } else {
        notyf.error("Lỗi: " + result.message);
      }
    } catch (err) {
      console.error(err);
      notyf.error("Có lỗi xảy ra khi kết nối server.");
    }
  });
}

// End Room Update Form

// Room Create Form

const roomCreateForm = document.querySelector("#room-create-form");

if (roomCreateForm) {
  const validation = new JustValidate("#room-create-form", {
    errorFieldCssClass: "is-invalid",
  });

  validation
    .addField("#room_name", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên phòng",
      },
    ])
    .addField("#room_type_id", [
      {
        rule: "required",
        errorMessage: "Vui lòng chọn loại phòng",
      },
    ])
    .onSuccess((event) => {
      const formData = new FormData(roomCreateForm);
      const data = Object.fromEntries(formData.entries());

      fetch("/room/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.result === "error") {
            notyf.error(data.message);
            return;
          }

          Notify("success", data.message);
          setTimeout(() => {
            window.location.href = "/room";
          }, 1000);
        })
        .catch((err) => {
          notyf.error(data.message);
          alert("Lỗi kết nối server");
        });
    });
}
// End Room Create Form
