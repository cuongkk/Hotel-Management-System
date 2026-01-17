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

    window.location.href = `/report/list?${params.toString()}`;
  });
});



// RENTAL

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("applyBtnForRental");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const roomName = document.getElementById("roomNameInput")?.value.trim();
    const status = document.getElementById("statusSelect")?.value;
    const roomType = document.getElementById("roomTypeSelect")?.value;

    console.log(roomName, status, roomType);

    const params = new URLSearchParams();

    if (roomName) params.append("roomName", roomName);
    if (status) params.append("status", status);
    if (roomType) params.append("roomType", roomType);

    window.location.href = `/rental/list?${params.toString()}`;
  });
});

document.addEventListener("DOMContentLoaded", () => {
    const saveBtn = document.getElementById("saveBtn");

    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const roomId = document.getElementById("roomId").value;
      const roomName = document.getElementById("roomName").value;
      const roomType = document.getElementById("roomType").value;
      const price = document.getElementById("price").value;
      const startDate = document.getElementById("startDate").value;

      const customers = [];
      const tables = document.querySelectorAll("table.inner-table");

      tables.forEach((table, index) => {
        const name = table.querySelector(`input[name="customers[${index}][name]"]`).value; 
        const type = table.querySelector(`select[name="customers[${index}][type]"]`).value; 
        const idCard = table.querySelector(`input[name="customers[${index}][idCard]"]`).value; 
        const phone = table.querySelector(`input[name="customers[${index}][phone]"]`).value;

        customers.push({ 
          stt: index + 1, 
          name, 
          type, 
          idCard, 
          phone, 
        });
      });

      const payload = { roomId, roomName, roomType, price, startDate, customers };
 
      const response = await fetch("/rental/create", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload), 
      });
      
      const html = await response.text(); 
      document.documentElement.innerHTML = html;
    });

});


