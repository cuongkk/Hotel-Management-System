document.addEventListener("DOMContentLoaded", () => {
  if (!reportsData || reportsData.length === 0) {
    console.log("Không có dữ liệu để vẽ biểu đồ");
    return;
  }

  console.log(reportsData);

  const labels = reportsData.map((r) => {
    const d = new Date(r.month);
    return `${d.getMonth() + 1}/${d.getFullYear()}`;
  });

  const data = reportsData.map(r => Number(r.total_revenue));

  const ctx = document.getElementById("roomTypeChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Doanh thu",
          data,
          backgroundColor: ["#4CAF50", "#2196F3", "#FFC107"],
        },
      ],
    },
  });
});
