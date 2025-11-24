document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("userTableBody");
  const API_URL = "http://localhost:3000/khachhang"; // đổi port nếu cần

  // Load danh sách khách hàng
  function loadUsers() {
    tbody.innerHTML = `<tr><td colspan="6">Đang tải dữ liệu...</td></tr>`;
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        tbody.innerHTML = "";
        data.forEach(user => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${user.MaKhachHang}</td>
            <td>${user.HoTen}</td>
            <td>${user.Email}</td>
            <td>${user.SDT ?? ""}</td>
            <td>${user.DiaChi ?? ""}</td>
            <td>
              <button class="action-btn detail-btn" data-id="${user.MaKhachHang}">Chi Tiết</button>
            </td>
          `;
          tbody.appendChild(row);
        });

        document.querySelectorAll(".detail-btn").forEach(btn => {
          btn.addEventListener("click", showDetail);
        });
      })
      .catch(err => {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6">Không thể tải dữ liệu</td></tr>`;
      });
  }

  // Hiển thị popup chi tiết khách hàng
  function showDetail(e) {
    const id = e.target.dataset.id;
    fetch(`${API_URL}/${id}`)
      .then(res => res.json())
      .then(user => {
        const modal = document.createElement("div");
        modal.className = "modal";
        modal.innerHTML = `
          <div class="modal-content">
            <h2>Khách Hàng: ${user.MaKhachHang}</h2>
            <div class="info-row">
              <p><strong>Họ Tên:</strong> ${user.HoTen}</p>
              <p><strong>Email:</strong> ${user.Email}</p>
              <p><strong>SĐT:</strong> ${user.SDT ?? ""}</p>
              <p><strong>Địa Chỉ:</strong> ${user.DiaChi ?? ""}</p>
              <p><strong>Trạng Thái:</strong> <span id="statusText">${user.isLocked ? "Đã Khóa" : "Hoạt Động"}</span></p>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">
              <button class="action-btn lock-btn">${user.isLocked ? "Mở Khóa" : "Khóa"}</button>
              <button class="action-btn edit-btn">Sửa Thông Tin</button>
              <button class="close-btn">Đóng</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = "flex";

        // Đóng popup
        modal.querySelector(".close-btn").addEventListener("click", () => modal.remove());

        // Khóa / mở khóa
        const lockBtn = modal.querySelector(".lock-btn");
        lockBtn.addEventListener("click", () => {
          fetch(`${API_URL}/toggle-lock/${id}`, { method: "PUT" })
            .then(res => res.json())
            .then(data => {
              alert(`Cập nhật trạng thái thành công!`);
              // Cập nhật trực tiếp trạng thái trong popup
              document.getElementById("statusText").textContent = data.isLocked ? "Đã Khóa" : "Hoạt Động";
              lockBtn.textContent = data.isLocked ? "Mở Khóa" : "Khóa";
              loadUsers(); // cập nhật bảng
            })
            .catch(() => alert("Cập nhật thất bại!"));
        });

        // Sửa thông tin
        modal.querySelector(".edit-btn").addEventListener("click", () => showEditForm(user, modal));
      });
  }

  // Form sửa thông tin trong popup
  function showEditForm(user, parentModal) {
    // Tránh tạo nhiều form
    if (parentModal.querySelector("#editForm")) return;

    const form = document.createElement("form");
    form.id = "editForm";
    form.style.display = "flex";
    form.style.flexDirection = "column";
    form.style.gap = "10px";
    form.style.marginTop = "10px";

    form.innerHTML = `
      <label>Họ Tên:</label>
      <input type="text" name="HoTen" value="${user.HoTen}" required>
      <label>Email:</label>
      <input type="email" name="Email" value="${user.Email}" required>
      <label>SĐT:</label>
      <input type="text" name="SDT" value="${user.SDT ?? ''}">
      <label>Địa Chỉ:</label>
      <input type="text" name="DiaChi" value="${user.DiaChi ?? ''}">
      <label>Mật Khẩu (để trống nếu không đổi):</label>
      <input type="password" name="MatKhau" placeholder="Mật khẩu mới">
    `;

    const btnDiv = document.createElement("div");
    btnDiv.style.display = "flex";
    btnDiv.style.gap = "10px";

    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.className = "action-btn";
    saveBtn.textContent = "Lưu";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "close-btn";
    cancelBtn.textContent = "Hủy";

    btnDiv.appendChild(saveBtn);
    btnDiv.appendChild(cancelBtn);
    form.appendChild(btnDiv);
    parentModal.querySelector(".modal-content").appendChild(form);

    // Hủy form
    cancelBtn.addEventListener("click", () => form.remove());

    // Submit form
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => { if (value.trim() !== "") data[key] = value; });

      fetch(`${API_URL}/update/${user.MaKhachHang}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(updatedUser => {
        alert("Cập nhật thành công!");
        parentModal.remove();
        loadUsers();
      })
      .catch(() => alert("Cập nhật thất bại!"));
    });
  }

  loadUsers();
});
