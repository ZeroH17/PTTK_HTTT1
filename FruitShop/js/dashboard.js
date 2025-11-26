let dashboardChart = null;

// --- Hàm tạo chart ---
function renderChart(type, labels, data, labelText) {
  const ctx = document.getElementById("dashboardChart").getContext("2d");

  if (dashboardChart) dashboardChart.destroy();

  dashboardChart = new Chart(ctx, {
    type: type,
    data: {
      labels: labels,
      datasets: [{
        label: labelText,
        data: data,
        backgroundColor: type === "line" ? 'rgba(0, 94, 255, 0.3)' : 'rgba(46, 125, 50, 0.6)',
        borderColor: type === "line" ? 'rgba(0, 94, 255, 1)' : 'rgba(46, 125, 50, 1)',
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: labelText, font: { size: 18 } }
      },
      scales: { y: { beginAtZero: true } }
    }
  });

  // Hiển thị container chart nếu đang ẩn
  const chartContainer = document.querySelector(".chart-container");
  chartContainer.style.display = "flex";
}

// --- Hàm in PDF ---
function printChartPDF(title) {
  const chartContainer = document.querySelector(".chart-container");

  html2canvas(chartContainer).then(canvas => {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jspdf.jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${title}.pdf`);
  }).catch(err => console.error("Lỗi tạo PDF:", err));
}

// --- Load dữ liệu dashboard ---
async function loadDashboard() {
  try {
    const res = await fetch("http://localhost:3000/baocao/dashboard");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    // --- Cập nhật số liệu ---
    document.getElementById("m_products").textContent = data.totalProductsSold || 0;
    document.getElementById("m_orders").textContent = data.totalOrders || 0;
    document.getElementById("m_users").textContent =
      data.topFruits && data.topFruits.length
        ? `${data.topFruits[0].TenTraiCay} (${data.topFruits[0].SoLuongBan})`
        : "Không có";
    document.getElementById("m_revenue").textContent =
      (data.totalRevenue || 0).toLocaleString("vi-VN") + " đ";

    const rangeBtns = document.querySelectorAll(".range-btn");
    const fromInput = document.getElementById("fromDate");
    const toInput = document.getElementById("toDate");
    const filterBtn = document.getElementById("filterDateBtn");

    // --- Nút Tổng sản phẩm ---
    document.getElementById("btn_products").onclick = () => {
      rangeBtns.forEach(btn => btn.style.display = "none");
      renderChart("bar", ["Tổng sản phẩm"], [data.totalProductsSold], "Tổng sản phẩm đã bán");
    };

    // --- Nút Tổng đơn hàng ---
    document.getElementById("btn_orders").onclick = () => {
      rangeBtns.forEach(btn => btn.style.display = "none");
      renderChart("bar", ["Tổng đơn hàng"], [data.totalOrders], "Tổng đơn hàng");
    };

    // --- Nút Trái cây bán chạy ---
    document.getElementById("btn_bestFruit").onclick = () => {
      rangeBtns.forEach(btn => btn.style.display = "none");

      if (data.topFruits && data.topFruits.length) {
        const top5 = data.topFruits.slice(0, 5);
        const labels = top5.map(f => f.TenTraiCay);
        const values = top5.map(f => f.SoLuongBan);
        renderChart("bar", labels, values, "5 loại trái cây bán chạy nhất");
      } else {
        renderChart("bar", ["Không có dữ liệu"], [0], "Trái cây bán chạy nhất");
      }

      addPDFButton("Top_5_trai_cay_ban_chay");
    };

    // --- Nút Doanh thu ---
    document.getElementById("btn_revenue").onclick = async () => {
      rangeBtns.forEach(btn => btn.style.display = "inline-block");
      rangeBtns.forEach(btn => btn.classList.remove("active"));
      rangeBtns[0]?.classList.add("active");

      await fetchRevenue(rangeBtns[0]?.dataset.range || "day");
    };

    // --- Click nút range ---
    rangeBtns.forEach(btn => {
      btn.onclick = async () => {
        rangeBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        await fetchRevenue(btn.dataset.range);
      };
    });

    // --- Nút filter theo ngày ---
    filterBtn.onclick = async () => {
      const fromDate = fromInput.value;
      const toDate = toInput.value;
      if (!fromDate || !toDate) {
        alert("Vui lòng chọn cả ngày bắt đầu và ngày kết thúc!");
        return;
      }
      await fetchRevenue("day", fromDate, toDate);
    };

    // --- Hàm fetch dữ liệu doanh thu ---
    async function fetchRevenue(type, from, to) {
      try {
        let url = `http://localhost:3000/baocao/doanhthu?type=${type}`;
        if (from) url += `&from=${from}`;
        if (to) url += `&to=${to}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const revenueData = await res.json();

        const labels = revenueData.map(d => d.label);
        const values = revenueData.map(d => d.value);

        renderChart("line", labels, values, `Doanh thu từ ${from || '...'} đến ${to || '...'}`);

        addPDFButton(`Doanh_thu_${from || ''}_${to || ''}`);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu doanh thu:", err);
      }
    }

    // --- Hàm thêm nút in PDF ---
    function addPDFButton(title) {
      const chartContainer = document.querySelector(".chart-container");
      let pdfBtn = document.getElementById("btnPrintPDF");
      if (!pdfBtn) {
        pdfBtn = document.createElement("button");
        pdfBtn.id = "btnPrintPDF";
        pdfBtn.style.marginTop = "10px";
        chartContainer.appendChild(pdfBtn);
      }
      pdfBtn.textContent = "In PDF";
      pdfBtn.onclick = () => printChartPDF(title);
    }

  } catch (err) {
    console.error("Lỗi fetch dashboard:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadDashboard);
