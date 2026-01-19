document.addEventListener("DOMContentLoaded", () => {
  if (!reportsData || reportsData.length === 0) {
    return;
  }


  const labels = reportsData.map((r) => {
    const d = new Date(r.month);
    return `${d.getMonth() + 1}/${d.getFullYear()}`;
  });

  let data, label;

  if (reportsData[0]?.total_days !== undefined) {
    data = reportsData.map(r => Number(r.total_days));
    label = "Tổng ngày thuê";
  } else {
    data = reportsData.map(r => Number(r.total_revenue));
    label = "Doanh thu";
  }


  const ctx = document.getElementById("roomTypeChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          backgroundColor: [ "#4CAF50", "#2196F3", "#FFC107", "#FF5722", "#9C27B0", "#00BCD4" ],
        },
      ],
    },
  });

  const ctxPie = document.getElementById("roomPieChart").getContext("2d"); 
  new Chart(ctxPie, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: ["#4CAF50", "#2196F3", "#FFC107", "#FF5722", "#9C27B0", "#00BCD4"],
      }]
    },
    options: {
      plugins: {
        datalabels: {
          formatter: (value, ctx) => {
            let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            let percentage = (value / sum * 100).toFixed(1) + "%";
            return percentage;
          },
          color: "#fff"
        }
      }
    },
    plugins: [ChartDataLabels]
  });

});
