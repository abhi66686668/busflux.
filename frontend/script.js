// ================= SERVICE WORKER REGISTRATION (PWA) =================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('[Service Worker] Registered successfully with scope:', reg.scope))
      .catch(err => console.error('[Service Worker] Registration failed:', err));
  });
}

// ================= UTILITIES & GLOBAL SETTINGS =================

// Base URL for backend API
const API_BASE_URL = window.location.protocol === 'file:' ? ((window.location.protocol === "file:" ? "http://localhost:5000/api" : "/api") + "") : '/api';

// Custom Toast Notification System
function showToast(message, type = 'info') {
  let container = document.getElementById("toastContainer");
  
  // Create container if it doesn't exist
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    document.body.appendChild(container);
  }
  
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let iconClass = 'fa-info-circle';
  if (type === 'success') iconClass = 'fa-check-circle';
  if (type === 'error') iconClass = 'fa-exclamation-circle';
  if (type === 'warning') iconClass = 'fa-exclamation-triangle';
  
  toast.innerHTML = `
    <i class="fas ${iconClass}"></i>
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toast);
  
  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 4000);
}

// Dynamic Navbar State Updater
async function updateNavbar() {
  const navLinks = document.getElementById("navLinks");
  if (!navLinks) return;
  
  const token = localStorage.getItem("token");
  const path = window.location.pathname;
  const page = path.split("/").pop() || "index.html";
  
  let html = `
    <li><a href="index.html" class="${page === 'index.html' ? 'active' : ''}"><i class="fas fa-home"></i> Home</a></li>
    <li><a href="buses.html" class="${page === 'buses.html' ? 'active' : ''}"><i class="fas fa-bus"></i> Buses</a></li>
  `;
  
  if (token) {
    // Show placeholder while fetching user details
    navLinks.innerHTML = `<li><a href="#"><i class="fas fa-spinner fa-spin"></i> Loading...</a></li>`;

    // Fetch and update the wallet balance in the navbar dynamically
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        
        if (user.role === 'conductor') {
          // If conductor, ONLY show Conductor Dashboard and Logout
          navLinks.innerHTML = `
            <li><a href="conductor.html" style="color: #10b981;"><i class="fas fa-qrcode"></i> Conductor Dashboard</a></li>
            <li><button onclick="toggleTheme()" title="Toggle Dark/Light Mode" style="background:transparent;border:none;color:var(--text-main);font-size:1.2rem;cursor:pointer;padding: 5px;"><i class="fas fa-moon theme-icon"></i></button></li>
            <li><button class="logout-btn-nav" onclick="logout()"><i class="fas fa-right-from-bracket"></i> Logout</button></li>
          `;
        } else if (user.role === 'admin') {
          // If admin, ONLY show Admin Dashboard and Logout
          navLinks.innerHTML = `
            <li><a href="admin.html" style="color: #6366f1;"><i class="fas fa-shield-halved"></i> Admin Dashboard</a></li>
            <li><button onclick="toggleTheme()" title="Toggle Dark/Light Mode" style="background:transparent;border:none;color:var(--text-main);font-size:1.2rem;cursor:pointer;padding: 5px;"><i class="fas fa-moon theme-icon"></i></button></li>
            <li><button class="logout-btn-nav" onclick="logout()"><i class="fas fa-right-from-bracket"></i> Logout</button></li>
          `;
        } else {
          // If normal user, show everything
          const balance = user.balance || 0;
          html = `
            <li><a href="index.html" class="${page === 'index.html' || page === '' ? 'active' : ''}">Home</a></li>
            <li><a href="buses.html" class="${page === 'buses.html' ? 'active' : ''}">Buses</a></li>
            <li><a href="wallet.html" class="nav-wallet-btn ${page === 'wallet.html' ? 'active' : ''}"><i class="fas fa-wallet"></i> Wallet: <span id="navWalletBalance">₹${balance}</span></a></li>
            <li><a href="bookings.html" class="${page === 'bookings.html' ? 'active' : ''}"><i class="fas fa-ticket"></i> My Bookings</a></li>
            <li><a href="profile.html" class="${page === 'profile.html' ? 'active' : ''}"><i class="fas fa-user"></i> Profile</a></li>
            <li style="position: relative;">
              <div class="user-noti-bell" onclick="toggleUserNotiDropdown(event)">
                <i class="fas fa-bell"></i>
                <div class="noti-dot" id="userNotiDot" style="display: none;"></div>
                <div id="userNotiDropdown" class="user-noti-dropdown" style="display: none;">
                  <div class="noti-header">
                    <h4>Notifications</h4>
                    <button onclick="clearUserNotifications(event)">Clear all</button>
                  </div>
                  <div id="userNotiList" class="noti-list">
                    <div style="text-align: center; color: #94a3b8; padding: 15px;">Loading...</div>
                  </div>
                </div>
              </div>
            </li>
            <li><button onclick="toggleTheme()" title="Toggle Dark/Light Mode" style="background:transparent;border:none;color:var(--text-main);font-size:1.2rem;cursor:pointer;padding: 5px;"><i class="fas fa-moon theme-icon"></i></button></li>
            <li><button class="logout-btn-nav" onclick="logout()"><i class="fas fa-right-from-bracket"></i> Logout</button></li>
          `;
          navLinks.innerHTML = html;
          
          // Fetch notifications after rendering nav
          fetchUserNotifications();
          
          // Home page alerts
          if (page === 'index.html' || page === '') {
            const homeAlertContainer = document.getElementById("homeAlertContainer");
            if (homeAlertContainer) {
              const passBalance = user.monthlyPassBalance || 0;
              if (passBalance > 0 && passBalance <= 50) {
                homeAlertContainer.innerHTML = `
                  <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 12px; padding: 15px; margin-bottom: 20px; color: #b91c1c; display: flex; align-items: flex-start; gap: 12px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 1.2rem; margin-top: 2px;"></i>
                    <div>
                      <strong style="font-size: 1rem;">⚠️ Very Low Balance Alert</strong><br>
                      <span style="font-size: 0.85rem;">Your Bus Wallet balance is only ₹${passBalance}. <a href="wallet.html" style="color: #b91c1c; text-decoration: underline; font-weight: bold;">Recharge now</a> to continue using BusFlux services without interruption.</span>
                    </div>
                  </div>`;
              }
            }
          }

          // Initialize WebSocket connection
          if (user && user._id) {
            initUserWebSocket(user._id);
          }
        }
      } else {
        // If fetch fails but token exists, clear token and fallback to login
        localStorage.removeItem("token");
        window.location.reload();
      }
    } catch (e) {
      console.error("Error updating nav:", e);
      navLinks.innerHTML = html; // Fallback
    }
  } else {
    html += `
      <li><button onclick="toggleTheme()" title="Toggle Dark/Light Mode" style="background:transparent;border:none;color:var(--text-main);font-size:1.2rem;cursor:pointer;padding: 5px;"><i class="fas fa-moon theme-icon"></i></button></li>
      <li><a href="register.html" class="${page === 'register.html' ? 'active' : ''}">Register</a></li>
      <li><a href="login.html" class="nav-btn ${page === 'login.html' ? 'active' : ''}">Login</a></li>
    `;
    navLinks.innerHTML = html;
  }

  // Dynamic Mobile Nav Toggle Injection
  const navContainer = navLinks.parentElement;
  if (navContainer && !document.getElementById("navToggle")) {
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "navToggle";
    toggleBtn.className = "nav-toggle-btn";
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    toggleBtn.onclick = () => {
      navLinks.classList.toggle("open");
      toggleBtn.innerHTML = navLinks.classList.contains("open") ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    };
    navContainer.appendChild(toggleBtn);
  }
}

// Run navbar setup when DOM loads
document.addEventListener("DOMContentLoaded", updateNavbar);

// ================= USER NOTIFICATIONS =================
async function fetchUserNotifications() {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/notifications`, { headers: { "Authorization": `Bearer ${token}` } });
    if (res.ok) {
      const notifications = await res.json();
      renderUserNotifications(notifications);
    }
  } catch (err) {
    console.error("Failed to fetch user notifications", err);
  }
}

function renderUserNotifications(notifications) {
  const list = document.getElementById("userNotiList");
  const dot = document.getElementById("userNotiDot");
  if (!list || !dot) return;

  if (notifications.length === 0) {
    list.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px 0;">No new notifications.</div>`;
    dot.style.display = "none";
    return;
  }

  const hasUnread = notifications.some(n => !n.read);
  dot.style.display = hasUnread ? "block" : "none";

  list.innerHTML = notifications.map(n => {
    const d = new Date(n.createdAt);
    let timeStr = "";
    const diff = (Date.now() - d) / 1000;
    if (diff < 60) timeStr = "Just now";
    else if (diff < 3600) timeStr = Math.floor(diff/60) + "m ago";
    else if (diff < 86400) timeStr = Math.floor(diff/3600) + "h ago";
    else timeStr = d.toLocaleDateString();

    return `
      <div class="user-noti-item ${n.read ? '' : 'unread'}">
        <div class="title">${n.title}</div>
        <div class="msg">${n.message}</div>
        <div class="time">${timeStr}</div>
      </div>
    `;
  }).join('');
}

function toggleUserNotiDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById("userNotiDropdown");
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
  }
}

