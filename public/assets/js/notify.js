// Notyf
const notyf = new Notyf({
  duration: 3000,
  position: {
    x: "center",
    y: "top",
  },
  dismissible: true,
});

//Hiển thị thông báo từ trang trước (nếu có)
let notifyMessage = sessionStorage.getItem("notify");
if (notifyMessage) {
  notifyMessage = JSON.parse(notifyMessage);
  if (notifyMessage.result == "success") {
    notyf.success(notifyMessage);
  }
  if (notifyMessage.result == "error") {
    notyf.error(notifyMessage);
  }
  sessionStorage.removeItem("notify");
}

//Tạo hàm hiển thị thông báo
const Notify = (type, message) => {
  const data = { result: type, message: message };
  sessionStorage.setItem("notify", JSON.stringify(data));
};
// End Notyf
