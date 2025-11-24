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
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // Hiển thị container chart nếu đang ẩn
  const chartContainer = document.querySelector(".chart-container");
  if (chartContainer.style.display === "none" || chartContainer.style.display === "") {
    chartContainer.style.display = "flex";
  }
}

// --- Load dữ liệu dashboard ---
async function loadDashboard() {
  try {
    const res = await fetch("http://localhost:3000/baocao/dashboard");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    // --- Cập nhật số liệu trên card ---
    document.getElementById("m_products").textContent = data.totalProductsSold || 0;
    document.getElementById("m_orders").textContent = data.totalOrders || 0;
    document.getElementById("m_users").textContent =
      data.bestFruit ? `${data.bestFruit.TenTraiCay} (${data.bestFruit.SoLuongBan})` : "Không có";
    document.getElementById("m_revenue").textContent =
      (data.totalRevenue || 0).toLocaleString("vi-VN") + " đ";

    const rangeBtns = document.querySelectorAll(".range-btn");

    // --- Nút Tổng sản phẩm ---
    document.getElementById("btn_products").onclick = () => {
      rangeBtns.forEach(btn => btn.style.display = "none"); // ẩn nút range
      renderChart(
        "bar",
        ["Tổng sản phẩm"],
        [data.totalProductsSold],
        "Tổng sản phẩm đã bán"
      );
    };

    // --- Nút Tổng đơn hàng ---
    document.getElementById("btn_orders").onclick = () => {
      rangeBtns.forEach(btn => btn.style.display = "none");
      renderChart(
        "bar",
        ["Tổng đơn hàng"],
        [data.totalOrders],
        "Tổng đơn hàng"
      );
    };

    // --- Nút Trái cây bán chạy ---
    document.getElementById("btn_bestFruit").onclick = () => {
      rangeBtns.forEach(btn => btn.style.display = "none");
      if (data.bestFruit) {
        renderChart(
          "bar",
          [data.bestFruit.TenTraiCay],
          [data.bestFruit.SoLuongBan],
          "Trái cây bán chạy nhất"
        );
      }
    };

    // --- Nút Doanh thu ---
    document.getElementById("btn_revenue").onclick = async () => {
      // Hiển thị nút range
      rangeBtns.forEach(btn => btn.style.display = "inline-block");
      // Set active mặc định
      rangeBtns.forEach(btn => btn.classList.remove("active"));
      rangeBtns[0]?.classList.add("active");

      const type = rangeBtns[0]?.dataset.range || "day"; // mặc định day
      await fetchRevenue(type);
    };

    // --- Xử lý click nút range ---
    rangeBtns.forEach(btn => {
      btn.onclick = async () => {
        rangeBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const type = btn.dataset.range;
        await fetchRevenue(type);
      };
    });

    // --- Hàm fetch dữ liệu doanh thu ---
    async function fetchRevenue(type) {
      try {
        const res = await fetch(`http://localhost:3000/baocao/doanhthu?type=${type}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const revenueData = await res.json();

        const labels = revenueData.map(d => d.label);
        const values = revenueData.map(d => d.value);

        renderChart("line", labels, values, `Doanh thu theo ${type}`);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu doanh thu:", err);
      }
    }

  } catch (err) {
    console.error("Lỗi fetch dashboard:", err);
  }
}

// --- Gọi khi load trang ---
document.addEventListener("DOMContentLoaded", loadDashboard);
