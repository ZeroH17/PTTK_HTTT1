console.log("payment.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  // --- Lấy thông tin user đã login ---
  const user = JSON.parse(localStorage.getItem("user")) || null;

  const fullnameInput = document.getElementById("fullname");
  const addressInput = document.getElementById("address");
  const phoneInput = document.getElementById("phone");
  const emailInput = document.getElementById("email");

  if (user) {
    fullnameInput.value = user.HoTen || "";
    emailInput.value = user.Email || "";
  }

  // --- GIỎ HÀNG ---
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartList = document.getElementById("cartList");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");

  function renderCart() {
    cartList.innerHTML = "";
    let totalPrice = 0;

    cart.forEach(item => {
      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.marginBottom = "8px";

      div.innerHTML = `
        <span>${item.name} x ${item.qty}</span>
        <span>${(item.price * item.qty).toLocaleString("vi-VN")} ₫</span>
      `;

      totalPrice += item.price * item.qty;
      cartList.appendChild(div);
    });

    cartCount.textContent = cart.length;
    cartTotal.textContent = totalPrice.toLocaleString("vi-VN") + " ₫";
  }

  renderCart();

  // --- NÚT ĐẶT HÀNG ---
  const btnPlaceOrder = document.getElementById("placeOrder");
  if (!btnPlaceOrder) {
    console.error("Không tìm thấy nút đặt hàng!");
    return;
  }

  btnPlaceOrder.addEventListener("click", async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Giỏ hàng đang trống!");
      return;
    }

    // --- LẤY THÔNG TIN KHÁCH HÀNG ---
    const fullname = fullnameInput.value.trim();
    const address = addressInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();

    const genderInput = document.querySelector("input[name='gender']:checked");
    const payInput = document.querySelector("input[name='pay']:checked");

    if (!genderInput || !payInput) {
      alert("Vui lòng chọn giới tính và phương thức thanh toán!");
      return;
    }

    const gender = genderInput.value;
    const paymentMethod = payInput.value;

    if (!fullname || !address || !phone) {
      alert("Vui lòng điền đầy đủ thông tin khách hàng!");
      return;
    }

    // --- TÍNH TỔNG TIỀN ---
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // --- CHUYỂN GIỎ HÀNG SANG TEXT ---
    const productsText = cart.map(item => `${item.name} x${item.qty}`).join(", ");

    // --- TẠO PAYLOAD GỬI LÊN BACKEND ---
    const orderPayload = {
      MaNhanVien: "NV001",
      MaKhachHang: user ? user.MaKhachHang : "KH000",
      NgayXuatHoaDon: new Date().toISOString(),
      ThongTinKhachHang: `Họ tên: ${fullname}, Giới tính: ${gender}, Địa chỉ: ${address}, SDT: ${phone}, Email: ${email}, Thanh toán: ${paymentMethod}`,
      ThongTinSanPham: productsText,
      TongTien: totalPrice
    };

    console.log("ORDER PAYLOAD:", orderPayload);

    try {
      const res = await fetch("http://localhost:3000/donhang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Đặt hàng thất bại");
      }

      alert("Đặt hàng thành công!");
      localStorage.removeItem("cart");
      window.location.href = "index.html";

    } catch (err) {
      console.error(err);
      alert("Lỗi khi đặt hàng: " + err.message);
    }
  });
});