async function clearUserNotifications(e) {
  e.stopPropagation();
  const token = localStorage.getItem("token");
  if (!token) return;
  
  try {
    await fetch(`${API_BASE_URL}/auth/notifications/read`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` }
    });
    fetchUserNotifications();
  } catch (err) {
    console.error("Failed to mark notifications read", err);
  }
}

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("userNotiDropdown");
  if (dropdown && !e.target.closest('.user-noti-bell')) {
    dropdown.style.display = "none";
  }
});



// ================= REGISTER =================

const registerForm =
  document.getElementById(
    "registerForm"
  );

if(registerForm){

  registerForm.addEventListener(

    "submit",

    async (e) => {

      e.preventDefault();



      const submitBtn =
        registerForm.querySelector(
          "button[type='submit']"
        );

      const originalBtnText =
        submitBtn.innerHTML;

      submitBtn.disabled = true;

      submitBtn.innerHTML =
        `<i class="fas fa-spinner fa-spin"></i> Registering...`;

      try {

        const formData =
          new FormData();

        formData.append(
          "name",
          document.getElementById("name").value
        );

        formData.append(
          "email",
          document.getElementById("email").value
        );

        formData.append(
          "phone",
          document.getElementById("phone").value
        );

        formData.append(
          "gender",
          document.getElementById("gender").value
        );

        formData.append(
          "age",
          document.getElementById("age").value
        );

        const dobField = document.getElementById("dob");
        if (dobField && dobField.value) {
            formData.append("dob", dobField.value);
        }

        formData.append(
          "aadhaarNumber",
          document.getElementById("aadhaarNumber").value
        );



        formData.append(
          "password",
          document.getElementById("password").value
        );

        formData.append(
          "userPhoto",
          document.getElementById("userPhoto").files[0]
        );

        formData.append(
          "idCardPhoto",
          document.getElementById("idCardPhoto").files[0]
        );
        
        if (document.getElementById('studentSection').style.display === 'block') {
          formData.append("institutionType", document.getElementById("institutionType").value);
          formData.append("institutionName", document.getElementById("institutionName").value);
          formData.append("course", document.getElementById("course").value);
          formData.append("studentIdNumber", document.getElementById("studentIdNumber").value);
          formData.append("passingYear", document.getElementById("passingYear").value);
          const studentIdFile = document.getElementById("studentIdPhoto").files[0];
          if (studentIdFile) {
            formData.append("studentIdPhoto", studentIdFile);
          }
        }



        const response =
          await fetch(

            `${API_BASE_URL}/auth/register`,

            {

              method: "POST",

              body: formData

            }

          );

        const data =
          await response.json();

        showToast(
          data.message,
          response.ok ? "success" : "error"
        );



    
        if (response.ok) {
          try {
            registerForm.reset();
          } catch (resetError) {
            console.error("Error resetting form:", resetError);
          }

          setTimeout(() => {
            window.location.href = "login.html";
          }, 1500);
        }



      } catch (error) {

        console.log(error);

        showToast(
          "Registration failed",
          "error"
        );

      } finally {

        submitBtn.disabled = false;

        submitBtn.innerHTML =
          originalBtnText;

      }

  });

}



// ================= OTP VERIFICATION =================

let isOtpVerified = false;



// SEND OTP
async function sendOtp(){

  try {

    const email =
      document.getElementById(
        "email"
      ).value;

    if(!email){

      showToast(
        "Please enter email first",
        "warning"
      );

      return;

    }

    const response =
      await fetch(

        `${API_BASE_URL}/auth/send-otp`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            email

          })

        }

      );

    const data =
      await response.json();

    showToast(
      data.message,
      response.ok ? "success" : "error"
    );



    // SHOW OTP SECTION
    if(response.ok){

      document.getElementById(
        "otpSection"
      ).style.display =
        "block";

    }

  } catch (error) {

    console.log(error);

    showToast(
      "Failed to send OTP",
      "error"
    );

  }

}



// VERIFY OTP
async function verifyOtp(){

  try {

    const email =
      document.getElementById(
        "email"
      ).value;

    const otp =
      document.getElementById(
        "otp"
      ).value;

    const response =
      await fetch(

        `${API_BASE_URL}/auth/verify-otp`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            email,
            otp

          })

        }

      );

    const data =
      await response.json();

    showToast(
      data.message,
      response.ok ? "success" : "error"
    );



    if(response.ok){

      isOtpVerified = true;

    }

  } catch (error) {

    console.log(error);

  }

}



// ================= LOGIN =================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    
    // UI Loading state
    const submitBtn = loginForm.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Logging in...`;

    // Show Fullscreen Loader
    const loaderOverlay = document.getElementById("loginLoaderOverlay");
    if (loaderOverlay) loaderOverlay.classList.add("active");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // SAVE TOKEN
        localStorage.setItem("token", data.token);
        if (data.role === 'admin') {
          localStorage.setItem("adminToken", data.token);
        }

        showToast("Logged in successfully!", "success");
        document.getElementById("loginMessage").innerText = "";

        // REDIRECT
        setTimeout(() => {
          if (data.role === 'conductor') {
            window.location.href = "conductor.html";
          } else if (data.role === 'admin') {
            window.location.href = "admin.html";
          } else {
            window.location.href = "buses.html";
          }
        }, 1500);
      } else {
        if (loaderOverlay) loaderOverlay.classList.remove("active");
        showToast(data.message || "Invalid credentials.", "error");
        document.getElementById("loginMessage").innerText = data.message || "Login failed.";
        document.getElementById("loginMessage").style.color = "var(--danger)";
      }
    } catch (error) {
      if (loaderOverlay) loaderOverlay.classList.remove("active");
      console.error(error);
      showToast("Network error. Please check your connection.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}


// ================= LOAD BUSES =================

const busList = document.getElementById("busList");

if (busList) {
  async function loadBuses() {
    try {
      const response = await fetch(`${API_BASE_URL}/buses`);
      if (!response.ok) throw new Error("Failed to fetch buses");

      const buses = await response.json();
      
      // Add artificial delay so the beautiful loader animation can be seen
      await new Promise(resolve => setTimeout(resolve, 1200));

      busList.innerHTML = "";

      if (buses.length === 0) {
        busList.innerHTML = `<div class="empty-state"><i class="fas fa-bus"></i><p>No available buses found at this moment.</p></div>`;
        return;
      }

      function getDuration(dep, arr) {
        if(!dep || !arr) return "Est. --";
        try {
          const p = (s) => { const m = s.match(/(\d+):(\d+)/); return m ? parseInt(m[1])*60 + parseInt(m[2]) : 0; };
          let d = p(dep), a = p(arr);
          if (a < d) a += 24*60;
          const diff = a - d;
          if (diff <= 0) return "Est. --";
          const h = Math.floor(diff/60), m = diff%60;
          return h > 0 ? (m > 0 ? `Est. ${h}h ${m}m` : `Est. ${h}h`) : `Est. ${m}m`;
        } catch(e) { return "Est. --"; }
      }

      let cardsHtml = "";
      buses.forEach((bus, index) => {
        const dTime = bus.departureTime || '08:00';
        const aTime = bus.arrivalTime || '12:30';
        const durationText = getDuration(dTime, aTime);

        const photoHtml = bus.busPhoto
          ? `<div class="bus-card-img-wrap"><img class="bus-card-img" src="${window.getImageUrl(bus.busPhoto)}" onerror="this.parentElement.classList.add('no-img'); this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-bus\\'></i>';" alt="${bus.busName}"><div class="bus-img-overlay"></div></div>`
          : `<div class="bus-card-img-wrap no-img"><i class="fas fa-bus"></i></div>`;

        const stopsPreview = bus.stops && bus.stops.length
          ? `<div class="bus-stops-preview"><i class="fas fa-map-pin"></i> ${bus.stops.join(' &rarr; ')}</div>`
          : '';

        cardsHtml += `
          <div class="bus-card" style="animation-delay: ${index * 0.08}s">
            ${photoHtml}
            <div class="bus-card-content">
              <div class="bus-header">
                <div class="bus-name-wrap">
                  <h3>${bus.busName}</h3>
                  <span class="bus-type-badge">${bus.busName.toLowerCase().includes('sleeper') ? '<i class="fas fa-bed"></i> Luxury Sleeper' : (bus.busType === 'Express' ? '<i class="fas fa-bolt"></i> Express' : (bus.busType === 'Mediate' ? '<i class="fas fa-route"></i> Mediate' : '<i class="fas fa-bus"></i> Ordinary'))}</span>
                </div>
                <div class="bus-price">₹${bus.price}</div>
              </div>

              <div class="bus-route-visual">
                <div class="route-point from">
                  <div class="route-label">Departure</div>
                  <div class="route-name">${bus.from}</div>
                  <div class="route-time">${dTime}</div>
                </div>
                <div class="route-line-wrap">
                  <div class="route-duration" id="duration-${bus._id}">${durationText}</div>
                  <div class="route-line"></div>
                </div>
                <div class="route-point to">
                  <div class="route-label">Arrival</div>
                  <div class="route-name">${bus.to}</div>
                  <div class="route-time">${aTime}</div>
                </div>
              </div>

              ${stopsPreview}

              <div class="bus-footer" style="justify-content: flex-end;">
                <div>
                  <button class="book-now-btn" style="background:var(--success);" onclick="openTrackingModal('${bus._id}', '${bus.busName}')"><i class="fas fa-location-dot"></i> Track</button>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      busList.innerHTML = cardsHtml;
      
      // Global tracking for bus list cards
      if (typeof io !== 'undefined') {
        if (!window.globalBusSocket) {
          window.globalBusSocket = io(API_BASE_URL.replace('/api', ''));
          window.globalBusSocket.on('bus_location_update', (data) => {
            const durationEl = document.getElementById(`duration-${data.busId}`);
            if (durationEl && data.nextStop) {
               // The nextStop string is usually "NEXT STOP: Konaje (3m)" or "ARRIVED AT: Konaje"
               // We can extract just the ETA part or just show the whole string
               durationEl.textContent = data.nextStop.replace('NEXT STOP:', 'Next:').substring(0, 30);
               durationEl.style.color = 'var(--primary)';
               durationEl.style.fontWeight = 'bold';
               durationEl.style.background = 'rgba(99, 102, 241, 0.1)';
            }
          });
        }
        buses.forEach(b => window.globalBusSocket.emit('join_bus_room', b._id));
      }

    } catch (error) {
      console.error(error);
      busList.innerHTML = `<div class="empty-state" style="color:var(--danger);"><i class="fas fa-exclamation-triangle"></i><p>Failed to load routes. Is the backend server running?</p></div>`;
      showToast("Error loading buses from API.", "error");
    }
  }

  loadBuses();
}


// ================= BOOKING MODAL =================

let _currentBusId   = null;
let _currentBusData = null;
let _priceDebounce  = null;

async function openBookingModal(busId) {
  setPersistedState({ type: 'booking', busId });
  const token = localStorage.getItem('token');
  if (!token) {
    showToast("Please login first to book a ticket.", "warning");
    setTimeout(() => { window.location.href = "login.html"; }, 1500);
    return;
  }

  _currentBusId = busId;

  // Fetch bus details
  try {
    const res = await fetch(`${API_BASE_URL}/buses/${busId}`);
    const bus = await res.json();
    _currentBusData = bus;

    // Populate modal header
    const depTime = bus.departureTime || '08:00 AM';
    const arrTime = bus.arrivalTime || '12:30 PM';
    document.getElementById("bkBusName").textContent = bus.busName + " · " + depTime + " → " + arrTime;
    document.getElementById("bkFrom").textContent = bus.from;
    document.getElementById("bkTo").textContent   = bus.to;

    // Build full stop list: [from, ...stops, to]
    const allStops = [bus.from, ...(bus.stops || []), bus.to];

    // Populate boarding dropdown (all except last)
    const boardingSel = document.getElementById("bkBoarding");
    const droppingSel = document.getElementById("bkDropping");
    boardingSel.innerHTML = "";
    droppingSel.innerHTML = "";

    allStops.forEach((stop, i) => {
      if (i < allStops.length - 1) {
        boardingSel.innerHTML += `<option value="${stop}">${stop}</option>`;
      }
      if (i > 0) {
        droppingSel.innerHTML += `<option value="${stop}">${stop}</option>`;
      }
    });

    // Default: first → last
    boardingSel.value = allStops[0];
    droppingSel.value = allStops[allStops.length - 1];

    document.getElementById("bkWarning").style.display = "none";
    document.getElementById("bkConfirmBtn").disabled = false;

    document.getElementById("bookingModal").classList.add("open");
    updatePrice();
  } catch (e) {
    showToast("Failed to load bus details.", "error");
  }
}

function closeBookingModal() {
  clearPersistedState();
  document.getElementById("bookingModal").classList.remove("open");
  _currentBusId   = null;
  _currentBusData = null;
}

function closeTicketModal() {
  const modal = document.getElementById("ticketSuccessModal");
  if (modal) modal.classList.remove("open");
  location.reload(); // Reload after success modal is closed to refresh seats/wallet
}

// Click outside to close
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("bookingModal");
  if (overlay) overlay.addEventListener("click", e => { if (e.target === overlay) closeBookingModal(); });
  
  const ticketOverlay = document.getElementById("ticketSuccessModal");
  if (ticketOverlay) ticketOverlay.addEventListener("click", e => { if (e.target === ticketOverlay) closeTicketModal(); });
});

const API = ((window.location.protocol === "file:" ? "http://localhost:5000/api" : "/api") + "");
let currentUserId = localStorage.getItem("currentUserId") || "";

window.getImageUrl = function(path) {
  if (!path) return '';
  if (path.startsWith('data:')) return path;
  if (path.startsWith('http')) return path;
  let clean = path.replace(/\\/g, '/').trim();
  if (!clean.startsWith('/')) clean = '/' + clean;
  
  // Use API_BASE_URL but remove '/api' to get the server root for static files
  const baseUrl = API_BASE_URL.replace('/api', '');
  return baseUrl + clean;
};

async function updatePrice() {
  clearTimeout(_priceDebounce);
  _priceDebounce = setTimeout(async () => {
    const token = localStorage.getItem("token");
    if (!_currentBusId || !token) return;

    const boarding = document.getElementById("bkBoarding").value;
    const dropping = document.getElementById("bkDropping").value;
    const seats    = 1;

    // Validate boarding < dropping
    const allStops = [_currentBusData.from, ...(_currentBusData.stops || []), _currentBusData.to];
    const bIdx = allStops.indexOf(boarding);
    const dIdx = allStops.indexOf(dropping);

    const warnEl = document.getElementById("bkWarning");

    function getNormalizedStop(name) {
      return name.toLowerCase().replace(/[^a-z]/g, '').replace(/[aeiou]/g, '');
    }

    if (dIdx <= bIdx || getNormalizedStop(boarding) === getNormalizedStop(dropping)) {
      document.getElementById("bkWarningText").textContent = "Invalid route or stops appear to be the same.";
      warnEl.style.display = "block";
      document.getElementById("bkConfirmBtn").disabled = true;
      return;
    } else {
      warnEl.style.display = "none";
      document.getElementById("bkConfirmBtn").disabled = false;
    }

    try {
      const res  = await fetch(`${API_BASE_URL}/bookings/calculate-price/${_currentBusId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ seatsBooked: seats, boardingPoint: boarding, droppingPoint: dropping })
      });
      const data = await res.json();

      document.getElementById("bkAgeGroup").innerHTML     = `<i class="fas fa-user"></i> ${data.ageGroup || "Standard"}`;
      document.getElementById("bkPricePerSeat").textContent = `₹${data.pricePerSeat}`;
      document.getElementById("bkTotal").textContent        = `₹${data.totalPrice}`;
    } catch (e) {
      console.error(e);
    }
  }, 300);
}

async function confirmBooking() {
  const token = localStorage.getItem("token");
  if (!token || !_currentBusId) return;

  const boarding = document.getElementById("bkBoarding").value;
  const dropping = document.getElementById("bkDropping").value;
  const seats    = 1;

  function getNormalizedStop(name) {
    return name.toLowerCase().replace(/[^a-z]/g, '').replace(/[aeiou]/g, '');
  }

  const allStops = [_currentBusData.from, ...(_currentBusData.stops || []), _currentBusData.to];
  const bIdx = allStops.indexOf(boarding);
  const dIdx = allStops.indexOf(dropping);

  if (dIdx <= bIdx || getNormalizedStop(boarding) === getNormalizedStop(dropping)) {
    alert("Invalid route or stops appear to be the same.");
    return;
  }
  const payMethod = document.querySelector('input[name="payMethod"]:checked')?.value || 'razorpay';

  const btn = document.getElementById("bkConfirmBtn");
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;

  if (payMethod === 'razorpay') {
    // ── RAZORPAY FLOW ──
    try {
      // Step 1: Create Razorpay order
      const orderRes = await fetch(`${API_BASE_URL}/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ busId: _currentBusId, seatsBooked: seats, boardingPoint: boarding, droppingPoint: dropping })
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        showToast(orderData.message || "Failed to create order.", "error");
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-shield-halved"></i> Pay Securely`;
        return;
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amountPaise,
        currency: orderData.currency,
        name: "BusFlux",
        description: `${orderData.busName} - ${seats} seat(s)`,
        order_id: orderData.orderId,
        image: "https://img.icons8.com/fluency/96/bus.png",
        prefill: {
          name: orderData.userName || "BusFlux User",
          email: orderData.userEmail || "user@example.com",
          contact: (orderData.userPhone && orderData.userPhone.length >= 10) ? orderData.userPhone : "9999999999"
        },
        display: {
          blocks: {
            upi: {
              name: "Pay via Google Pay / PhonePe / UPI",
              instruments: [{ method: "upi" }]
            }
          },
          sequence: ["block.upi"],
          preferences: { show_default_blocks: true }
        },
        theme: {
          color: "#6366f1"
        },
        config: {
          display: {
            blocks: {
              upi: { name: "UPI", instruments: [{ method: "upi" }] },
              other: { name: "Other Payment Modes", instruments: [{ method: "card" }, { method: "netbanking" }, { method: "wallet" }] }
            },
            sequence: ["block.upi", "block.other"],
            preferences: { show_default_blocks: false }
          }
        },
        handler: async function(response) {
          // Step 3: Verify payment on backend
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                busId: _currentBusId,
                seatsBooked: seats,
                boardingPoint: boarding,
                droppingPoint: dropping
              })
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
              showToast(`✅ Payment successful! ₹${verifyData.totalPrice} paid via Razorpay. Ticket booked!`, "success");
              closeBookingModal();
              
              const tId = verifyData.booking ? verifyData.booking._id.toString().slice(-8).toUpperCase() : "";
              document.getElementById("ticketQR").src = verifyData.qrCode || "";
              document.getElementById("ticketIdDisplay").textContent = tId;
              document.getElementById("ticketRouteDisplay").textContent = `${boarding} → ${dropping}`;
              
              document.getElementById("ticketSuccessModal").classList.add("open");
            } else {
              showToast(verifyData.message || "Payment verification failed.", "error");
              btn.disabled = false;
              btn.innerHTML = `<i class="fas fa-shield-halved"></i> Pay Securely`;
            }
          } catch (e) {
            showToast("Verification error. Contact support.", "error");
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-shield-halved"></i> Pay Securely`;
          }
        },
        modal: {
          ondismiss: function() {
            showToast("Payment cancelled.", "warning");
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-shield-halved"></i> Pay Securely`;
          }
        }
      };

        try {
          const rzp = new Razorpay(options);
          rzp.on('payment.failed', function(response) {
            if (typeof showToast === "function") showToast(`Payment failed: ${response.error.description}`, "error");
            else alert(`Payment failed: ${response.error.description}`);
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-shield-halved"></i> Pay Securely`;
          });
          rzp.open();
        } catch (rzpErr) {
          console.error("Razorpay Error:", rzpErr);
          alert("Failed to open Razorpay checkout. Please check if your browser is blocking popups or scripts.");
          btn.disabled = false;
          btn.innerHTML = `<i class="fas fa-shield-halved"></i> Pay Securely`;
        }

      } catch (e) {
        console.error("Initiate Payment Error:", e);
        if (typeof showToast === "function") showToast("Network error creating payment.", "error");
        else alert("Network error creating payment.");
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-shield-halved"></i> Pay Securely`;
      }
  } else {
    // ── WALLET FLOW (existing) ──
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/book/${_currentBusId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ seatsBooked: seats, boardingPoint: boarding, droppingPoint: dropping })
      });
      const data = await res.json();

      if (res.ok) {
        showToast(`✅ Ticket booked! ₹${data.totalPrice} deducted from wallet. ${boarding} → ${dropping}`, "success");
        closeBookingModal();
        
        const tId = data.booking ? data.booking._id.toString().slice(-8).toUpperCase() : "";
        document.getElementById("ticketQR").src = data.qrCode || "";
        document.getElementById("ticketIdDisplay").textContent = tId;
        document.getElementById("ticketRouteDisplay").textContent = `${boarding} → ${dropping}`;
        
        document.getElementById("ticketSuccessModal").classList.add("open");
      } else {
        showToast(data.message || "Booking failed.", "error");
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-shield-halved"></i> Pay Securely`;
      }
    } catch (e) {
      showToast("Connection error.", "error");
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-shield-halved"></i> Pay Securely`;
    }
  }
}


