console.log("profile.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  // ===================== LẤY USER =====================
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Bạn cần đăng nhập!");
    window.location.href = "login.html";
    return;
  }

  // ===================== LẤY ELEMENT INPUT =====================
  const fullnameInput = document.getElementById("fullname");
  const phoneInput = document.getElementById("phone");
  const emailInput = document.getElementById("email");
  const addressInput = document.getElementById("address");
  const passwordInput = document.getElementById("password");

  // ===================== GÁN DỮ LIỆU BAN ĐẦU =====================
  fullnameInput.value = user.HoTen || "";
  phoneInput.value = user.SDT || "";
  emailInput.value = user.Email || "";
  addressInput.value = user.DiaChi || "";
  passwordInput.value = "********";

  // ===================== XỬ LÝ NÚT SỬA =====================
  const editButtons = document.querySelectorAll(".edit-btn");

  editButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      input.disabled = !input.disabled;
      btn.textContent = input.disabled ? "Sửa" : "Xong";

      if (input.id === "password") {
        input.type = input.disabled ? "password" : "text";
        if (input.disabled) input.value = "********";
        else input.value = "";
      }
    });
  });

  // ===================== NÚT LƯU =====================
  const saveBtn = document.querySelector(".save-btn");

  saveBtn.addEventListener("click", async () => {
    const updatedData = {
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
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      const newUser = await res.json();
      localStorage.setItem("user", JSON.stringify(newUser));
      alert("Cập nhật thông tin thành công!");
      location.reload();
    } catch (err) {
      console.error(err);
      alert("Lỗi: " + err.message);
    }
  });

  // ===================== CHUYỂN TAB =====================
  const menuItems = document.querySelectorAll(".menu-item");
  const sections = document.querySelectorAll(".section");

  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      menuItems.forEach(i => i.classList.remove("active"));
      sections.forEach(sec => sec.classList.add("hidden"));

      item.classList.add("active");
      document.getElementById(item.dataset.target).classList.remove("hidden");
    });
  });

  // ===================== LOAD ĐƠN HÀNG =====================
  async function loadOrders() {
    try {
      const res = await fetch("http://localhost:3000/donhang");
      if (!res.ok) throw new Error("Không thể tải danh sách đơn hàng");

      const allOrders = await res.json();
      const orderList = document.getElementById("orderList");

      const userOrders = allOrders.filter(o => o.MaKhachHang === user.MaKhachHang);

      if (userOrders.length === 0) {
        orderList.innerHTML = `<tr><td colspan="5" class="no-order">Bạn chưa có đơn hàng nào</td></tr>`;
        return;
      }

      orderList.innerHTML = "";
      userOrders.forEach(order => {
        const dh = order.donhangs?.[0];
        if (!dh) return;

        const maDonHang = dh.MaDonHang;
        const trangThai = dh.TrangThai || "Chờ xử lý";
        const ngay = new Date(order.NgayXuatHoaDon).toLocaleDateString("vi-VN");
        const tongTien = Number(order.TongTien || 0).toLocaleString("vi-VN");

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${maDonHang}</td>
          <td>${ngay}</td>
          <td>${tongTien} ₫</td>
          <td><span class="status ${trangThai.replace(" ", "-").toLowerCase()}">${trangThai}</span></td>
          <td><button class="detail-btn" onclick="showOrderDetail('${maDonHang}')">Chi tiết</button></td>
        `;
        orderList.appendChild(tr);
      });

    } catch (err) {
      console.error("Lỗi load đơn hàng:", err);
    }
  }

  loadOrders();

  // ===================== XEM CHI TIẾT ĐƠN HÀNG =====================
  window.showOrderDetail = async function(maDonHang) {
    try {
      const res = await fetch(`http://localhost:3000/donhang/${maDonHang}`);
      const detailData = await res.json();
      const hoaDon = detailData[0]?.hoaDon;

      if (!hoaDon) return alert("Không tìm thấy thông tin hóa đơn");

      let products = [];
      try {
        products = typeof hoaDon.ThongTinSanPham === "string"
          ? JSON.parse(hoaDon.ThongTinSanPham)
          : hoaDon.ThongTinSanPham;
      } catch {
        products = hoaDon.ThongTinSanPham.split(",").map(p => {
          const match = p.trim().match(/(.+?)\s*x(\d+)$/);
          return match ? { TenTraiCay: match[1], SoLuong: parseInt(match[2]) } : { TenTraiCay: p.trim(), SoLuong: 1 };
        });
      }

      const res2 = await fetch("http://localhost:3000/traicay");
      const allProducts = await res2.json();

      const modal = document.createElement("div");
      modal.id = "detailModal";
      modal.classList.add("modal");

      const modalContent = document.createElement("div");
      modalContent.classList.add("modal-content");

      let rows = "";
      products.forEach(item => {
        const product = allProducts.find(p => p.TenTraiCay === item.TenTraiCay);
        const price = product ? Number(product.GiaTien) : 0;
        rows += `
          <tr>
            <td>${product ? product.MaTraiCay : "--"}</td>
            <td>${item.TenTraiCay}</td>
            <td>${item.SoLuong}</td>
            <td>${(price * item.SoLuong).toLocaleString("vi-VN")} ₫</td>
          </tr>
        `;
      });

      modalContent.innerHTML = `
        <h2>Chi tiết đơn hàng ${maDonHang}</h2>
        <p><b>Tổng tiền:</b> ${Number(hoaDon.TongTien).toLocaleString("vi-VN")} ₫</p>
        <h3>Sản phẩm</h3>
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
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      modal.querySelector(".close-modal").addEventListener("click", () => modal.remove());
      modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });

    } catch (err) {
      console.error(err);
      alert("Lỗi khi tải chi tiết đơn hàng!");
    }
  };
});
