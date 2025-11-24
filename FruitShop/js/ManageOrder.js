console.log("staff.js loaded");

document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("#olist tbody");
    const searchInput = document.getElementById("searchOrder");
    const filterStatus = document.getElementById("filterStatus");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");

    let orders = [];

    // Chuẩn hóa ngày
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

    // Lấy danh sách đơn hàng
    async function fetchOrders() {
        try {
            const res = await fetch("http://localhost:3000/donhang");
            if (!res.ok) throw new Error("Không thể tải danh sách đơn hàng");
            orders = await res.json();
            renderOrders(orders);
        } catch (err) {
            console.error(err);
            tableBody.innerHTML = `
                <tr><td colspan="5" style="text-align:center; color:red;">Không thể tải dữ liệu.</td></tr>
            `;
        }
    }

    // Render danh sách đơn hàng
    function renderOrders(list) {
        tableBody.innerHTML = "";
        if (list.length === 0) {
            tableBody.innerHTML = `
                <tr><td colspan="5" style="text-align:center; color:#555;">Không tìm thấy đơn hàng nào phù hợp.</td></tr>
            `;
            return;
        }

        // Thêm vào trong renderOrders(list)
list.forEach(order => {
    const dh = order.donhangs?.[0];
    if (!dh) return;

    const maDonHang = dh.MaDonHang;
    const trangThai = dh.TrangThai;

    const tr = document.createElement("tr");

    let statusHtml = `<select class="status-select" data-id="${maDonHang}" ${trangThai === "Hoàn tất" ? "disabled" : ""}>
        <option value="Chờ xử lý" ${trangThai === "Chờ xử lý" ? "selected" : ""}>Chờ xử lý</option>
        <option value="Đang giao" ${trangThai === "Đang giao" ? "selected" : ""}>Đang giao</option>
        <option value="Hoàn tất" ${trangThai === "Hoàn tất" ? "selected" : ""}>Hoàn tất</option>
    </select>`;

    tr.innerHTML = `
        <td>${maDonHang}</td>
        <td>${new Date(order.NgayXuatHoaDon).toLocaleString("vi-VN")}</td>
        <td>${Number(order.TongTien).toLocaleString("vi-VN")} ₫</td>
        <td>${statusHtml}</td>
        <td>
            <button class="detail-btn" data-id="${maDonHang}">Chi tiết</button>
            <button class="print-btn" data-id="${maDonHang}">In</button>
        </td>
    `;
    tableBody.appendChild(tr);
});

// Xử lý nút In
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("print-btn")) {
        const maDonHang = e.target.dataset.id;

        try {
            const res = await fetch(`http://localhost:3000/donhang/${maDonHang}`);
            if (!res.ok) throw new Error("Không thể tải chi tiết đơn hàng");
            const data = await res.json();
            const hoaDon = data[0]?.hoaDon;
            if (!hoaDon) return alert("Không tìm thấy hóa đơn");

            // In ra console
            console.log("Hóa đơn:", hoaDon);

            // In ra cửa sổ trình duyệt
            const printWindow = window.open("", "", "width=800,height=600");
            printWindow.document.write(`<h2>Hóa đơn ${hoaDon.MaHoaDon}</h2>`);
            printWindow.document.write(`<p>Ngày xuất: ${new Date(hoaDon.NgayXuatHoaDon).toLocaleString("vi-VN")}</p>`);
            printWindow.document.write(`<p>Tổng tiền: ${Number(hoaDon.TongTien).toLocaleString("vi-VN")} ₫</p>`);
            printWindow.document.write(`<p>Khách hàng: ${(hoaDon.ThongTinKhachHang || "Không có").split(", ").join("<br>")}</p>`);

            // Danh sách sản phẩm
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

            printWindow.document.write("<table border='1' style='border-collapse:collapse; width:100%;'>");
            printWindow.document.write("<tr><th>Tên</th><th>Số lượng</th></tr>");
            products.forEach(p => {
                printWindow.document.write(`<tr><td>${p.TenTraiCay}</td><td>${p.SoLuong}</td></tr>`);
            });
            printWindow.document.write("</table>");

            printWindow.document.close();
            printWindow.print();
        } catch (err) {
            console.error(err);
            alert("Lỗi khi in hóa đơn: " + err.message);
        }
    }
});

    }

    // Lọc và tìm kiếm
    function applyFilters() {
        const keyword = searchInput.value.trim().toLowerCase();
        const status = filterStatus.value;
        const startDate = normalizeDate(startDateInput.value);
        const endDate = normalizeEndDate(endDateInput.value);

        const filteredOrders = orders.filter(o => {
            const maDonHang = (o.donhangs?.[0]?.MaDonHang || "").toLowerCase();
            const orderStatus = o.donhangs?.some(dh => dh.TrangThai === status) || status === "";

            const orderDate = normalizeDate(o.NgayXuatHoaDon);
            let dateFilter = true;
            if (startDate && orderDate < startDate) dateFilter = false;
            if (endDate && orderDate > endDate) dateFilter = false;

            return maDonHang.includes(keyword) && orderStatus && dateFilter;
        });

        renderOrders(filteredOrders);
    }

    searchInput.addEventListener("input", applyFilters);
    filterStatus.addEventListener("change", applyFilters);
    startDateInput.addEventListener("change", applyFilters);
    endDateInput.addEventListener("change", applyFilters);

    // Chi tiết hóa đơn
    document.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("detail-btn")) return;
        const maDonHang = e.target.dataset.id;

        try {
            const res = await fetch(`http://localhost:3000/donhang/${maDonHang}`);
            if (!res.ok) throw new Error("Không thể tải chi tiết đơn hàng");
            const data = await res.json();

            const hoaDon = data[0]?.hoaDon;
            if (!hoaDon) return alert("Không tìm thấy hóa đơn");

            document.getElementById("ct_mahd").textContent = hoaDon.MaHoaDon;
            document.getElementById("ct_madh").textContent = maDonHang;
            document.getElementById("ct_ngay").textContent = new Date(hoaDon.NgayXuatHoaDon).toLocaleString("vi-VN");
            document.getElementById("ct_tongtien").textContent = Number(hoaDon.TongTien).toLocaleString("vi-VN") + " ₫";

            const infoRow = document.getElementById("ct_info");
            infoRow.textContent = (hoaDon.ThongTinKhachHang || "Không có thông tin").split(", ").join("\n");

            // Render danh sách sản phẩm
            const tbody = document.getElementById("detailBody");
            tbody.innerHTML = "";

            if (hoaDon.ThongTinSanPham) {
                let products = [];

                // Thử parse JSON, fallback nếu là string
                try {
                    products = typeof hoaDon.ThongTinSanPham === "string"
                        ? JSON.parse(hoaDon.ThongTinSanPham)
                        : hoaDon.ThongTinSanPham;
                } catch {
                    // nếu không phải JSON, giả sử CSV cũ
                    products = hoaDon.ThongTinSanPham.split(",").map(p => {
                        const match = p.trim().match(/(.+?)\s*x(\d+)$/);
                        return match ? { TenTraiCay: match[1], SoLuong: parseInt(match[2]) } : { TenTraiCay: p.trim(), SoLuong: 1 };
                    });
                }

                // Lấy tất cả sản phẩm từ DB để biết giá
                const res2 = await fetch("http://localhost:3000/traicay");
                const allProducts = await res2.json();

                products.forEach(item => {
                    const product = allProducts.find(p => p.TenTraiCay === item.TenTraiCay);
                    const price = product ? Number(product.GiaTien) : 0;

                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${product ? product.MaTraiCay : "--"}</td>
                        <td>${item.TenTraiCay}</td>
                        <td>${item.SoLuong}</td>
                        <td>${(price * item.SoLuong).toLocaleString("vi-VN")} ₫</td>
                    `;
                    tbody.appendChild(tr);
                });
            }

            openInvoiceModal();
        } catch (err) {
            console.error(err);
            alert("Lỗi khi tải chi tiết: " + err.message);
        }
    });


    // Cập nhật trạng thái
    document.addEventListener("change", async (e) => {
        if (!e.target.classList.contains("status-select")) return;

        const select = e.target;
        const newStatus = select.value;
        const maDonHang = select.dataset.id;

        try {
            const res = await fetch(`http://localhost:3000/donhang/${maDonHang}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error("Cập nhật trạng thái thất bại");

            if (newStatus === "Hoàn tất") select.disabled = true;
            alert("Cập nhật trạng thái thành công!");
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });

    // Modal
    function openInvoiceModal() { document.getElementById("invoiceModal").style.display = "flex"; }
    function closeInvoiceModal() { document.getElementById("invoiceModal").style.display = "none"; }
    window.closeInvoiceModal = closeInvoiceModal;

    // Khởi tạo
    fetchOrders();
});
