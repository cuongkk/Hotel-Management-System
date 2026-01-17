// Notyf
const notyf = new Notyf({
  duration: 3000,
  position: {
    x: "center",
    y: "top",
  },
  dismissible: true,
});

//Tạo hàm hiển thị thông báo
const Notify = (type, message) => {
  const data = { result: type, message: message };
  sessionStorage.setItem("notify", JSON.stringify(data));
};
// End Notyf
