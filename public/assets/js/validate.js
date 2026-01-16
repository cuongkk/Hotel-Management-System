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

// Register Form
const registerForm = document.querySelector("#register-form");
if (registerForm) {
  const validation = new JustValidate("#register-form");
  validation
    .addField("#fullName", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập họ tên",
      },
      {
        rule: "minLength",
        value: 5,
        errorMessage: "Họ tên phải có ít nhất 5 ký tự",
      },
      {
        rule: "maxLength",
        value: 50,
        errorMessage: "Họ tên không được vượt quá 50 ký tự",
      },
    ])
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
      {
        rule: "customRegexp",
        value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/,
        errorMessage: "Mật khẩu phải chứa ít nhất một chữ cái và một số",
      },
    ])
    .addField("#agree", [
      {
        rule: "required",
        errorMessage: "Chấp nhận các điều khoản và điều kiện",
      },
    ])
    .onSuccess((event) => {
      const fullName = event.target.fullName.value;
      const email = event.target.email.value;
      const password = event.target.password.value;

      const dataFinal = {
        fullName: fullName,
        email: email,
        password: password,
      };

      fetch(`/${pathAdmin}/account/register`, {
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
            window.location.href = `/${pathAdmin}/account/register-initial`;
          }
        });
    });
}

// End Register Form

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
      fetch(`/${pathAdmin}/account/forgot-password`, {
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
            window.location.href = `/${pathAdmin}/account/otp-password?email=${email}`;
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

      fetch(`/${pathAdmin}/account/reset-password`, {
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
            window.location.href = `/${pathAdmin}/account/login`;
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

      fetch(`/${pathAdmin}/account/otp-password`, {
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
            window.location.href = `/${pathAdmin}/account/reset-password?email=${email}`;
          }
        });
    });
}
// End OTP Password Form