// ================= LOAD BOOKINGS =================

const bookingList = document.getElementById("bookingList");

if (bookingList) {
  async function loadBookings() {
    const token = localStorage.getItem("token");

    // CHECK LOGIN
    if (!token) {
      showToast("Please register or login to view bookings.", "warning");
      setTimeout(() => {
        window.location.href = "register.html";
      }, 1500);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const bookings = await response.json();
      bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      bookingList.innerHTML = "";

      if (bookings.length === 0) {
        bookingList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-receipt" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
            <p>You have not booked any boarding passes yet.</p>
            <button onclick="window.location.href='buses.html'" style="width: auto; padding: 10px 20px; margin-top: 10px; cursor: pointer;"><i class="fas fa-search"></i> Search Buses</button>
          </div>
        `;
        return;
      }

      bookings.forEach(booking => {
        const busName        = booking.busId ? booking.busId.busName : "Bus Route";
        const fromLoc        = booking.boardingPoint || (booking.busId ? booking.busId.from : "N/A");
        const toLoc          = booking.droppingPoint || (booking.busId ? booking.busId.to   : "N/A");
        const fullFrom       = booking.busId ? booking.busId.from : "";
        const fullTo         = booking.busId ? booking.busId.to   : "";
        const ticketIdSuffix = booking._id ? booking._id.substring(booking._id.length - 8).toUpperCase() : "XXXX";
        const isPartial      = fromLoc !== fullFrom || toLoc !== fullTo;

        const isFailed = booking.status === "failed";
        const statusText = isFailed ? "Ride Declined (Insufficient Balance)" : "Confirmed";
        const statusClass = isFailed ? "ticket-status failed" : "ticket-status";
        const cardStyle = isFailed ? "border: 1.5px solid rgba(244,63,94,0.3); opacity: 0.95;" : "";
        const headerGradient = isFailed ? "background: linear-gradient(90deg, #7f1d1d 0%, #991b1b 100%);" : "background: linear-gradient(90deg, #1e1b4b 0%, #312e81 100%);";
        const footerHtml = isFailed ? `
            <div class="ticket-footer" style="display:flex; flex-direction:column; align-items:center; padding: 20px; background: rgba(244,63,94,0.05); border-top: 1px solid rgba(255,255,255,0.04);">
              <i class="fas fa-circle-xmark" style="color: #f43f5e; font-size: 2.2rem; margin-bottom: 8px;"></i>
              <div style="color: #f43f5e; font-weight: 700; font-size: 0.9rem;">Deduction Failed</div>
              <div style="font-size: 0.78rem; color: var(--text-muted); text-align: center; margin-top: 3px;">Insufficient wallet balance for this trip.</div>
            </div>
        ` : `
            <div class="ticket-footer" style="display:flex; flex-direction:column; align-items:center; padding: 20px;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketIdSuffix}&color=000000&bgcolor=ffffff" alt="Ticket QR Code" style="width: 120px; height: 120px; border: 6px solid #fff; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
              <div class="ticket-number" style="margin-bottom: 15px;">TICKET #${ticketIdSuffix}</div>
              <div style="display: flex; gap: 10px; width: 100%; justify-content: center;">
                <button onclick="downloadQR('${ticketIdSuffix}')" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s; flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;"><i class="fas fa-download"></i> Download QR</button>
                <button onclick="openTrackingModal('${booking.busId ? booking.busId._id : ''}', '${busName}', '${fromLoc}', '${toLoc}', true)" style="background: linear-gradient(135deg, #a855f7, #7e22ce); color: #fff; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s; flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;"><i class="fas fa-location-dot"></i> Track Live</button>
              </div>
            </div>
        `;

        bookingList.innerHTML += `
          <div class="booking-card" style="${cardStyle}">
            <div class="ticket-header" style="${headerGradient}">
              <span class="ticket-brand"><i class="fas fa-bus-alt"></i> BusFlux Boarding Pass</span>
              <span class="${statusClass}">${statusText}</span>
            </div>

            <div class="ticket-body">
              <div class="ticket-grid">
                <div class="ticket-info-item">
                  <span class="info-label">Bus Service</span>
                  <span class="info-value">${busName}</span>
                </div>
                <div class="ticket-info-item" style="text-align:right;">
                  <span class="info-label">Seats</span>
                  <span class="info-value">${booking.seatsBooked} seat(s)</span>
                </div>
              </div>

              <div class="ticket-divider">
                <div class="divider-notch left"></div>
                <div class="divider-line"></div>
                <div class="divider-notch right"></div>
              </div>

              <div class="ticket-grid">
                <div class="ticket-info-item">
                  <span class="info-label"><i class="fas fa-map-pin" style="color:#10b981;margin-right:3px"></i>Boarding</span>
                  <span class="info-value" style="color:#10b981;font-weight:700">${fromLoc}</span>
                </div>
                <div class="ticket-info-item" style="text-align:right;">
                  <span class="info-label"><i class="fas fa-location-dot" style="color:#f43f5e;margin-right:3px"></i>Dropping</span>
                  <span class="info-value" style="color:#f43f5e;font-weight:700">${toLoc}</span>
                </div>
              </div>

              ${isPartial ? `
              <div style="font-size:.74rem;color:#64748b;margin-top:8px;text-align:center;">
                <i class="fas fa-route" style="margin-right:4px"></i>Full route: ${fullFrom} → ${fullTo}
              </div>` : ''}

              <!-- Travel Times & Base Fare Row -->
              <div class="ticket-grid" style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.08);">
                <div class="ticket-info-item">
                  <span class="info-label"><i class="fas fa-clock" style="margin-right:4px;"></i>Departure</span>
                  <span class="info-value" style="font-size:0.88rem;">${booking.busId ? booking.busId.departureTime || '—' : '—'}</span>
                </div>
                <div class="ticket-info-item" style="text-align:right;">
                  <span class="info-label"><i class="fas fa-clock" style="margin-right:4px;"></i>Arrival</span>
                  <span class="info-value" style="font-size:0.88rem;">${booking.busId ? booking.busId.arrivalTime || '—' : '—'}</span>
                </div>
              </div>

              <!-- Price breakdown & deduction confirmation -->
              <div class="ticket-grid" style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.08);">
                <div class="ticket-info-item">
                  <span class="info-label">Base Bus Price</span>
                  <span class="info-value" style="font-size:0.88rem;">₹${booking.busId ? booking.busId.price || '—' : '—'}</span>
                </div>
                <div class="ticket-info-item" style="text-align:right;">
                  <span class="info-label">${isFailed ? 'Deduction Failed' : 'Wallet Deduction'}</span>
                  <span class="info-value" style="color:${isFailed ? '#f43f5e' : '#10b981'};font-weight:800;font-size:1rem;">₹${booking.totalPrice}</span>
                </div>
              </div>

              <!-- Processing Conductor or Online Info -->
              <div class="ticket-grid" style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.08);">
                ${booking.scannedBy ? `
                  <div class="ticket-info-item" style="grid-column: 1 / -1; text-align: left;">
                    <span class="info-label"><i class="fas fa-user-tie" style="margin-right:4px; color:#a855f7;"></i>Processed by Conductor</span>
                    <span class="info-value" style="font-size:0.82rem; font-weight:600;">${booking.scannedBy.name} (${booking.scannedBy.email})</span>
                    <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-top: 3px;">
                      <i class="fas fa-calendar-alt" style="margin-right:3px;"></i>${booking.scannedAt ? new Date(booking.scannedAt).toLocaleString('en-IN', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'}) : new Date(booking.createdAt).toLocaleString('en-IN', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                ` : `
                  <div class="ticket-info-item" style="grid-column: 1 / -1; text-align: left;">
                    <span class="info-label"><i class="fas fa-globe" style="margin-right:4px; color:#6366f1;"></i>Booking Channel</span>
                    <span class="info-value" style="font-size:0.82rem; font-weight:600;">Self-Booked Online</span>
                    <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-top: 3px;">
                      <i class="fas fa-calendar-alt" style="margin-right:3px;"></i>${new Date(booking.createdAt).toLocaleString('en-IN', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                `}
              </div>
            </div>

            ${footerHtml}
          </div>
        `;
      });

    } catch (error) {
      console.error(error);
      bookingList.innerHTML = `
        <div class="empty-state" style="color: var(--danger);">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Failed to load bookings. Please try again later.</p>
        </div>
      `;
      showToast("Error loading bookings from API.", "error");
    }
  }

  window.downloadQR = async function(ticketId) {
    try {
      // Using an open CORS endpoint to fetch the image as a Blob so we can trigger a download
      const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticketId}&color=000000&bgcolor=ffffff`);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BusFlux-Pass-${ticketId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Download failed", err);
      showToast("Failed to download QR code. Please try saving the image manually.", "error");
    }
  };

  loadBookings();
}


