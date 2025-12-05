let API_BASE_URL = 'https://grandluxe-fix-backend-lagi.vercel.app/';
const PROXY_BASE_URL = 'http://localhost:8010'; // dev CORS proxy (optional)

// If the frontend is served from localhost, prefer the local backend automatically
try {
  if (typeof window !== 'undefined' && (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')) {
    API_BASE_URL = 'http://localhost:5000';
  }
} catch (e) {}

async function safeFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch (err) {
    // Network or CORS error — optionally try dev proxy if enabled and URL is API
    const useProxy = (typeof window !== 'undefined') && (localStorage.getItem('useProxy') === 'true');
    if (!useProxy) throw err;
    try {
      if (typeof url === 'string' && url.startsWith(API_BASE_URL)) {
        const proxied = url.replace(API_BASE_URL, PROXY_BASE_URL);
        console.warn(`Primary fetch failed, retrying via proxy: ${proxied}`);
        return await fetch(proxied, options);
      }
    } catch (err2) {
      console.error('Proxy fetch also failed', err2);
    }
    throw err;
  }
}

document.addEventListener("DOMContentLoaded", function () {

  // Render a small proxy toggle for development (persists in localStorage)
  function renderProxyToggle() {
    if (document.getElementById('proxy-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'proxy-toggle';
    btn.setAttribute('aria-label', 'Toggle dev proxy');
    btn.style = 'position:fixed;right:12px;bottom:12px;background:#ffffff;border:1px solid rgba(0,0,0,0.08);padding:8px 10px;border-radius:8px;z-index:9999;box-shadow:0 6px 20px rgba(0,0,0,0.08);font-size:12px;color:#2c2c2c';
    const updateLabel = () => { btn.textContent = 'Proxy: ' + (localStorage.getItem('useProxy') === 'true' ? 'On' : 'Off'); };
    btn.addEventListener('click', () => {
      const current = localStorage.getItem('useProxy') === 'true';
      localStorage.setItem('useProxy', (!current).toString());
      updateLabel();
      alert('Dev proxy ' + (!current ? 'enabled' : 'disabled') + '.');
    });
    updateLabel();
    document.body.appendChild(btn);
  }

  renderProxyToggle();


  // ============================================================
  // 1. NAVBAR & UI (Mobile Menu & Scroll)
  // ============================================================
  const menuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  const overlay = document.getElementById("overlay");

  if (menuButton && mobileMenu) {
    const toggleMenu = () => {
      const isClosed = mobileMenu.classList.contains("right-[-250px]");
      if (isClosed) {
        mobileMenu.classList.replace("right-[-250px]", "right-0");
        overlay?.classList.remove("hidden");
      } else {
        mobileMenu.classList.replace("right-0", "right-[-250px]");
        overlay?.classList.add("hidden");
      }
    };
    menuButton.addEventListener("click", toggleMenu);
    overlay?.addEventListener("click", toggleMenu);
  }

  window.addEventListener("scroll", function () {
    const navbar = document.getElementById("navbar");
    if (navbar) {
        if (window.scrollY > 100) {
        navbar.classList.add("shadow-lg", "py-3");
        navbar.classList.remove("py-4");
        } else {
        navbar.classList.remove("shadow-lg", "py-3");
        navbar.classList.add("py-4");
        }
    }
  });

  // ============================================================
  // 2. AUTHENTICATION (LOGIN & REGISTER)
  // ============================================================
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");
  const showLogin = document.getElementById("show-login");
  const showRegister = document.getElementById("show-register");

  if (showLogin) {
    showLogin.addEventListener("click", (e) => {
      e.preventDefault();
      registerForm?.classList.add("hidden");
      loginForm?.classList.remove("hidden");
    });
  }

  if (showRegister) {
    showRegister.addEventListener("click", (e) => {
      e.preventDefault();
      loginForm?.classList.add("hidden");
      registerForm?.classList.remove("hidden");
    });
  }

  // REGISTER
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = registerForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      btn.disabled = true;

      const payload = {
        name: document.getElementById("reg-name").value,
        email: document.getElementById("reg-email").value,
        phone: document.getElementById("reg-phone").value,
        password: document.getElementById("reg-password").value
      };

      try {
        const res = await safeFetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success) {
          alert("✅ Berhasil daftar! Silakan login.");
          registerForm.reset();
          registerForm.classList.add("hidden");
          loginForm.classList.remove("hidden");
        } else {
          alert("❌ " + data.message);
        }
      } catch (err) { alert("⚠️ Error koneksi."); } 
      finally { btn.textContent = originalText; btn.disabled = false; }
    });
  }

  // LOGIN
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Masuk...';
      btn.disabled = true;

      const payload = {
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value
      };

      try {
        const res = await safeFetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("role", data.user.role);
          localStorage.setItem("userName", data.user.name);
          localStorage.setItem("userEmail", payload.email); 

          alert(`✅ Selamat datang, ${data.user.name}!`);
          window.location.href = (data.user.role === "Admin") ? "admin.html" : "user.html";
        } else {
          alert("❌ " + data.message);
        }
      } catch (err) { alert("⚠️ Error koneksi."); } 
      finally { btn.textContent = originalText; btn.disabled = false; }
    });
  }

  // LOGOUT
  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    alert("Anda telah keluar.");
    window.location.href = "login.html";
  };

  ["logout-btn", "logout-btn-admin", "logout-btn-user"].forEach(id => {
      const btn = document.getElementById(id);
      if(btn) btn.addEventListener("click", handleLogout);
  });

  // CEK AVATAR NAVBAR
  const userAvatar = document.getElementById("user-avatar");
  if (userAvatar) {
    const isLogged = localStorage.getItem("isLoggedIn") === "true";
    const userRole = localStorage.getItem("role");
    userAvatar.href = isLogged ? ((userRole === "Admin") ? "admin.html" : "user.html") : "login.html";
  }

  // ============================================================
  // 3. BOOKING SYSTEM (USER)
  // ============================================================
  const bookingForm = document.getElementById("booking-form");
  const checkInInput = document.getElementById("check-in");
  const checkOutInput = document.getElementById("check-out");

  // Tangkap Data dari URL
  const urlParams = new URLSearchParams(window.location.search);
  const roomIdParam = urlParams.get('id');
  const roomTypeParam = urlParams.get('type');
  const roomPriceParam = urlParams.get('price');

  if (document.getElementById("display-room-type")) {
      if (!roomIdParam) {
          alert("⚠️ Silakan pilih kamar dulu!");
          window.location.href = "kamar.html"; 
      } else {
          document.getElementById("display-room-type").textContent = roomTypeParam;
          document.getElementById("display-room-price").textContent = `Rp ${parseInt(roomPriceParam).toLocaleString('id-ID')}`;
          
          document.getElementById("selected-room-id").value = roomIdParam;
          document.getElementById("selected-room-name").value = roomTypeParam;
          document.getElementById("selected-room-price").value = roomPriceParam;

          // Update Ringkasan Kanan
          document.querySelector(".summary-room-name").textContent = roomTypeParam;
          document.querySelector(".summary-room-details").textContent = `Rp ${parseInt(roomPriceParam).toLocaleString('id-ID')} / malam`;
      }
  }

  // Proteksi Tanggal
  if (checkInInput && checkOutInput) {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    checkInInput.min = today.toISOString().split('T')[0];
    checkOutInput.disabled = true;

    checkInInput.addEventListener("change", function() {
      if (this.value) {
        checkOutInput.disabled = false;
        const minOut = new Date(this.value);
        minOut.setDate(minOut.getDate() + 1);
        const minOutString = minOut.toISOString().split('T')[0];
        checkOutInput.min = minOutString;
        if (checkOutInput.value && checkOutInput.value < minOutString) checkOutInput.value = "";
      }
    });
  }

  // Kalkulasi Total
  const calculateTotal = () => {
    const inDate = document.getElementById("check-in").value;
    const outDate = document.getElementById("check-out").value;
    const price = parseInt(document.getElementById("selected-room-price")?.value || 0);
    const name = document.getElementById("selected-room-name")?.value;

    if (price > 0 && inDate && outDate) {
      const d1 = new Date(inDate);
      const d2 = new Date(outDate);
      const days = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
      
      if (days > 0) {
        const subtotal = price * days;
        const tax = subtotal * 0.1;
        const discount = subtotal * 0.05;
        const total = subtotal + tax - discount;

        document.querySelector(".summary-room-name").textContent = name;
        document.querySelector(".summary-room-details").textContent = `Rp ${price.toLocaleString()} x ${days} malam`;
        document.querySelector(".summary-tax").textContent = `Rp ${Math.round(tax).toLocaleString()}`;
        document.querySelector(".summary-discount").textContent = `- Rp ${Math.round(discount).toLocaleString()}`;
        document.querySelector(".summary-total").textContent = `Rp ${Math.round(total).toLocaleString()}`;
      }
    }
  };

  if(checkInInput) checkInInput.addEventListener("change", calculateTotal);
  if(checkOutInput) checkOutInput.addEventListener("change", calculateTotal);

  // Submit Booking
  if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) { alert("⚠️ Login dulu!"); window.location.href = "login.html"; return; }

      const inDate = document.getElementById("check-in").value;
      const outDate = document.getElementById("check-out").value;
      const roomId = document.getElementById("selected-room-id").value;
      const price = parseInt(document.getElementById("selected-room-price").value);
      const roomName = document.getElementById("selected-room-name").value;

      if (!inDate || !outDate) return alert("Tanggal wajib diisi!");

      const days = Math.ceil((new Date(outDate) - new Date(inDate)) / (1000 * 60 * 60 * 24));
      const btn = bookingForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true; btn.textContent = "Memproses...";

      try {
        const res = await safeFetch(`${API_BASE_URL}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            room_id: roomId, check_in: inDate, check_out: outDate, total_price: price * days
          })
        });
        const data = await res.json();
        
        if (data.success) {
          const nomorAdmin = "6282277158217"; 
          const userName = localStorage.getItem("userName") || "Tamu";
          const totalBayar = parseInt(price * days).toLocaleString('id-ID');
          const textChat = `Halo Admin Grand Luxe, konfirmasi pesanan baru.\n\n*Detail:*\n👤 ${userName}\n🏨 ${roomName}\n📅 ${inDate} s/d ${outDate}\n💰 Rp ${totalBayar}\n\nMohon diproses.`;
          
          if(confirm("✅ Pesanan Dibuat! Lanjut ke WhatsApp?")) {
              window.open(`https://wa.me/${nomorAdmin}?text=${encodeURIComponent(textChat)}`, '_blank'); 
          }
          window.location.href = "user.html";
        } else {
          alert("❌ " + data.message);
        }
      } catch (err) { alert("⚠️ Error koneksi."); } 
      finally { btn.disabled = false; btn.textContent = originalText; }
    });
  }

  // ============================================================
  // 4. LOAD PUBLIC ROOMS (Anti Putih)
  // ============================================================
  const roomsContainer = document.getElementById("rooms-container");
  if (roomsContainer) {
    (async () => {
      roomsContainer.innerHTML = `
        <div class="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12">
          <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p class="text-gray-500">Sedang memuat data kamar dari database...</p>
        </div>`;
      try {
        const res = await safeFetch(`${API_BASE_URL}/rooms`);
        if(!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.success) {
          roomsContainer.innerHTML = "";
          json.data.forEach(room => {
            const harga = parseInt(room.price).toLocaleString('id-ID');
            const facilities = room.facilities ? room.facilities.split(',').map(f => `<span class="bg-gray-100 px-2 py-1 rounded text-xs mr-1">${f}</span>`).join('') : '';
            
            let btnAction = `
              <button onclick="window.location.href='pemesanan.html?id=${room.id}&type=${encodeURIComponent(room.type)}&price=${room.price}'" 
              class="btn-pesan w-full bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 mt-4 transition">Pesan Sekarang</button>`;
            
            let statusBadge = '';
            if (room.status !== 'Tersedia') {
               btnAction = `<button disabled class="w-full bg-gray-300 text-gray-500 px-4 py-2 rounded cursor-not-allowed mt-4">Tidak Tersedia</button>`;
               statusBadge = `<div class="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow z-10">${room.status}</div>`;
            }

            const defaultImg = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800';
            const imageUrl = room.image_url ? room.image_url : defaultImg;

            roomsContainer.insertAdjacentHTML('beforeend', `
              <div class="room-card bg-white rounded-xl shadow-lg overflow-hidden relative h-full flex flex-col hover:shadow-2xl transition">
                ${statusBadge}
                <div class="h-64 w-full overflow-hidden bg-gray-200">
                    <img 
                        src="${imageUrl}" 
                        alt="${room.type}" 
                        class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        onerror="this.onerror=null; this.src='${defaultImg}';" 
                    />
                </div>
                <div class="p-6 flex flex-col flex-grow">
                  <h3 class="text-xl font-bold mb-2 font-serif">${room.type}</h3>
                  <p class="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">${room.description || 'Kamar nyaman.'}</p>
                  <div class="mb-4 flex flex-wrap gap-1">${facilities}</div>
                  <div class="mt-auto pt-4 border-t">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-500 text-sm">Mulai</span>
                      <span class="text-primary font-bold text-lg">Rp ${harga}</span>
                    </div>
                    ${btnAction}
                  </div>
                </div>
              </div>`);
          });
        } else {
          roomsContainer.innerHTML = `<div class="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12 text-gray-600">Tidak ada data kamar.</div>`;
        }
      } catch (err) {
        console.error(err);
        roomsContainer.innerHTML = `
          <div class="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12">
            <i class="fas fa-exclamation-triangle text-4xl text-red-600 mb-4"></i>
            <p class="text-gray-700 mb-2">Gagal memuat data kamar.</p>
            <p class="text-gray-500 text-sm">Penyebab umum: server tidak mengizinkan CORS atau server sedang offline.</p>
            <p class="text-gray-500 text-sm mt-2">Untuk development, jalankan backend dengan header CORS atau gunakan proxy (contoh: <a class="text-primary underline" href="https://github.com/Rob--W/cors-anywhere/" target="_blank">CORS proxy</a>).</p>
          </div>`;
      }
    })();
  }

  // Search Bar
  const searchInput = document.getElementById("search-room-input");
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const keyword = e.target.value.toLowerCase();
      document.querySelectorAll(".room-card").forEach((card) => {
        const title = card.querySelector("h3").textContent.toLowerCase();
        card.style.display = title.includes(keyword) ? "flex" : "none";
      });
    });
  }

  // ============================================================
  // 5. USER DASHBOARD
  // ============================================================
  const bookingHistoryBody = document.getElementById("booking-history-body");
  if (bookingHistoryBody) {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return window.location.href = "login.html";

      try {
        const res = await safeFetch(`${API_BASE_URL}/bookings/my`, { headers: { 'Authorization': `Bearer ${token}` } });
        const json = await res.json();
        if (json.success) {
          bookingHistoryBody.innerHTML = "";
          if (json.data.length === 0) bookingHistoryBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Belum ada riwayat.</td></tr>';
          
          json.data.forEach(b => {
            let badge = "bg-gray-100";
            if(b.status === "Dikonfirmasi") badge = "bg-blue-100 text-blue-800";
            if(b.status === "Aktif") badge = "bg-green-100 text-green-800";
            if(b.status === "Dibatalkan") badge = "bg-red-100 text-red-800";

            const dates = `${new Date(b.check_in).toLocaleDateString('id-ID')} - ${new Date(b.check_out).toLocaleDateString('id-ID')}`;
            bookingHistoryBody.innerHTML += `
              <tr class="border-b hover:bg-gray-50">
                <td class="py-3 px-4 font-medium">${dates}</td>
                <td class="py-3 px-4">${b.room_type}<br><span class="text-xs text-gray-500">ID: ${b.id}</span></td>
                <td class="py-3 px-4"><span class="${badge} px-2 py-1 rounded text-xs font-bold">${b.status}</span></td>
                <td class="py-3 px-4 font-bold text-primary">Rp ${parseInt(b.total_price).toLocaleString('id-ID')}</td>
              </tr>`;
          });
        }
      } catch (err) { console.error(err); }
    })();
  }

  // ============================================================
  // 6. ADMIN DASHBOARD (LENGKAP + UPLOAD FOTO)
  // ============================================================
  if (window.location.pathname.includes("admin.html")) {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    if (!token || role !== "Admin") { alert("⛔ Khusus Admin!"); window.location.href = "login.html"; return; }

    // Nama Admin
    const sidebarName = document.querySelector("#admin-sidebar h3.text-lg");
    const sidebarEmail = document.getElementById("admin-email");
    if(sidebarName) sidebarName.innerText = localStorage.getItem("userName") || "Administrator";
    if(sidebarEmail) sidebarEmail.innerText = localStorage.getItem("userEmail") || "admin@grandluxe.com";

    // Load Bookings & Statistic
    const loadAdminBookings = async () => {
        const tbody = document.getElementById("bookings-table");
        if(!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Loading...</td></tr>';
        
        try {
            const res = await safeFetch(`${API_BASE_URL}/admin/bookings`, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if(json.success) {
                const bookings = json.data;
                tbody.innerHTML = "";
                
                const total = bookings.length;
                const duit = bookings.filter(b => ['Selesai','Aktif','Dikonfirmasi'].includes(b.status)).reduce((a, c) => a + parseInt(c.total_price), 0);
                const tamu = bookings.filter(b => b.status === 'Aktif').length;
                
                const statAngka = document.querySelectorAll(".bg-white h3.text-2xl");
                if(statAngka.length >= 3) { 
                   statAngka[0].innerText = total; 
                   statAngka[1].innerText = `Rp ${duit.toLocaleString('id-ID')}`; 
                   statAngka[2].innerText = tamu; 
                }

                bookings.forEach(b => {
                    let badge = "bg-gray-100";
                    if(b.status === "Dikonfirmasi") badge = "bg-blue-100 text-blue-800";
                    if(b.status === "Aktif") badge = "bg-green-100 text-green-800";
                    if(b.status === "Dibatalkan") badge = "bg-red-100 text-red-800";

                    tbody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3 font-bold">#${b.id}</td>
                        <td class="p-3">${b.guest_name}<br><span class="text-xs text-gray-500">${b.room_type}</span></td>
                        <td class="p-3 text-sm">${new Date(b.check_in).toLocaleDateString()}</td>
                        <td class="p-3"><span class="${badge} px-2 py-1 rounded text-xs font-bold">${b.status}</span></td>
                        <td class="p-3">
                            <select onchange="updateStatus(${b.id}, this.value)" class="border rounded text-sm bg-white p-1">
                                <option disabled selected>Aksi</option>
                                <option value="Dikonfirmasi">Terima</option>
                                <option value="Aktif">Check-In</option>
                                <option value="Selesai">Check-Out</option>
                                <option value="Dibatalkan">Tolak</option>
                            </select>
                        </td>
                    </tr>`;
                });
            }
        } catch(e) {
          console.error(e);
          tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6">
            <div class="text-gray-700 mb-2">Gagal memuat pemesanan admin.</div>
            <div class="text-sm text-gray-500 mb-3">Biasanya karena server tidak respons atau pembatasan CORS.</div>
            <button class="bg-primary text-white px-3 py-1 rounded" onclick="loadAdminBookings()">Coba Lagi</button>
          </td></tr>`;
        }
    };
    loadAdminBookings();

    // Update Status Booking
    window.updateStatus = async (id, status) => {
        if(!confirm(`Ubah status ke ${status}?`)) return;
        await safeFetch(`${API_BASE_URL}/admin/bookings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        loadAdminBookings();
    };

    // Navigation Tabs
    document.querySelectorAll('#admin-sidebar a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.classList.contains('kelola-kamar')) {
                e.preventDefault();
                document.querySelectorAll('[id$="-content"]').forEach(el => el.classList.add('hidden'));
                document.getElementById('kelola-kamar-content').classList.remove('hidden');
                loadAdminRooms();
            } else if (link.classList.contains('kelola-pemesanan')) {
                e.preventDefault();
                document.querySelectorAll('[id$="-content"]').forEach(el => el.classList.add('hidden'));
                document.getElementById('kelola-pemesanan-content').classList.remove('hidden');
                loadAdminBookings();
            } else if (link.getAttribute('href') === 'admin.html') {
                document.querySelectorAll('[id$="-content"]').forEach(el => el.classList.add('hidden'));
                document.getElementById('dashboard-content').classList.remove('hidden');
            }
        });
    });

    // Load Admin Rooms (DENGAN TOMBOL EDIT & HAPUS)
    window.loadAdminRooms = async () => {
        const tbody = document.getElementById("rooms-table");
        if(!tbody) return;
        
        try {
            const res = await safeFetch(`${API_BASE_URL}/rooms`);
            const json = await res.json();
            if(json.success) {
                tbody.innerHTML = "";
                
                // Update stat kamar
                const statAngka = document.querySelectorAll(".bg-white h3.text-2xl");
                const tersedia = json.data.filter(r => r.status === 'Tersedia').length;
                if(statAngka.length >= 4) statAngka[3].innerText = tersedia;

                json.data.forEach(r => {
                    const bg = r.status === 'Tersedia' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                    tbody.innerHTML += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3 font-medium">${r.type}</td>
                        <td class="p-3">Rp ${parseInt(r.price).toLocaleString('id-ID')}</td>
                        <td class="p-3"><span class="${bg} px-2 py-1 rounded text-xs font-bold">${r.status}</span></td>
                        <td class="p-3 flex gap-3">
                            <button onclick="openEditModal(${r.id}, '${r.type}', ${r.price}, '${r.status}')" class="text-blue-600 hover:underline font-medium">Edit</button>
                            <button onclick="deleteRoom(${r.id})" class="text-red-600 hover:underline font-medium">Hapus</button>
                        </td>
                    </tr>`;
                });
            }
        } catch(e) {
          console.error(e);
          tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6">
            <div class="text-gray-700 mb-2">Gagal memuat data kamar.</div>
            <div class="text-sm text-gray-500 mb-3">Periksa koneksi, atau aktifkan proxy dev jika server memblokir CORS.</div>
            <button class="bg-primary text-white px-3 py-1 rounded" onclick="loadAdminRooms()">Coba Lagi</button>
          </td></tr>`;
        }
    };

    window.deleteRoom = async (id) => {
        if(!confirm("Hapus kamar ini permanen?")) return;
        const res = await safeFetch(`${API_BASE_URL}/rooms/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        const json = await res.json();
        if(json.success) { alert("✅ Terhapus"); loadAdminRooms(); }
        else { alert("❌ Gagal: " + json.message); }
    };

    // Add Room (UPLOAD FOTO)
    const addForm = document.getElementById("add-room-form");
    if(addForm) {
        addForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = addForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.innerHTML = "Mengupload...";
            btn.disabled = true;

            const formData = new FormData();
            formData.append('type', document.getElementById("add-room-type").value);
            formData.append('price', document.getElementById("add-room-price").value);
            formData.append('description', document.getElementById("add-room-desc").value);
            formData.append('facilities', document.getElementById("add-room-facilities").value);
            formData.append('status', 'Tersedia');
            
            const fileInput = document.getElementById("add-room-image");
            if (fileInput.files[0]) {
                formData.append('image', fileInput.files[0]); 
            }

            try {
                const res = await safeFetch(`${API_BASE_URL}/rooms`, {
                    method: 'POST',
                    body: formData 
                });
                const json = await res.json(); 
                if(res.ok) {
                    alert("✅ Berhasil! Foto terupload.");
                    document.getElementById("add-room-modal").classList.add("hidden");
                    addForm.reset();
                    loadAdminRooms(); 
                } else {
                    alert("❌ Gagal: " + json.message);
                }
            } catch(e) { alert("⚠️ Error koneksi."); } 
            finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // Edit Room Logic
    window.openEditModal = (id, type, price, status) => {
        const modal = document.getElementById('edit-room-modal');
        if(modal) {
            modal.classList.remove('hidden');
            document.getElementById('edit-room-id').value = id;
            document.getElementById('edit-room-type').value = type;
            document.getElementById('edit-room-price').value = price;
            document.getElementById('edit-room-status').value = status;
        }
    };

    const editForm = document.getElementById("edit-room-form");
    if(editForm) {
        editForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-room-id').value;
            const body = {
                type: document.getElementById('edit-room-type').value,
                price: document.getElementById('edit-room-price').value,
                status: document.getElementById('edit-room-status').value
            };
            const btn = editForm.querySelector('button[type="submit"]');
            btn.innerText = "Menyimpan..."; btn.disabled = true;

            try {
                await safeFetch(`${API_BASE_URL}/rooms/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(body)
                });
                document.getElementById('edit-room-modal').classList.add('hidden');
                alert("✅ Update Berhasil");
                loadAdminRooms();
            } catch(e) { alert("Error."); }
            finally { btn.innerText = "Simpan Perubahan"; btn.disabled = false; }
        });

        const cancelEdit = document.getElementById("cancel-edit-room");
        if(cancelEdit) cancelEdit.addEventListener("click", () => document.getElementById('edit-room-modal').classList.add('hidden'));
    }
  }

});
