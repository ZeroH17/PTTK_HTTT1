/* Không kiểm tra admin login nữa */
function requireStaff() {
  return true; 
}

/* Storage helpers */
function getUsers() { return JSON.parse(localStorage.getItem("users") || "[]"); }
function setUsers(v){ localStorage.setItem("users", JSON.stringify(v)); }

function getProducts(){ return JSON.parse(localStorage.getItem("products") || "[]"); }
function setProducts(v){ localStorage.setItem("products", JSON.stringify(v)); }

function getOrders(){ return JSON.parse(localStorage.getItem("orders") || "[]"); }
function setOrders(v){ localStorage.setItem("orders", JSON.stringify(v)); }

function getStaff(){ return JSON.parse(localStorage.getItem("staff") || "[]"); }
function setStaff(v){ localStorage.setItem("staff", JSON.stringify(v)); }

/* ============================================================
    🍏 ON LOAD — KHỞI TẠO CRUD
============================================================ */
document.addEventListener("DOMContentLoaded", ()=>{

  /* ============================
      QUẢN LÝ SẢN PHẨM
  ============================ */
  let products = getProducts();
  const productBody = document.querySelector("#plist tbody");
  const pModal = document.querySelector("#productModal");

  function renderProducts(){
    if(!productBody) return;
    if(products.length===0){
      productBody.innerHTML = `<tr><td colspan="5">Chưa có sản phẩm</td></tr>`;
      return;
    }
    productBody.innerHTML = products.map((p,i)=>`
      <tr>
        <td>${p.name}</td>
        <td>${p.price.toLocaleString()}₫</td>
        <td><img src="${p.image}" width="60"></td>
        <td>${p.desc}</td>
        <td>
          <button class="btn-edit" onclick="editProduct(${i})">✏️</button>
          <button class="btn-del" onclick="deleteProduct(${i})">🗑️</button>
        </td>
      </tr>
    `).join("");
  }

  window.editProduct = function(i){
    pModal.style.display="flex";
    const p = products[i];
    document.getElementById("pname").value=p.name;
    document.getElementById("pprice").value=p.price;
    document.getElementById("pimage").value=p.image;
    document.getElementById("pdesc").value=p.desc;
    window.__editingProduct = i;
  }

  window.deleteProduct = function(i){
    if(confirm("Xóa sản phẩm?")){
      products.splice(i,1);
      setProducts(products);
      renderProducts();
    }
  }

  document.getElementById("saveProductBtn")?.addEventListener("click", ()=>{
    const name = pname.value;
    const price = Number(pprice.value);
    const image = pimage.value;
    const desc = pdesc.value;

    const product = {name, price, image, desc};

    if(window.__editingProduct>=0){
      products[window.__editingProduct] = product;
    } else {
      products.push(product);
    }
    setProducts(products);
    pModal.style.display="none";
    renderProducts();
  });

  document.getElementById("addProductBtn")?.addEventListener("click",()=>{
    window.__editingProduct = -1;
    pModal.style.display="flex";
  });

  document.getElementById("cancelProductBtn")?.addEventListener("click",()=>{
    pModal.style.display="none";
  });

  renderProducts();


  /* ============================
      QUẢN LÝ ĐƠN HÀNG
  ============================ */
  let orders = getOrders();
  const orderBody = document.querySelector("#olist tbody");

  function renderOrders(){
    if(!orderBody) return;
    if(orders.length===0){
      orderBody.innerHTML = `<tr><td colspan="5">Chưa có đơn hàng</td></tr>`;
      return;
    }
    orderBody.innerHTML = orders.map(o=>`
      <tr>
        <td>${o.id}</td>
        <td>${o.date}</td>
        <td>${o.total.toLocaleString()}₫</td>
        <td>${o.status}</td>
        <td><button class="btn-edit">Xem</button></td>
      </tr>
    `).join("");
  }

  renderOrders();


  /* ============================
      QUẢN LÝ KHÁCH HÀNG
  ============================ */
  let users = getUsers();
  const userBody = document.querySelector("#ulist tbody");

  function renderUsers(){
    if(!userBody) return;
    userBody.innerHTML = users.map(u=>`
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
      </tr>
    `).join("");
  }

  renderUsers();


  /* ============================
      QUẢN LÝ NHÂN VIÊN
  ============================ */
  let staff = getStaff();
  const staffBody = document.querySelector("#slist tbody");
  const sModal = document.querySelector("#staffModal");

  function renderStaff(){
    if(!staffBody) return;
    if(staff.length===0){
      staffBody.innerHTML = `<tr><td colspan="4">Chưa có nhân viên</td></tr>`;
      return;
    }
    staffBody.innerHTML = staff.map((s,i)=>`
      <tr>
        <td>${s.name}</td>
        <td>${s.phone}</td>
        <td>${s.position}</td>
        <td>
          <button class="btn-edit" onclick="editStaff(${i})">✏️</button>
          <button class="btn-del" onclick="deleteStaff(${i})">🗑️</button>
        </td>
      </tr>
    `).join("");
  }

  window.editStaff = function(i){
    sModal.style.display="flex";
    const st = staff[i];
    sname.value = st.name;
    sphone.value = st.phone;
    spos.value = st.position;
    window.__editingStaff = i;
  }

  window.deleteStaff = function(i){
    if(confirm("Xóa nhân viên?")){
      staff.splice(i,1);
      setStaff(staff);
      renderStaff();
    }
  }

  document.getElementById("addStaffBtn")?.addEventListener("click",()=>{
    window.__editingStaff = -1;
    sModal.style.display="flex";
  });

  document.getElementById("saveStaffBtn")?.addEventListener("click", ()=>{
    const obj = {
      name: sname.value,
      phone: sphone.value,
      position: spos.value
    };

    if(window.__editingStaff>=0){
      staff[window.__editingStaff]=obj;
    } else staff.push(obj);

    setStaff(staff);
    sModal.style.display="none";
    renderStaff();
  });

  document.getElementById("cancelStaffBtn")?.addEventListener("click",()=>{
    sModal.style.display="none";
  });

  renderStaff();
});
// LOGOUT
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("staffLoggedIn"); 
      window.location.href = "../login.html";
    });
  }
});