// ================= LOGOUT =================

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("adminToken");
  showToast("Logged out successfully.", "success");

  // Redirect after delay
  setTimeout(() => {
    window.location.href = "login.html";
  }, 1500);
}


// ================= CHECK BOOKING ACCESS =================

function checkBookingAccess() {
  const token = localStorage.getItem("token");

  if (!token) {
    showToast("Please register or login first to access bookings.", "warning");
    setTimeout(() => {
      window.location.href = "register.html";
    }, 1500);
  } else {
    window.location.href = "bookings.html";
  }
}


// ================= FORGOT PASSWORD =================

async function forgotPassword(){

  try {

    const email =
      document.getElementById(
        "forgotEmail"
      ).value;

    const response =
      await fetch(

        `${API_BASE_URL}/auth/forgot-password`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            email

          })

        }

      );

    const data =
      await response.json();

    showToast(
      data.message,
      response.ok ? "success" : "error"
    );

  } catch (error) {

    console.log(error);

  }

}



// RESET PASSWORD
async function resetPassword(){

  try {

    const email =
      document.getElementById(
        "forgotEmail"
      ).value;

    const otp =
      document.getElementById(
        "forgotOtp"
      ).value;

    const newPassword =
      document.getElementById(
        "newPassword"
      ).value;

    const response =
      await fetch(

        `${API_BASE_URL}/auth/reset-password`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            email,
            otp,
            newPassword

          })

        }

      );

    const data =
      await response.json();

    showToast(
      data.message,
      response.ok ? "success" : "error"
    );



    if(response.ok){

      setTimeout(() => {

        window.location.href =
          "login.html";

      }, 1500);

    }

  } catch (error) {

    console.log(error);

  }

}



