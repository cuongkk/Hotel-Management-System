applyBtn.addEventListener("click", async () => {
  const roomType = document.getElementById("roomType").value;
  const receptions = document.getElementById("receptions").value;
  const dateFrom = document.getElementById("dateFrom").value;
  const dateTo = document.getElementById("dateTo").value;

  console.log("Dữ liệu chuẩn bị gửi:", { roomType, receptions, dateFrom, dateTo });

  try {
    const params = new URLSearchParams({
      roomType,
      receptions,
      dateFrom,
      dateTo,
    });
  
    // window.location.href = `/report/list?${params.toString()}`;
  } catch (err) {
    console.error("Lỗi khi gửi dữ liệu:", err);
  }
});
