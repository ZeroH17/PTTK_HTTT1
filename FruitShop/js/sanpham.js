console.log("sanpham.js loaded");

const productsPerPage = 6;
let currentPage = 1;

const grid = document.getElementById("productGrid");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

let allProducts = [];
let filteredProducts = [];

// ===================== FETCH SẢN PHẨM =====================
async function fetchProducts() {
  try {
    const res = await fetch("http://localhost:3000/traicay");
    if (!res.ok) throw new Error("Không thể tải sản phẩm từ server");
    const data = await res.json();

    allProducts = data.map(p => ({
      name: p.TenTraiCay,
      price: Number(p.GiaTien),
      tag: p.tag || "",
      origin: (p.XuatXu || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-"), // chuẩn hóa slug để filter
      originRaw: p.XuatXu || "",
      img: p.img || "assets/img/default.jpg",
      stock: Number(p.SoLuong)
    }));

    filteredProducts = [...allProducts];
    renderProducts(currentPage);
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p style="text-align:center; color:red;">Không thể tải sản phẩm.</p>`;
    pagination.style.display = "none";
  }
}

// ===================== LỌC SẢN PHẨM =====================
function applyFilters() {
  let keyword = searchInput.value.toLowerCase().trim();

  // Tìm kiếm theo tên
  filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(keyword)
  );

  // Lọc xuất xứ
  const origins = [...document.querySelectorAll("input[name='origin']:checked")].map(i => i.value);
  if (origins.length > 0) {
    filteredProducts = filteredProducts.filter(p => origins.includes(p.origin));
  }

  // Lọc giá
  const priceFilter = document.querySelector("input[name='price']:checked");
  if (priceFilter) {
    const value = priceFilter.value;
    filteredProducts = filteredProducts.filter(p => {
      if (value == 1) return p.price < 50000;
      if (value == 2) return p.price >= 50000 && p.price <= 100000;
      if (value == 3) return p.price > 100000;
    });
  }

  // Lọc stock
  const stockFilter = document.querySelector("input[name='stock']:checked");
  if (stockFilter) {
    const value = stockFilter.value;
    filteredProducts = filteredProducts.filter(p => {
      if (value == 1) return p.stock > 0;
      if (value == 2) return p.stock > 0 && p.stock < 10;
      if (value == 3) return p.stock === 0;
    });
  }

  currentPage = 1;
  renderProducts(currentPage);
}

// ===================== RENDER SẢN PHẨM =====================
function renderProducts(page) {
  grid.innerHTML = "";
  const start = (page - 1) * productsPerPage;
  const products = filteredProducts.slice(start, start + productsPerPage);

  if (products.length === 0) {
    grid.innerHTML = `<p style="text-align:center; color:#777;">Không tìm thấy sản phẩm nào phù hợp.</p>`;
    pagination.style.display = "none";
    return;
  }

  products.forEach(p => {
    const isLow = p.tag.toLowerCase() === "sắp hết";
    const tagClass = isLow ? "tag low-stock" : "tag";

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p class="price">${p.price.toLocaleString("vi-VN")}đ / kg</p>
      <span class="${tagClass}">${p.tag}</span>
      <button class="btn-add" data-name="${p.name}">Thêm vào giỏ</button>
    `;
    grid.appendChild(card);
  });

  attachAddToCartButtons();
  updatePagination();
}

// ===================== PHÂN TRANG =====================
function updatePagination() {
  pagination.innerHTML = "";
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Ẩn pagination nếu <= 1 trang
  if (totalPages <= 1) {
    pagination.style.display = "none";
    return;
  } else {
    pagination.style.display = "flex";
  }

  let startPage = 1;
  let endPage = totalPages;

  if (totalPages > 3) {
    // nếu vượt quá 3 trang, chỉ hiển thị 3 trang
    if (currentPage <= 2) {
      startPage = 1;
      endPage = 3;
    } else if (currentPage >= totalPages - 1) {
      startPage = totalPages - 2;
      endPage = totalPages;
    } else {
      startPage = currentPage - 1;
      endPage = currentPage + 1;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("a");
    btn.href = "#";
    btn.textContent = i;
    btn.className = "page-btn" + (i === currentPage ? " active" : "");
    btn.addEventListener("click", e => {
      e.preventDefault();
      currentPage = i;
      renderProducts(currentPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    pagination.appendChild(btn);
  }
}


// ===================== TÌM KIẾM =====================
function searchProducts(keyword) {
  keyword = keyword.toLowerCase();
  filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(keyword));
  currentPage = 1;
  renderProducts(currentPage);
}

searchBtn.addEventListener("click", () => applyFilters());
searchInput.addEventListener("keyup", e => { if (e.key === "Enter") applyFilters(); });

// ===================== GIỎ HÀNG =====================
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

const cartBox = document.getElementById('cartBox');
const cartHeader = document.getElementById('cartHeader');
const cartContent = document.getElementById('cartContent');
const cartCount = document.getElementById('cartCount');
const cartItems = document.getElementById('cartItems');

cartHeader.addEventListener('click', () => {
  cartContent.style.display = cartContent.style.display === 'block' ? 'none' : 'block';
});

function addToCart(productName) {
  const product = allProducts.find(p => p.name === productName);
  if (!product) return;

  const existing = cart.find(p => p.name === productName);
  if (existing) existing.qty += 1;
  else cart.push({ name: productName, qty: 1, price: product.price });

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartDisplay();
}

function updateCartDisplay() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  cartCount.textContent = totalQty;

  cartItems.innerHTML = '';

  cart.forEach((item, index) => {
  const li = document.createElement('li');
  li.className = 'cart-item';

  li.innerHTML = `
    <span class="cart-name">${item.name}</span>

    <div class="cart-control">
      <button class="btn-minus">-</button>
      <input type="number" min="1" value="${item.qty}">
      <button class="btn-plus">+</button>
      <button class="btn-delete">x</button>
    </div>

    <span class="cart-price">${(item.qty * item.price).toLocaleString("vi-VN")}đ</span>
  `;

  const btnMinus = li.querySelector(".btn-minus");
  const btnPlus = li.querySelector(".btn-plus");
  const qtyInput = li.querySelector("input");
  const btnDelete = li.querySelector(".btn-delete");

  btnMinus.addEventListener("click", () => {
    if (cart[index].qty > 1) cart[index].qty -= 1;
    else cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
  });

  btnPlus.addEventListener("click", () => {
    cart[index].qty += 1;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
  });

  qtyInput.addEventListener("change", (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    cart[index].qty = val;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
  });

  btnDelete.addEventListener("click", () => {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
  });

  cartItems.appendChild(li);
});



  let totalLi = document.getElementById('cartTotal');
  if (!totalLi) {
    totalLi = document.createElement('li');
    totalLi.id = 'cartTotal';
    totalLi.className = 'cart-total';
    cartItems.appendChild(totalLi);
  }
  totalLi.textContent = `Tổng tiền: ${totalPrice.toLocaleString("vi-VN")}đ`;
}

function attachAddToCartButtons() {
  document.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.name);
    });
  });
}

// ===================== THANH TOÁN =====================
const btnThanhToan = document.getElementById("checkoutBtn");
btnThanhToan.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Giỏ hàng đang trống!");
    return;
  }
  window.location.href = "thanhtoan.html";
});

// ===================== ÁP DỤNG LỌC KHI NHẤN NÚT =====================
document.getElementById("applyFilterBtn").addEventListener("click", applyFilters);

// ===================== KHỞI TẠO =====================
fetchProducts();
updateCartDisplay();