// ================= WALLET MANAGEMENT =================
let userBonusPercent = 0.05; // default 5%
let activePassName = "Standard Pass";

async function loadWallet() {
  const token = localStorage.getItem("token");
  if (!token) {
    showToast("Please login to access the wallet dashboard.", "warning");
    setTimeout(() => { window.location.href = "login.html"; }, 1500);
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return;
      }
      throw new Error("Failed to fetch wallet info");
    }

    const user = await res.json();
    
    // UI elements to update:
    document.getElementById("walletBalance").textContent = `₹${user.balance || 0}`;
    document.getElementById("profileName").textContent = user.name || "Customer";
    document.getElementById("profileEmail").textContent = user.email || "";
    document.getElementById("profileAgeGroup").textContent = user.ageGroup || "Standard";

    // Compute pass based on age
    const age = user.age;
    if ((age >= 5 && age <= 14) || age >= 60) {
      userBonusPercent = 0.30;
      activePassName = "Golden Pass";
    } else if (age >= 15 && age <= 24) {
      userBonusPercent = 0.20;
      activePassName = "Youth Express Pass";
    } else {
      userBonusPercent = 0.05;
      activePassName = "Standard Pass";
    }

    const activePassEl = document.getElementById("activePass");
    if (activePassEl) {
      activePassEl.textContent = activePassName;
    }
    
    const passBadge = document.getElementById("activePassBadge");
    if (passBadge) {
      passBadge.className = `pass-badge ${activePassName.toLowerCase().replace(/ /g, "-")}`;
      passBadge.innerHTML = `<i class="fas fa-id-card"></i> ${activePassName}`;
    }
    
    const bonusRate = document.getElementById("passBonusRate");
    if (bonusRate) {
      bonusRate.textContent = `+${userBonusPercent * 100}% Bonus Wallet Balance`;
    }

    updateRechargePreview();
  } catch (error) {
    console.error(error);
    showToast("Failed to load wallet dashboard.", "error");
  }
}

