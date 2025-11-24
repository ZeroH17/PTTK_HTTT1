console.log("main.js loaded ✅");

document.addEventListener("DOMContentLoaded", () => {

  // --- HEADER ELEMENTS ---
  const btnLogin = document.getElementById("btnLogin");
  const btnRegister = document.getElementById("btnRegister");
  const btnLogout = document.getElementById("btnLogout");
  const userInfo = document.getElementById("userInfo");

  // Ẩn login/register nếu đang trên trang không có
  if (btnLogin && btnRegister && btnLogout && userInfo) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      btnLogin.style.display = "none";
      btnRegister.style.display = "none";
      userInfo.textContent = `Xin chào, ${user.HoTen}`;
      userInfo.classList.remove("hidden");
      btnLogout.classList.remove("hidden");
    }

    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("user");
      location.reload();
    });
  }

  // --- LOGIN/REGISTER PAGE ELEMENTS ---
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const switchToRegister = document.getElementById("switchToRegister");
  const switchToLogin = document.getElementById("switchToLogin");

  if (loginForm && registerForm && switchToRegister && switchToLogin) {
    // Hiển thị login mặc định
    loginForm.classList.add("show");
    registerForm.classList.add("hidden");

    // Chuyển sang form Đăng ký
    switchToRegister.addEventListener("click", (e) => {
      e.preventDefault();
      loginForm.classList.add("hidden");
      loginForm.classList.remove("show");
      registerForm.classList.remove("hidden");
      registerForm.classList.add("show");
    });

    // Chuyển sang form Đăng nhập
    switchToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      registerForm.classList.add("hidden");
      registerForm.classList.remove("show");
      loginForm.classList.remove("hidden");
      loginForm.classList.add("show");
    });

    // Popup thông báo
    function showMessage(msg, type = "success") {
      const alertBox = document.createElement('div');
      alertBox.className = `alert ${type}`;
      alertBox.innerText = msg;
      document.body.appendChild(alertBox);

      setTimeout(() => alertBox.classList.add('show'), 100);
      setTimeout(() => {
        alertBox.classList.remove('show');
        setTimeout(() => alertBox.remove(), 400);
      }, 2000);
    }

    // --- REGISTER FORM SUBMIT ---
    registerForm.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const [hoTenInput, emailInput, matKhauInput] = registerForm.querySelectorAll("input");

      const payload = {
        HoTen: hoTenInput.value,
        Email: emailInput.value,
        MatKhau: matKhauInput.value,
      };

      try {
        const res = await fetch("http://localhost:3000/khachhang/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Đăng ký thất bại!");

        showMessage("Đăng ký thành công! Hãy đăng nhập.");

        setTimeout(() => {
          registerForm.classList.remove("show");
          registerForm.classList.add("hidden");
          loginForm.classList.remove("hidden");
          loginForm.classList.add("show");
        }, 1500);
      } catch (err) {
        showMessage(err.message, "error");
      }
    });

    // --- LOGIN FORM SUBMIT ---
    loginForm.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const [emailInput, matKhauInput] = loginForm.querySelectorAll("input");

      const payload = {
        email: emailInput.value,
        matKhau: matKhauInput.value,
      };

      try {
        const res = await fetch("http://localhost:3000/khachhang/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Đăng nhập thất bại!");
        }

        const data = await res.json();

        // Tạm lưu user vào localStorage
        localStorage.setItem("user", JSON.stringify(data));

        showMessage(`Xin chào, ${data.HoTen}`);

        setTimeout(() => {
          window.location.href = "index.html"; // quay về index sau khi login
        }, 1500);
      } catch (err) {
        showMessage(err.message, "error");
      }
    });
  }
});
