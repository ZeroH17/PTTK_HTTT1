// ======================= CONFIG ==========================
const API_URL = "http://localhost:3000/traicay";

// ======================= DOM ELEMENTS ====================
const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchProduct");
const filterSelect = document.getElementById("filterProduct");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");

const modal = document.getElementById("productModal");
const saveBtn = document.getElementById("saveProductBtn");
const cancelBtn = document.getElementById("cancelProductBtn");
const addBtn = document.getElementById("addProductBtn");

let editingId = null;
let products = [];

// ======================= NORMALIZE DATE ===================
function normalizeDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

function normalizeEndDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    date.setHours(23, 59, 59, 999);
    return date.getTime();
}

// ======================= LOAD PRODUCTS ====================
async function loadProducts() {
    try {
        const res = await fetch(API_URL);
        products = await res.json();
        applyFilters();
    } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
        alert("Không tải được sản phẩm. Kiểm tra backend!");
    }
}

// ======================= RENDER TABLE ====================
function renderTable(list) {
    productGrid.innerHTML = `
    <table class="excel-table">
      <thead>
        <tr>
          <th>Mã Trái Cây</th>
          <th>Tên Trái Cây</th>
          <th>Giá (VNĐ)</th>
          <th>Số lượng</th>
          <th>Xuất Xứ</th>
          <th>Ngày nhập</th>
          <th>Tác vụ</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(p => `
          <tr>
            <td>${p.MaTraiCay}</td>
            <td>${p.TenTraiCay}</td>
            <td>${Number(p.GiaTien).toLocaleString()}</td>
            <td>${p.SoLuong ?? 0}</td>
            <td>${p.XuatXu ?? ""}</td>
            <td>${p.NgayNhap ? new Date(p.NgayNhap).toLocaleDateString() : ""}</td>
            <td>
              <button class="edit-btn" data-id="${p.MaTraiCay}">Sửa</button>
              <button class="delete-btn" data-id="${p.MaTraiCay}">Xóa</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

    // Gán sự kiện Edit
    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", () => editProduct(btn.dataset.id));
    });

    // Gán sự kiện Delete
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", () => deleteProduct(btn.dataset.id));
    });
}

// ======================= APPLY FILTERS ===================
function applyFilters() {
    const text = searchInput.value.toLowerCase();
    const type = filterSelect.value;
    const startDate = normalizeDate(startDateInput.value);
    const endDate = normalizeEndDate(endDateInput.value);

    const filtered = products.filter(p => {
        const nameMatch = p.TenTraiCay.toLowerCase().includes(text);
        const typeMatch = !type || p.TenTraiCay.toLowerCase().includes(type.toLowerCase());
        const productTime = p.NgayNhap ? new Date(p.NgayNhap).getTime() : null;

        let dateMatch = true;
        if (startDate !== null && productTime !== null) dateMatch = productTime >= startDate;
        if (endDate !== null && productTime !== null) dateMatch = dateMatch && productTime <= endDate;

        return nameMatch && typeMatch && dateMatch;
    });

    renderTable(filtered);
}

// ======================= EVENT LISTENERS =================
searchInput.addEventListener("input", applyFilters);
filterSelect.addEventListener("change", applyFilters);
startDateInput.addEventListener("change", applyFilters);
endDateInput.addEventListener("change", applyFilters);

// ======================= MODAL CONTROL ===================
function openModal() { modal.style.display = "flex"; }
function closeModal() {
    modal.style.display = "none";
    editingId = null;
    document.getElementById("pname").value = "";
    document.getElementById("pprice").value = "";
    document.getElementById("pquantity").value = "";
    document.getElementById("pxuatxu").value = "";
    document.getElementById("pimage").value = "";
    document.getElementById("pdesc").value = "";
}

cancelBtn.addEventListener("click", closeModal);
addBtn.addEventListener("click", () => {
    editingId = null;
    openModal();
});

// ======================= EDIT PRODUCT ====================
async function editProduct(id) {
    try {
        const res = await fetch(`${API_URL}/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(`Không tìm thấy sản phẩm: ${id}, status=${res.status}`);
        const p = await res.json();

        editingId = id;
        document.getElementById("pname").value = p.TenTraiCay ?? "";
        document.getElementById("pprice").value = p.GiaTien ?? 0;
        document.getElementById("pquantity").value = p.SoLuong ?? 0;
        document.getElementById("pxuatxu").value = p.XuatXu ?? "";
        document.getElementById("pdesc").value = p.tag ?? "";
        document.getElementById("pimage").value = p.img ?? "";

        openModal();
    } catch (err) {
        console.error("Lỗi load sản phẩm để edit:", err);
        alert("Không thể load sản phẩm để sửa. Xem console để biết chi tiết!");
    }
}
window.editProduct = editProduct;

// ======================= DELETE PRODUCT ===================
async function deleteProduct(id) {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm ${id}?`)) return;

    try {
        const res = await fetch(`${API_URL}/${encodeURIComponent(id)}`, { method: "DELETE" });
        const text = await res.text();
        console.log("Xóa response:", res.status, text);

        if (!res.ok) {
            alert(`Xóa thất bại! Status: ${res.status}. Kiểm tra console.`);
            return;
        }

        await loadProducts();
    } catch (err) {
        console.error("Lỗi khi xóa sản phẩm:", err);
        alert("Có lỗi khi kết nối backend. Xem console để biết chi tiết!");
    }
}
window.deleteProduct = deleteProduct;

// ======================= SAVE PRODUCT ====================
saveBtn.addEventListener("click", async () => {
    const payload = {
        TenTraiCay: document.getElementById("pname").value.trim(),
        GiaTien: Number(document.getElementById("pprice").value),
        SoLuong: Number(document.getElementById("pquantity").value),
        XuatXu: document.getElementById("pxuatxu").value.trim(),
        tag: document.getElementById("pdesc").value.trim(),
        img: document.getElementById("pimage").value.trim()
    };

    try {
        let res;
        if (editingId) {
            res = await fetch(`${API_URL}/${encodeURIComponent(editingId)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } else {
            payload.NgayNhap = new Date().toISOString().split("T")[0];
            res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        }

        const text = await res.text();
        if (!res.ok) {
            console.error("Lỗi lưu sản phẩm:", res.status, text);
            alert(`Thao tác thất bại! Status: ${res.status}. Kiểm tra console.`);
            return;
        }

        closeModal();
        await loadProducts();
    } catch (err) {
        console.error("Lỗi network khi lưu sản phẩm:", err);
        alert("Có lỗi khi kết nối backend. Xem console để biết chi tiết!");
    }
});

// ======================= INIT =============================
loadProducts();