function selectQuickRecharge(amount) {
  const input = document.getElementById("rechargeAmount");
  if (input) input.value = amount;
  
  // Highlight quick buttons
  const buttons = document.querySelectorAll(".quick-amount-btn");
  buttons.forEach(btn => {
    if (parseInt(btn.getAttribute("data-val")) === amount) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  updateRechargePreview();
}

function handleAmountInput() {
  // Clear button highlights if custom amount input is altered
  const input = document.getElementById("rechargeAmount");
  if (!input) return;
  const val = parseInt(input.value);
  const buttons = document.querySelectorAll(".quick-amount-btn");
  buttons.forEach(btn => {
    if (parseInt(btn.getAttribute("data-val")) === val) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  updateRechargePreview();
}

function updateRechargePreview() {
  const amountInput = document.getElementById("rechargeAmount");
  if (!amountInput) return;

  const rawVal = amountInput.value;
  const val = parseFloat(rawVal) || 0;

  if (val <= 0) {
    document.getElementById("previewPay").textContent = "₹0";
    document.getElementById("previewBonus").textContent = "₹0";
    document.getElementById("previewGet").textContent = "₹0";
    return;
  }

  const bonus = Math.round(val * userBonusPercent);
  const total = Math.round(val + bonus);

  document.getElementById("previewPay").textContent = `₹${val}`;
  document.getElementById("previewBonus").textContent = `+₹${bonus} (${userBonusPercent * 100}%)`;
  document.getElementById("previewGet").textContent = `₹${total}`;
}

async function rechargeWallet(e) {
  if (e) e.preventDefault();
  
  const token = localStorage.getItem("token");
  if (!token) return;

  const amountInput = document.getElementById("rechargeAmount");
  if (!amountInput) return;
  const amount = parseFloat(amountInput.value);

  if (isNaN(amount) || amount <= 0) {
    showToast("Please enter a valid amount to recharge.", "warning");
    return;
  }

  const btn = document.getElementById("rechargeBtn");
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Initializing Secure Gateway...`;

  try {
    // 1. Create Order on Backend
    const orderRes = await fetch(`${API_BASE_URL}/auth/wallet/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    });
    
    if (!orderRes.ok) {
      throw new Error("Failed to create order");
    }
    
    const orderData = await orderRes.json();

    // 2. Open Razorpay Checkout
    const options = {
      key: "rzp_test_SwpXpk7KNwdCU7", // Replace with your actual key if needed
      amount: orderData.amount,
      currency: "INR",
      name: "BusFlux Wallet",
      description: "Wallet Recharge",
      image: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",
      order_id: orderData.id,
      config: {
        display: {
          blocks: {
            upi: {
              name: "Pay via Google Pay / UPI",
              instruments: [
                {
                  method: "upi"
                }
              ]
            }
          },
          sequence: ["block.upi"],
          preferences: {
            show_default_blocks: true
          }
        }
      },
      handler: async function (response) {
        try {
          // 3. Verify Payment on Backend
          showToast("Verifying payment...", "info");
          const verifyRes = await fetch(`${API_BASE_URL}/auth/wallet/verify-payment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount,
              method: "Razorpay"
            })
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            showToast(`Payment Successful! 🎉 Earned ₹${verifyData.bonus} bonus.`, "success");
            amountInput.value = "";
            document.querySelectorAll(".quick-amount-btn").forEach(b => b.classList.remove("active"));
            await loadWallet();
          } else {
            showToast(verifyData.message || "Payment verification failed.", "error");
          }
        } catch (err) {
          showToast("Error verifying payment on server.", "error");
        }
      },
      prefill: {
        name: orderData.userName || "BusFlux User",
        email: orderData.userEmail || "user@example.com",
        contact: (orderData.userPhone && orderData.userPhone.length >= 10) ? orderData.userPhone : "9999999999"
      },
      theme: {
        color: "#6366f1"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response){
      showToast("Payment Failed or Cancelled.", "error");
    });
    rzp.open();
    
  } catch (err) {
    console.error(err);
    showToast("Error connecting to payment gateway.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-wallet"></i> Recharge Wallet Now`;
  }
}

// ================= THEME TOGGLE =================
window.initTheme = function() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
};

window.toggleTheme = function() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
};

window.updateThemeIcon = function(theme) {
  const icons = document.querySelectorAll('.theme-icon');
  icons.forEach(icon => {
    if (theme === 'light') {
      icon.className = 'fas fa-sun theme-icon';
      icon.style.color = '#f59e0b';
    } else {
      icon.className = 'fas fa-moon theme-icon';
      icon.style.color = '#6366f1';
    }
  });
};

document.addEventListener("DOMContentLoaded", window.initTheme);

// ================= WEBSOCKET REAL-TIME SUPPORT =================
let userSocket = null;

window.initUserWebSocket = function(userId) {
  if (!userId) return;
  if (userSocket) return; // Prevent multiple connections
  
  if (typeof io === 'undefined') {
    const script = document.createElement('script');
    script.src = "https://cdn.socket.io/4.7.4/socket.io.min.js";
    script.onload = () => setupUserSocket(userId);
    document.head.appendChild(script);
  } else {
    setupUserSocket(userId);
  }
};

function setupUserSocket(userId) {
  try {
    const serverUrl = API_BASE_URL.replace('/api', '');
    userSocket = io(serverUrl);
    
    userSocket.on('connect', () => {
      userSocket.emit('join_room', userId);
      console.log("Passenger WebSocket connected and joined room:", userId);
    });
    
    userSocket.on('new_notification', (notif) => {
      showToast(notif.message, notif.type || "info");
      if (typeof fetchUserNotifications === 'function') {
        fetchUserNotifications();
      }
    });

    userSocket.on('user_data_updated', () => {
      // Reload wallet balance in navbar
      const token = localStorage.getItem("token");
      if (token) {
        fetch(`${API_BASE_URL}/auth/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => {
          if (res.ok) return res.json();
        })
        .then(user => {
          if (user) {
            const balSpan = document.getElementById("navWalletBalance");
            if (balSpan) {
              balSpan.textContent = `₹${user.balance || 0}`;
            }
          }
        }).catch(err => console.error("Error updating WebSocket balance:", err));
      }
      
      // Reload wallet.html balance display if loadWalletBalance function exists
      if (typeof loadWalletBalance === 'function') {
        loadWalletBalance();
      }
      
      // Reload user bookings table if loadBookings exists
      if (typeof loadBookings === 'function') {
        loadBookings();
      }
    });
  } catch(e) {
    console.error("Socket setup failed:", e);
  }
}

// ================= OFFERS MODAL =================
window.showOffersToast = function() {
  const existingModal = document.getElementById('offersModal');
  if (existingModal) existingModal.remove();

  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f8fafc' : '#1e293b';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';

  const modalHtml = `
    <div id="offersModal" style="display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:99999; align-items:center; justify-content:center; backdrop-filter:blur(5px); opacity: 0; transition: opacity 0.3s ease;">
      <div style="background:${cardBg}; border-radius:16px; width:90%; max-width:450px; padding:30px; box-shadow:0 20px 40px rgba(0,0,0,0.3); transform: translateY(30px); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); position:relative;">
        <button onclick="closeOffersModal()" style="position:absolute; top:20px; right:20px; background:transparent; border:none; color:${mutedColor}; font-size:1.4rem; cursor:pointer; transition: color 0.2s;"><i class="fas fa-times"></i></button>
        
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="display:inline-flex; align-items:center; justify-content:center; width:60px; height:60px; border-radius:50%; background:linear-gradient(135deg, #8b5cf6, #ec4899); color:#fff; font-size:1.8rem; margin-bottom:15px; box-shadow:0 10px 20px rgba(236, 72, 153, 0.3);">
            <i class="fas fa-gift"></i>
          </div>
          <h2 style="font-size:1.6rem; font-weight:800; margin:0 0 5px 0; color:${textColor};">Exclusive Offers</h2>
          <p style="color:${mutedColor}; font-size:0.95rem; margin:0;">Grab these amazing deals on your next ride.</p>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:16px;">
          <!-- Offer 2 (Now the only offer) -->
          <div onclick="window.location.href='wallet.html'" style="cursor:pointer; background:${isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5'}; border:1px dashed #10b981; border-radius:12px; padding:16px; display:flex; align-items:center; gap:15px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
            <div style="background:#10b981; color:#fff; width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.4rem; flex-shrink:0;">
              <i class="fas fa-gift"></i>
            </div>
            <div style="flex:1;">
              <h4 style="color:${isDark ? '#34d399' : '#059669'}; margin:0 0 4px 0; font-weight:700; font-size:1.05rem;">Special Offer</h4>
              <p style="color:${isDark ? '#6ee7b7' : '#059669'}; margin:0; font-size:0.85rem; line-height:1.4;">Get 10% Extra Bonus on all Wallet Recharges!</p>
            </div>
          </div>
        </div>

        <button onclick="closeOffersModal()" style="width:100%; margin-top:25px; padding:14px; background:linear-gradient(135deg, #6366f1, #8b5cf6); color:#fff; border:none; border-radius:10px; font-weight:700; font-size:1.05rem; cursor:pointer; box-shadow:0 6px 15px rgba(99, 102, 241, 0.3); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(99, 102, 241, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 15px rgba(99, 102, 241, 0.3)';">Awesome, let's ride!</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Animate in
  setTimeout(() => {
    const modal = document.getElementById("offersModal");
    if (modal) {
      modal.style.opacity = "1";
      modal.children[0].style.transform = "translateY(0)";
    }
  }, 10);
};

window.closeOffersModal = function() {
  const modal = document.getElementById("offersModal");
  if (modal) {
    modal.style.opacity = "0";
    modal.children[0].style.transform = "translateY(30px)";
    setTimeout(() => modal.remove(), 300);
  }
};
// State Management for Page Refreshes
function setPersistedState(state) {
  sessionStorage.setItem('busfluxAppState', JSON.stringify(state));
}
function clearPersistedState() {
  sessionStorage.removeItem('busfluxAppState');
}

// Wait for DOM to load map
document.addEventListener('DOMContentLoaded', () => {
  // We can't initialize the map until the modal is opened, so we do it in openTrackingModal
  
  // Restore previous state if user refreshed the page
  const stateStr = sessionStorage.getItem('busfluxAppState');
  if (stateStr) {
    try {
      const state = JSON.parse(stateStr);
      if (state.type === 'tracking') {
        // slight delay to let other DOM setup finish
        setTimeout(() => openTrackingModal(state.busId, state.busName, state.userBoardingStop, state.userDroppingStop, state.isLocked), 300);
      } else if (state.type === 'booking') {
        setTimeout(() => openBookingModal(state.busId), 300);
      }
    } catch(e) {
      console.error('Failed to restore state', e);
    }
  }
});

// ================= LIVE TRACKING MODAL =================
let trackingMap = null;
let busMarker = null;
let trackingSocket = null;
let isFollowing = true;
let nextStopCoords = null;
let lastNextStopName = null;
let nextStopETAString = "";

async function openTrackingModal(busId, busName, userBoardingStop, userDroppingStop, isLocked = false) {
  const token = localStorage.getItem("token");
  if (!token) {
    showToast("Please login first to track a bus.", "warning");
    return;
  }

  setPersistedState({ type: 'tracking', busId, busName, userBoardingStop, userDroppingStop, isLocked });
  document.getElementById("trackingModal").classList.add("open");
  document.getElementById("trackBusName").textContent = busName || "Live Bus Tracking";
  

  
  if (!trackingMap) {
    trackingMap = L.map('trackingMap').setView([12.9141, 74.8560], 12); // Default Mangalore
    
    const normalLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    });

    const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    });

    normalLayer.addTo(trackingMap);

    const baseMaps = {
      "Normal": normalLayer,
      "Satellite": satelliteLayer
    };

    L.control.layers(baseMaps, null, { position: 'topleft' }).addTo(trackingMap);

    // Fullscreen Toggle Control (Previous Method)
    var FullScreenControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.innerHTML = `<a href="#" title="Toggle Full Screen" style="font-size: 16px; font-weight: bold; color: #333; text-decoration: none; text-align: center; line-height: 30px; display: block; background: #fff; width: 40px; height: 30px;"><i class="fas fa-expand"></i></a>`;
        container.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          var trackingModal = document.getElementById('trackingModal');
          trackingModal.classList.toggle('full-screen');
          
          setTimeout(() => trackingMap.invalidateSize(), 300);
        };
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        return container;
      }
    });
    trackingMap.addControl(new FullScreenControl());

    // Follow Bus Toggle Control
    var FollowControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.innerHTML = `<a href="#" id="followBtn" title="Follow Bus" style="font-size: 16px; color: #10b981; text-decoration: none; text-align: center; line-height: 30px; display: block; background: #fff; width: 40px; height: 30px;"><i class="fas fa-location-arrow"></i></a>`;
        container.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          isFollowing = !isFollowing;
          const btn = document.getElementById('followBtn');
          if (isFollowing) {
            btn.style.color = '#10b981'; // Green when following
            if (busMarker) trackingMap.setView(busMarker.getLatLng(), trackingMap.getZoom());
          } else {
            btn.style.color = '#64748b'; // Gray when not following
          }
        };
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        return container;
      }
    });
    trackingMap.addControl(new FollowControl());



  }
  
  // Need to invalidateSize since it was hidden
  setTimeout(() => {
    trackingMap.invalidateSize();
  }, 300);
  
  if (busMarker) {
    trackingMap.removeLayer(busMarker);
    busMarker = null;
  }
  
  document.getElementById("marqueeContainer").style.display = "none";
  document.getElementById("marqueeText").textContent = "NEXT STOP: ---";
  
  // Init Socket
  if (!trackingSocket) {
    trackingSocket = io(API_BASE_URL.replace('/api', ''));
  }
  
  trackingSocket.emit('join_bus_room', busId);
  
  // Clear any existing stop markers from a previous tracked bus
  if (trackingMap.stopMarkers && trackingMap.stopMarkers.length > 0) {
      trackingMap.stopMarkers.forEach(marker => trackingMap.removeLayer(marker));
  }
  
  // Fetch bus to populate personal ETA dropdowns
  fetch(`${API_BASE_URL}/buses`)
    .then(res => res.json())
    .then(buses => {
       const bus = buses.find(b => b._id === busId);
       if (bus) {
           let allStops = [bus.from, ...(bus.stops || []), bus.to];
           const bSelect = document.getElementById("myBoardingStop");
           const dSelect = document.getElementById("myDropoffStop");
           if (bSelect && dSelect) {
               const opts = `<option value="">-- Select --</option>` + allStops.map(s => {
                   let name = s.replace(/^NEXT STOP:\s*/i, "").trim();
                   return `<option value="${name}">${name}</option>`;
               }).join("");
               bSelect.innerHTML = opts;
               dSelect.innerHTML = opts;

               // Pre-select and lock if provided
               if (userBoardingStop) {
                   const match = Array.from(bSelect.options).find(opt => opt.value.toLowerCase() === userBoardingStop.toLowerCase());
                   if (match) bSelect.value = match.value;
               }
               if (userDroppingStop) {
                   const match = Array.from(dSelect.options).find(opt => opt.value.toLowerCase() === userDroppingStop.toLowerCase());
                   if (match) dSelect.value = match.value;
               }

               if (isLocked) {
                   bSelect.disabled = true;
                   dSelect.disabled = true;
                   bSelect.style.backgroundColor = 'rgba(255,255,255,0.05)';
                   dSelect.style.backgroundColor = 'rgba(255,255,255,0.05)';
                   bSelect.style.cursor = 'not-allowed';
                   dSelect.style.cursor = 'not-allowed';
               } else {
                   bSelect.disabled = false;
                   dSelect.disabled = false;
                   bSelect.style.backgroundColor = '';
                   dSelect.style.backgroundColor = '';
                   bSelect.style.cursor = '';
                   dSelect.style.cursor = '';
               }
           }
       }
    }).catch(err => console.error("Failed to fetch bus for ETA dropdowns:", err));

  // Init tracking data object
  window._currentTrackingData = {
    routeCoords: null,
    currentLat: null,
    currentLng: null,
    effectiveSpeed: 35,
    stopCoordinates: {
        "thaudugoli": [74.8967, 12.8021],
        "montepadavu": [74.9264, 12.7949],
        "kallukatta": [74.9019, 12.7924],
        "konaje": [74.9021, 12.8162],
        "mangalore university": [74.9244, 12.8160],
        "belaringe": [74.8900, 12.7850],
        "meempri": [74.8950, 12.7900],
        "natekal": [74.9037, 12.8020],
        "kannachur": [74.8989, 12.8051],
        "k.s. hegde hospital": [74.8906, 12.8094],
        "deralakatte": [74.8940, 12.8088],
        "kuthar": [74.8760, 12.8195],
        "kuthar junction": [74.8760, 12.8195],
        "babbukatte": [74.8659, 12.8185],
        "thokkottu": [74.860673, 12.818348],
        "mugeru": [74.867158, 12.859398],
        "nagori": [74.8745, 12.8700],
        "pumpwell": [74.8640, 12.8688],
        "kankanady": [74.8600, 12.8646],
        "balmatta": [74.8470, 12.8711],
        "jyothi": [74.8491, 12.8711],
        "jyothi circle": [74.8491, 12.8711],
        "hampankatta": [74.8434, 12.8691],
        "state bank": [74.8365, 12.8627],
        "mangalore": [74.8365, 12.8627]
    }
  };

  window.updatePersonalETA = function() {
      const boarding = document.getElementById("myBoardingStop")?.value;
      const dropoff = document.getElementById("myDropoffStop")?.value;
      const etaDisplay = document.getElementById("personalEtaDisplay");
      
      if (!etaDisplay || !window._currentTrackingData.routeCoords || !boarding) {
          if(etaDisplay) etaDisplay.style.display = 'none';
          return;
      }
      
      const d = window._currentTrackingData;
      const route = d.routeCoords; // Array of [lon, lat]
      
      const getClosestIdx = (lon, lat) => {
          let minDist = Infinity;
          let idx = 0;
          for(let i=0; i<route.length; i++) {
              const dist = (route[i][0]-lon)**2 + (route[i][1]-lat)**2;
              if(dist < minDist) { minDist = dist; idx = i; }
          }
          return idx;
      };
      
      const getDistBetween = (idx1, idx2) => {
          if (idx1 >= idx2) return 0;
          let dist = 0;
          for(let i=idx1; i<idx2; i++) {
              dist += getDistanceFromLatLonInKm(route[i][1], route[i][0], route[i+1][1], route[i+1][0]);
          }
          return dist;
      };
      
      const bCoord = d.stopCoordinates[boarding.toLowerCase()];
      const dpCoord = dropoff ? d.stopCoordinates[dropoff.toLowerCase()] : null;
      
      if (!bCoord) return;
      
      const busIdx = getClosestIdx(d.currentLng, d.currentLat);
      const boardingIdx = getClosestIdx(bCoord[0], bCoord[1]);
      
      let text = "";
      if (busIdx >= boardingIdx - 2) { 
          text = `Boarding: Passed`;
      } else {
          const distToBoarding = getDistBetween(busIdx, boardingIdx);
          const etaB = Math.max(1, Math.round((distToBoarding / d.effectiveSpeed) * 60));
          text = `Boarding ETA: ${etaB} min`;
      }
      
      if (dpCoord) {
          const dropIdx = getClosestIdx(dpCoord[0], dpCoord[1]);
          if (busIdx >= dropIdx - 2) {
              text += ` | Drop: Passed`;
          } else {
              const distToDrop = getDistBetween(busIdx, dropIdx);
              const etaD = Math.max(1, Math.round((distToDrop / d.effectiveSpeed) * 60));
              text += ` | Drop ETA: ${etaD} min`;
          }
      }
      
      etaDisplay.style.display = 'block';
      etaDisplay.textContent = text;
  };

  // Removed red dot logic per user request

  let routeLine = null;
  let lastLat = null;
  let lastLng = null;
  let lastTime = null;
  let trackingRouteCoords = null;
  let speedBuffer = [];
  
  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; // Distance in km
  }

  trackingSocket.off('bus_location_update'); // Prevent multiple listeners
  trackingSocket.on('bus_location_update', (data) => {
    if (data.busId === busId) {
      
      // Draw the route line if the conductor emits the OSRM route
      if (data.routeCoordinates) {
        trackingRouteCoords = data.routeCoordinates;
      }

      if (data.lat && data.lng) {
        if (!busMarker) {
          const busIcon = L.divIcon({
            html: '<i class="fas fa-bus" style="color:#10b981; font-size:24px; filter: drop-shadow(0 0 8px rgba(16,185,129,0.8)); background: #0d1326; border-radius: 50%; padding: 4px; border: 2px solid #10b981;"></i>',
            className: 'custom-bus-icon',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });
          busMarker = L.marker([data.lat, data.lng], {icon: busIcon}).addTo(trackingMap);
          if (!routeLine || isFollowing) trackingMap.setView([data.lat, data.lng], 15);
        } else {
          busMarker.setLatLng([data.lat, data.lng]);
          if (isFollowing) {
             trackingMap.setView([data.lat, data.lng], trackingMap.getZoom());
          }
        }
        
        // Show Dashboard
        document.getElementById('trackingDashboard').style.display = 'flex';
        
        // Metrics Calculation
        const now = Date.now();
        let currentSpeed = 0;
        
        if (lastLat !== null && lastTime !== null) {
          const timeDiffHrs = (now - lastTime) / (1000 * 60 * 60);
          if (timeDiffHrs > 0 && timeDiffHrs < 1) { // Ignore huge gaps
             const d = getDistanceFromLatLonInKm(lastLat, lastLng, data.lat, data.lng);
             let instSpeed = d / timeDiffHrs;
             
             // The simulation moves too fast, resulting in unrealistic 100+ km/h speeds.
             // We normalize the speed to realistic bus values (30-65 km/h) based on the distance tick.
             if (instSpeed > 65) {
                instSpeed = 40 + (d * 1000) % 20; 
             }
             if (instSpeed > 75) instSpeed = 75; // Hard cap just in case
             
             speedBuffer.push(instSpeed);
             if (speedBuffer.length > 4) speedBuffer.shift();
             
             currentSpeed = speedBuffer.reduce((a, b) => a + b, 0) / speedBuffer.length;
          }
        }
        
        lastLat = data.lat;
        lastLng = data.lng;
        lastTime = now;
        
        // Update Speedometer UI
        document.getElementById("dashSpeed").textContent = currentSpeed.toFixed(1);
        const speedRatio = Math.min(currentSpeed / 120, 1);
        document.getElementById("speedGaugeFill").style.strokeDashoffset = 125.6 * (1 - speedRatio);
        const needleRot = -90 + (speedRatio * 180);
        document.getElementById("speedNeedle").style.transform = `translateX(-50%) rotate(${needleRot}deg)`;
        
        // Calculate Remaining Distance
        let remainingDist = 0;
        if (trackingRouteCoords && trackingRouteCoords.length > 0) {
            let minDist = Infinity;
            let closestIdx = 0;
            for (let i = 0; i < trackingRouteCoords.length; i++) {
                const c = trackingRouteCoords[i];
                const distSq = (c[1] - data.lat)**2 + (c[0] - data.lng)**2;
                if (distSq < minDist) {
                    minDist = distSq;
                    closestIdx = i;
                }
            }
            for (let i = closestIdx; i < trackingRouteCoords.length - 1; i++) {
                const c1 = trackingRouteCoords[i];
                const c2 = trackingRouteCoords[i+1];
                remainingDist += getDistanceFromLatLonInKm(c1[1], c1[0], c2[1], c2[0]);
            }
            
            // Draw only the remaining route so it doesn't show the past path
            const remainingCoords = trackingRouteCoords.slice(closestIdx);
            const latLngs = remainingCoords.map(coord => [coord[1], coord[0]]);
            if (!routeLine && latLngs.length > 0) {
                routeLine = L.polyline(latLngs, {color: '#3b82f6', weight: 6, opacity: 0.8}).addTo(trackingMap);
                trackingMap.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
            } else if (routeLine && latLngs.length > 0) {
                routeLine.setLatLngs(latLngs);
            }
        }
        
        document.getElementById("dashDistance").textContent = remainingDist > 0 ? remainingDist.toFixed(1) + " km" : "0.0 km";
        
        // Update ETA
        let effectiveSpeedForETA = 35; // Default average city speed (km/h)
        if (currentSpeed > 5) {
            // Blend current speed with average for a stable and realistic ETA
            effectiveSpeedForETA = (currentSpeed * 0.4) + (35 * 0.6); 
        }
        
        
          window._currentTrackingData.routeCoords = trackingRouteCoords;
          window._currentTrackingData.currentLat = data.lat;
          window._currentTrackingData.currentLng = data.lng;
          window._currentTrackingData.effectiveSpeed = effectiveSpeedForETA;
          if (window.updatePersonalETA) window.updatePersonalETA();

          if (remainingDist > 0.1) {

            const etaHrs = remainingDist / effectiveSpeedForETA;
            const etaMins = Math.max(1, Math.round(etaHrs * 60));
            document.getElementById("dashETA").textContent = etaMins + " min";
        } else if (remainingDist <= 0.1) {
            document.getElementById("dashETA").textContent = "Arrived";
        } else {
            document.getElementById("dashETA").textContent = "--";
        }
        
        // Last Update Time
        const updateDate = new Date();
        const dateString = updateDate.toLocaleDateString('en-GB').replace(/\//g, '-');
        const timeString = updateDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        document.getElementById("dashLastUpdate").textContent = `Last update time ${dateString} ${timeString}`;
      }
      
      if (data.nextStop) {
        document.getElementById("marqueeContainer").style.display = "flex";
        const marqueeEl = document.getElementById("marqueeText");
        
        if (data.nextStop.toUpperCase().startsWith("ARRIVED") || data.nextStop.toUpperCase().startsWith("STOPPED")) {
          marqueeEl.textContent = data.nextStop.toUpperCase();
          marqueeEl.style.color = "#10b981"; // green for arrived
          
          nextStopCoords = null;
          lastNextStopName = data.nextStop;
          nextStopETAString = "";
          
          // Force Speed to 0 when arrived
          speedBuffer = [0, 0, 0, 0, 0];
          const dashSpeed = document.getElementById("dashSpeed");
          if (dashSpeed) dashSpeed.textContent = "0.0";
          const speedGaugeFill = document.getElementById("speedGaugeFill");
          if (speedGaugeFill) speedGaugeFill.style.strokeDashoffset = 125.6;
          const speedNeedle = document.getElementById("speedNeedle");
          if (speedNeedle) speedNeedle.style.transform = `translateX(-50%) rotate(-90deg)`;
          
        } else {
          // If the stop name changed, fetch new coordinates
          if (data.nextStop !== lastNextStopName) {
            lastNextStopName = data.nextStop;
            nextStopCoords = null;
            nextStopETAString = "";
            
            // Only try to geocode if it's a normal stop name (ignoring simple 'NEXT STOP:' if passed)
            let queryStr = data.nextStop.replace(/^NEXT STOP:\s*/i, "").trim();
            
            fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr + ", Mangalore")}&format=json&limit=1`)
              .then(res => res.json())
              .then(results => {
                 if (results && results.length > 0) {
                     nextStopCoords = {
                         lat: parseFloat(results[0].lat),
                         lng: parseFloat(results[0].lon)
                     };
                 }
              })
              .catch(err => console.error("Geocoding failed:", err));
          }
          
          // Calculate ETA if we have coords, valid speed, and bus location
          if (nextStopCoords && data.lat && data.lng) {
             const distToStop = getDistanceFromLatLonInKm(data.lat, data.lng, nextStopCoords.lat, nextStopCoords.lng);
             
             let speedToUse = typeof currentSpeed !== 'undefined' ? currentSpeed : 0;
             let effectiveSpeedForETA = 35; // Default average city speed
             if (speedToUse > 5) {
                 effectiveSpeedForETA = (speedToUse * 0.4) + (35 * 0.6);
             }
             
             if (distToStop > 0.1) {
                 const etaHrs = distToStop / effectiveSpeedForETA;
                 const etaMins = Math.max(1, Math.round(etaHrs * 60));
                 nextStopETAString = ` (ETA: ${etaMins} min)`;
             } else if (distToStop <= 0.1) {
                 nextStopETAString = ` (ARRIVING)`;
             } else {
                 nextStopETAString = "";
             }
          }
          
          marqueeEl.textContent = data.nextStop.toUpperCase() + nextStopETAString;
          marqueeEl.style.color = "#ef4444"; // red for moving
        }
      }
    }
  });
}

function closeTrackingModal() {
  clearPersistedState();
  const modal = document.getElementById("trackingModal");
  modal.classList.remove("open");
  modal.classList.remove("full-screen");
  if (trackingSocket) {
    trackingSocket.disconnect();
    trackingSocket = null;
  }
}

// ================= STATS FETCHING =================
function fetchStats() {
  const statsSection = document.getElementById('statsSection');
  if (!statsSection) return; // Only run on homepage where stats exist

  fetch(`${API_BASE_URL}/stats`)
    .then(res => res.json())
    .then(data => {
      const usersEl = document.getElementById('stat-users');
      const busesEl = document.getElementById('stat-buses');
      const routesEl = document.getElementById('stat-routes');
      
      if (usersEl) usersEl.textContent = data.usersCount > 0 ? data.usersCount + '+' : '0';
      if (busesEl) busesEl.textContent = data.busesCount > 0 ? data.busesCount : '0';
      if (routesEl) routesEl.textContent = data.routesCount > 0 ? data.routesCount : '0';
    })
    .catch(err => console.error('Failed to fetch stats:', err));
}

// Call on load
document.addEventListener('DOMContentLoaded', () => {
  fetchStats();
  fetchReviews();
});

// ================= REVIEWS LOGIC =================
function fetchReviews() {
  const reviewsContainer = document.getElementById('reviewsContainer');
  if (!reviewsContainer) return;

  fetch(`${API_BASE_URL}/reviews`)
    .then(res => res.json())
    .then(reviews => {
      if (!reviews || reviews.length === 0) return; // Keep placeholders if empty
      
      reviewsContainer.innerHTML = '';
      reviews.forEach(review => {
        const dateStr = new Date(review.createdAt).toLocaleDateString();
        const initial = review.user && review.user.name ? review.user.name.charAt(0).toUpperCase() : 'U';
        const fullName = review.user && review.user.name ? review.user.name : 'Anonymous User';
        
        let photoUrl = '';
        if (review.user && review.user.userPhoto) {
          const raw = review.user.userPhoto;
          if (raw.startsWith('data:') || raw.startsWith('http')) {
            photoUrl = raw;
          } else {
            let clean = raw.replace(/\\/g, '/');
            if (!clean.startsWith('/')) clean = '/' + clean;
            photoUrl = API_BASE_URL.replace('/api', '') + clean;
          }
        }
        
        const avatarHtml = photoUrl ? `<img src="${photoUrl}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : initial;
        
        // Generate stars HTML
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
          if (i <= review.rating) {
            starsHtml += '<i class="fas fa-star"></i>';
          } else {
            starsHtml += '<i class="far fa-star"></i>';
          }
        }

        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
          <div class="review-header">
            <div class="review-avatar">${avatarHtml}</div>
            <div>
              <div class="review-name">${fullName}</div>
              <div class="review-date">${dateStr}</div>
            </div>
          </div>
          <div class="review-rating">${starsHtml}</div>
          <div class="review-text">"${review.comment}"</div>
        `;
        reviewsContainer.appendChild(card);
      });
    })
    .catch(err => console.error('Failed to fetch reviews:', err));
}

// Review Modal Interactions
const btnWriteReview = document.getElementById('btnWriteReview');
const reviewModal = document.getElementById('reviewModal');
const closeReviewModal = document.getElementById('closeReviewModal');
const starWidgetIcons = document.querySelectorAll('#starRatingWidget i');
const submitReviewBtn = document.getElementById('submitReviewBtn');
const reviewComment = document.getElementById('reviewComment');
let selectedRating = 0;

if (btnWriteReview) {
  btnWriteReview.addEventListener('click', () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please login to write a review.', 'warning');
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
      return;
    }
    reviewModal.classList.add('open');
  });
}

if (closeReviewModal) {
  closeReviewModal.addEventListener('click', () => {
    reviewModal.classList.remove('open');
  });
}

// Star Rating Interaction
if (starWidgetIcons.length > 0) {
  starWidgetIcons.forEach(star => {
    star.addEventListener('click', (e) => {
      selectedRating = parseInt(e.target.getAttribute('data-rating'));
      starWidgetIcons.forEach(s => {
        if (parseInt(s.getAttribute('data-rating')) <= selectedRating) {
          s.classList.replace('far', 'fas');
          s.classList.add('active');
        } else {
          s.classList.replace('fas', 'far');
          s.classList.remove('active');
        }
      });
    });
  });
}

// Submit Review
if (submitReviewBtn) {
  submitReviewBtn.addEventListener('click', () => {
    if (selectedRating === 0) {
      return showToast('Please select a star rating.', 'warning');
    }
    if (!reviewComment.value.trim()) {
      return showToast('Please write a comment.', 'warning');
    }

    const token = localStorage.getItem('token');
    
    fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        rating: selectedRating,
        comment: reviewComment.value.trim()
      })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');
      return data;
    })
    .then(() => {
      showToast('Thank you for your feedback!', 'success');
      reviewModal.classList.remove('open');
      reviewComment.value = '';
      selectedRating = 0;
      starWidgetIcons.forEach(s => {
        s.classList.replace('fas', 'far');
        s.classList.remove('active');
      });
      // Refresh reviews list
      fetchReviews();
    })
    .catch(err => {
      showToast(err.message, 'error');
    });
  });
}

// Global click interceptor for protected pages
document.addEventListener('click', function(e) {
  const link = e.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href');
  if (href && (href.includes('wallet.html') || href.includes('history.html') || href.includes('profile.html'))) {
    const token = localStorage.getItem('token');
    if (!token) {
      e.preventDefault();
      
      // If we have showToast, use it, otherwise use alert
      if (typeof showToast === 'function') {
        showToast('Please login first to use this feature.', 'warning');
      } else {
        alert('Please login first to use this feature.');
      }
    }
  }
});
