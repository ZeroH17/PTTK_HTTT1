console.log("profile.js loaded");

document.addEventListener("DOMContentLoaded", () => {

  // =========================================================
  // 1. LẤY USER TỪ LOCALSTORAGE
  // =========================================================
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Bạn cần đăng nhập!");
    window.location.href = "login.html";
    return;
  }

  // =========================================================
  // 2. GÁN ELEMENT
  // =========================================================
  const fullnameInput = document.getElementById("fullname");
  const phoneInput = document.getElementById("phone");
  const emailInput = document.getElementById("email");
  const addressInput = document.getElementById("address");
  const passwordInput = document.getElementById("password");

  // Gán dữ liệu user
  fullnameInput.value = user.HoTen || "";
  phoneInput.value = user.SDT || "";
  emailInput.value = user.Email || "";
  addressInput.value = user.DiaChi || "";
  passwordInput.value = "********";

  // =========================================================
  // 3. HIỂN THỊ ĐIỂM THƯỞNG
  // =========================================================
  async function loadUserPoints() {
    const pointsDisplay = document.getElementById("points");

    try {
      const res = await fetch(`http://localhost:3000/diemthuong/${user.MaKhachHang}`);
      if (!res.ok) throw new Error("Không thể lấy điểm thưởng");

      const data = await res.json(); // data = { DiemThuong: 3 }
      const total = data.DiemThuong ?? 0;

      pointsDisplay.textContent = `Điểm thưởng: ${total}`;
    } catch (err) {
      console.error("Lỗi tải điểm thưởng:", err);
      pointsDisplay.textContent = `Điểm thưởng: ${user.DiemThuong || 0}`;
    }
  }
  loadUserPoints();

  // =========================================================
  // 4. CHỈNH SỬA THÔNG TIN HỒ SƠ
  // =========================================================
  const editBtns = document.querySelectorAll(".edit-btn");

  editBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      const isEdit = !input.disabled;

      input.disabled = isEdit;
      btn.textContent = isEdit ? "Sửa" : "Xong";

      if (input.id === "password") {
        input.type = isEdit ? "password" : "text";
        input.value = isEdit ? "********" : "";
      }
    });
  });

  // =========================================================
  // 5. LƯU THÔNG TIN USER
  // =========================================================
  document.querySelector(".save-btn").addEventListener("click", async () => {
    const updated = {
      HoTen: fullnameInput.value,
      SDT: phoneInput.value,
      Email: emailInput.value,
      DiaChi: addressInput.value,
      MatKhau: passwordInput.value === "********" ? null : passwordInput.value
    };

    try {
      const res = await fetch(`http://localhost:3000/khachhang/update/${user.MaKhachHang}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });

      if (!res.ok) throw new Error("Cập nhật thất bại");

      const newUser = await res.json();
      localStorage.setItem("user", JSON.stringify(newUser));

      alert("Cập nhật thành công!");
      location.reload();
    } catch (err) {
      console.error(err);
      alert("Lỗi: " + err.message);
    }
  });

  // =========================================================
  // 6. CHUYỂN TAB
  // =========================================================
  const menuItems = document.querySelectorAll(".menu-item");
  const sections = document.querySelectorAll(".section");

  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      menuItems.forEach(i => i.classList.remove("active"));
      sections.forEach(s => s.classList.add("hidden"));

      item.classList.add("active");
      document.getElementById(item.dataset.target).classList.remove("hidden");
    });
  });

  // =========================================================
  // 7. LOAD DANH SÁCH ĐƠN HÀNG
  // =========================================================
  async function loadOrders() {
    try {
      const res = await fetch("http://localhost:3000/donhang");
      if (!res.ok) throw new Error("Không thể tải đơn hàng");

      const all = await res.json();
      const list = document.getElementById("orderList");

      const orders = all.filter(o => o.MaKhachHang === user.MaKhachHang);

      if (orders.length === 0) {
        list.innerHTML = `<tr><td colspan="5" class="no-order">Bạn chưa có đơn hàng nào</td></tr>`;
        return;
      }

      list.innerHTML = "";

      orders.forEach(order => {
        const dh = order.donhangs?.[0];
        if (!dh) return;

        const tr = document.createElement("tr");

        const date = new Date(order.NgayXuatHoaDon).toLocaleDateString("vi-VN");
        const price = Number(order.TongTien).toLocaleString("vi-VN");
        const st = dh.TrangThai || "Chờ xử lý";
        const isDone = st.toLowerCase() === "hoàn tất";

        tr.innerHTML = `
          <td>${dh.MaDonHang}</td>
          <td>${date}</td>
          <td>${price} ₫</td>
          <td><span class="status ${st.replace(" ", "-").toLowerCase()}">${st}</span></td>
          <td>
            <button class="detail-btn" onclick="showOrderDetail('${dh.MaDonHang}')">Chi tiết</button>
            ${isDone ? `<button class="cancel-btn" data-id="${dh.MaDonHang}">Hoàn đơn</button>` : ""}
          </td>
        `;
        list.appendChild(tr);
      });

    } catch (err) {
      console.error(err);
    }
  }
  loadOrders();

  // =========================================================
  // 8. HOÀN ĐƠN (POST /donhang/cancel/:id)
  // =========================================================
  document.addEventListener("click", async e => {
    if (!e.target.classList.contains("cancel-btn")) return;

    const id = e.target.dataset.id;

    if (!confirm(`Hoàn đơn hàng ${id}?`)) return;

    try {
      const res = await fetch(`http://localhost:3000/donhang/cancel/${id}`, { method: "POST" });

      if (!res.ok) throw new Error("Không hoàn được đơn");

      await loadOrders();
      await loadUserPoints();

      alert(`Đã hoàn đơn ${id}`);
    } catch (err) {
      console.error(err);
      alert("Lỗi hoàn đơn");
    }
  });

  // =========================================================
  // 9. POPUP CHI TIẾT ĐƠN HÀNG
  // =========================================================
  window.showOrderDetail = async function (maDonHang) {
    try {
      const res = await fetch(`http://localhost:3000/donhang/${maDonHang}`);
      const detail = await res.json();
      const bill = detail[0]?.hoaDon;

      if (!bill) return alert("Không tìm thấy hóa đơn");

      let products = [];

      try {
        products = typeof bill.ThongTinSanPham === "string"
          ? JSON.parse(bill.ThongTinSanPham)
          : bill.ThongTinSanPham;
      } catch {
        products = [];
      }

      // Lấy danh sách giá
      const res2 = await fetch("http://localhost:3000/traicay");
      const allProducts = await res2.json();

      let rows = "";
      products.forEach(item => {
        const p = allProducts.find(x => x.TenTraiCay === item.TenTraiCay);
        const price = p ? Number(p.GiaTien) : 0;

        rows += `
          <tr>
            <td>${p ? p.MaTraiCay : "--"}</td>
            <td>${item.TenTraiCay}</td>
            <td>${item.SoLuong}</td>
            <td>${(price * item.SoLuong).toLocaleString("vi-VN")} ₫</td>
          </tr>
        `;
      });

      // Tạo popup
      const modal = document.createElement("div");
      modal.id = "detailModal";
      modal.classList.add("modal");

      modal.innerHTML = `
        <div class="modal-content">
          <h2>Chi tiết đơn ${maDonHang}</h2>
          <p><b>Tổng tiền:</b> ${Number(bill.TongTien).toLocaleString("vi-VN")} ₫</p>

          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <button class="close-modal">Đóng</button>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector(".close-modal").addEventListener("click", () => modal.remove());
      modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });

    } catch (err) {
      console.error(err);
      alert("Lỗi tải chi tiết đơn hàng!");
    }
  };
});
