// ── BILIMPARK AUTH MODULE ─────────────────────────────────
// Shared across all pages. Include with <script src="/auth.js"></script>

const BP_API = 'https://bilimly-backend-0zbt.onrender.com';

const Auth = {
  getToken: () => localStorage.getItem('bilimpark_token'),
  getUser: () => JSON.parse(localStorage.getItem('bilimpark_user') || 'null'),
  isLoggedIn: () => !!localStorage.getItem('bilimpark_token'),
  
  setSession(token, user) {
    localStorage.setItem('bilimpark_token', token);
    localStorage.setItem('bilimpark_user', JSON.stringify(user));
  },
  
  clearSession() {
    localStorage.removeItem('bilimpark_token');
    localStorage.removeItem('bilimpark_user');
  },

  getDashboardUrl(role) {
    if (role === 'admin') return '/admin.html';
    if (role === 'tutor') return '/tutor-dashboard.html';
    if (role === 'manager') return '/manager.html';
    return '/dashboard.html';
  },

  async login(email, password) {
    const res = await fetch(`${BP_API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async register(firstName, lastName, email, password) {
    const res = await fetch(`${BP_API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password, role: 'student' })
    });
    return res.json();
  },

  logout() {
    this.clearSession();
    window.location.href = '/';
  }
};

// ── AUTH MODAL ────────────────────────────────────────────
const AuthModal = {
  _callback: null,
  _context: null, // { tutorName, tutorAvatar, action }

  open(tab = 'login', callback = null, context = null) {
    this._callback = callback;
    this._context = context;
    this._render();
    document.getElementById('bp-auth-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const el = document.getElementById(tab === 'login' ? 'bp-login-email' : 'bp-reg-fname');
      if (el) el.focus();
    }, 100);
    this._switchTab(tab);
  },

  close() {
    const overlay = document.getElementById('bp-auth-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  },

  _switchTab(tab) {
    const loginForm = document.getElementById('bp-login-form');
    const regForm = document.getElementById('bp-reg-form');
    const tabLogin = document.getElementById('bp-tab-login');
    const tabReg = document.getElementById('bp-tab-reg');
    if (!loginForm) return;
    loginForm.style.display = tab === 'login' ? 'block' : 'none';
    regForm.style.display = tab === 'register' ? 'block' : 'none';
    tabLogin.classList.toggle('active', tab === 'login');
    tabReg.classList.toggle('active', tab === 'register');
  },

  _render() {
    let existing = document.getElementById('bp-auth-overlay');
    if (existing) { existing.remove(); }

    const ctx = this._context;
    const contextHtml = ctx ? `
      <div style="text-align:center;margin-bottom:20px">
        ${ctx.tutorAvatar 
          ? `<img src="${ctx.tutorAvatar}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto">`
          : `<div style="width:64px;height:64px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 12px">👨‍🏫</div>`
        }
        <div style="font-size:1.1rem;font-weight:700;color:#1B1F3B;margin-bottom:4px">${ctx.title || 'Войдите чтобы продолжить'}</div>
        <div style="font-size:0.85rem;color:#666">${ctx.subtitle || ''}</div>
      </div>` : '';

    const googleReturnUrl = window.location.href;

    const html = `
    <div id="bp-auth-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);z-index:9999;align-items:flex-end;justify-content:center;padding:0" onclick="if(event.target===this)AuthModal.close()">
      <div style="background:white;width:100%;max-width:480px;border-radius:20px 20px 0 0;padding:32px 24px 40px;max-height:92vh;overflow-y:auto;position:relative;margin:0 auto">
        <button onclick="AuthModal.close()" style="position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;background:#f5f5f5;border:none;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center">✕</button>
        
        <div style="display:flex;justify-content:center;margin-bottom:24px">
          <span style="font-family:Inter,sans-serif;font-size:1.3rem;font-weight:700;color:#0ABAB5">Bilimpark<span style="color:#1B1F3B">.kg</span></span>
        </div>

        ${contextHtml}

        <div style="display:flex;border-bottom:1px solid #eee;margin-bottom:24px">
          <div id="bp-tab-login" onclick="AuthModal._switchTab('login')" style="flex:1;text-align:center;padding:10px;font-size:0.9rem;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;color:#999">Войти</div>
          <div id="bp-tab-reg" onclick="AuthModal._switchTab('register')" style="flex:1;text-align:center;padding:10px;font-size:0.9rem;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;color:#999">Регистрация</div>
        </div>

        <!-- LOGIN -->
        <div id="bp-login-form">
          <a href="${BP_API}/api/auth/google?return_url=${encodeURIComponent(googleReturnUrl)}" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:13px;border:1.5px solid #e0e0e0;border-radius:12px;font-size:0.9rem;font-weight:600;cursor:pointer;background:white;color:#1B1F3B;text-decoration:none;margin-bottom:12px">
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
            Продолжить через Google
          </a>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;color:#999;font-size:0.8rem"><div style="flex:1;height:1px;background:#eee"></div>или войти через email<div style="flex:1;height:1px;background:#eee"></div></div>
          <input id="bp-login-email" type="email" placeholder="Email" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:12px 14px;font-size:0.9rem;outline:none;margin-bottom:10px;font-family:Inter,sans-serif" onfocus="this.style.borderColor='#0ABAB5'" onblur="this.style.borderColor='#e0e0e0'">
          <input id="bp-login-pass" type="password" placeholder="Пароль" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:12px 14px;font-size:0.9rem;outline:none;margin-bottom:6px;font-family:Inter,sans-serif" onfocus="this.style.borderColor='#0ABAB5'" onblur="this.style.borderColor='#e0e0e0'" onkeydown="if(event.key==='Enter')AuthModal._submitLogin()">
          <div id="bp-login-err" style="color:#e53e3e;font-size:0.78rem;min-height:18px;margin-bottom:10px"></div>
          <button onclick="AuthModal._submitLogin()" style="width:100%;background:#0ABAB5;color:white;border:none;padding:14px;border-radius:12px;font-size:0.95rem;font-weight:700;cursor:pointer;font-family:Inter,sans-serif">Войти</button>
          <div style="text-align:center;margin-top:16px;font-size:0.85rem;color:#666">Нет аккаунта? <a onclick="AuthModal._switchTab('register')" style="color:#0ABAB5;font-weight:600;cursor:pointer">Зарегистрироваться</a></div>
        </div>

        <!-- REGISTER -->
        <div id="bp-reg-form" style="display:none">
          <a href="${BP_API}/api/auth/google?return_url=${encodeURIComponent(googleReturnUrl)}" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:13px;border:1.5px solid #e0e0e0;border-radius:12px;font-size:0.9rem;font-weight:600;cursor:pointer;background:white;color:#1B1F3B;text-decoration:none;margin-bottom:12px">
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
            Зарегистрироваться через Google
          </a>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;color:#999;font-size:0.8rem"><div style="flex:1;height:1px;background:#eee"></div>или через email<div style="flex:1;height:1px;background:#eee"></div></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <input id="bp-reg-fname" placeholder="Имя *" style="border:1.5px solid #e0e0e0;border-radius:10px;padding:12px 14px;font-size:0.9rem;outline:none;font-family:Inter,sans-serif" onfocus="this.style.borderColor='#0ABAB5'" onblur="this.style.borderColor='#e0e0e0'">
            <input id="bp-reg-lname" placeholder="Фамилия" style="border:1.5px solid #e0e0e0;border-radius:10px;padding:12px 14px;font-size:0.9rem;outline:none;font-family:Inter,sans-serif" onfocus="this.style.borderColor='#0ABAB5'" onblur="this.style.borderColor='#e0e0e0'">
          </div>
          <input id="bp-reg-email" type="email" placeholder="Email *" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:12px 14px;font-size:0.9rem;outline:none;margin-bottom:10px;font-family:Inter,sans-serif" onfocus="this.style.borderColor='#0ABAB5'" onblur="this.style.borderColor='#e0e0e0'">
          <input id="bp-reg-pass" type="password" placeholder="Пароль (мин. 6 символов) *" style="width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:12px 14px;font-size:0.9rem;outline:none;margin-bottom:6px;font-family:Inter,sans-serif" onfocus="this.style.borderColor='#0ABAB5'" onblur="this.style.borderColor='#e0e0e0'" onkeydown="if(event.key==='Enter')AuthModal._submitRegister()">
          <div id="bp-reg-err" style="color:#e53e3e;font-size:0.78rem;min-height:18px;margin-bottom:10px"></div>
          <button onclick="AuthModal._submitRegister()" style="width:100%;background:#0ABAB5;color:white;border:none;padding:14px;border-radius:12px;font-size:0.95rem;font-weight:700;cursor:pointer;font-family:Inter,sans-serif">Создать аккаунт</button>
          <div style="font-size:0.72rem;color:#999;text-align:center;margin-top:10px">Регистрируясь, вы соглашаетесь с <a href="/terms.html" style="color:#0ABAB5">условиями</a></div>
          <div style="text-align:center;margin-top:12px;font-size:0.85rem;color:#666">Уже есть аккаунт? <a onclick="AuthModal._switchTab('login')" style="color:#0ABAB5;font-weight:600;cursor:pointer">Войти</a></div>
        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
    
    // Add CSS for active tab
    const style = document.getElementById('bp-auth-style') || document.createElement('style');
    style.id = 'bp-auth-style';
    style.textContent = `
      #bp-auth-overlay.open { display: flex !important; flex-direction: column; justify-content: flex-end; }
      #bp-tab-login.active, #bp-tab-reg.active { color: #0ABAB5 !important; border-bottom-color: #0ABAB5 !important; }
      @media(min-width:480px) {
        #bp-auth-overlay { align-items: center !important; justify-content: center !important; padding: 20px !important; }
        #bp-auth-overlay > div { border-radius: 20px !important; }
      }
    `;
    document.head.appendChild(style);
  },

  async _submitLogin() {
    const email = document.getElementById('bp-login-email').value.trim();
    const pass = document.getElementById('bp-login-pass').value;
    const errEl = document.getElementById('bp-login-err');
    errEl.textContent = '';
    if (!email || !pass) { errEl.textContent = 'Заполните все поля'; return; }
    const btn = document.querySelector('#bp-login-form button');
    btn.textContent = 'Вход...'; btn.disabled = true;
    try {
      const data = await Auth.login(email, pass);
      if (data.token) {
        Auth.setSession(data.token, data.user);
        this.close();
        if (this._callback) { this._callback(data.user); this._callback = null; }
        else window.location.href = Auth.getDashboardUrl(data.user.role);
      } else {
        errEl.textContent = data.error || 'Неверный email или пароль';
        btn.textContent = 'Войти'; btn.disabled = false;
      }
    } catch(e) { errEl.textContent = 'Ошибка соединения'; btn.textContent = 'Войти'; btn.disabled = false; }
  },

  async _submitRegister() {
    const fname = document.getElementById('bp-reg-fname').value.trim();
    const lname = document.getElementById('bp-reg-lname').value.trim();
    const email = document.getElementById('bp-reg-email').value.trim();
    const pass = document.getElementById('bp-reg-pass').value;
    const errEl = document.getElementById('bp-reg-err');
    errEl.textContent = '';
    if (!fname || !email || !pass) { errEl.textContent = 'Заполните обязательные поля'; return; }
    if (pass.length < 6) { errEl.textContent = 'Пароль минимум 6 символов'; return; }
    const btn = document.querySelector('#bp-reg-form button');
    btn.textContent = 'Создаём...'; btn.disabled = true;
    try {
      const data = await Auth.register(fname, lname, email, pass);
      if (data.token) {
        Auth.setSession(data.token, data.user);
        this.close();
        if (this._callback) { this._callback(data.user); this._callback = null; }
        else window.location.href = '/dashboard.html';
      } else {
        errEl.textContent = data.errors?.[0]?.msg || data.error || 'Ошибка регистрации';
        btn.textContent = 'Создать аккаунт'; btn.disabled = false;
      }
    } catch(e) { errEl.textContent = 'Ошибка соединения'; btn.textContent = 'Создать аккаунт'; btn.disabled = false; }
  }
};

// ── NAV HELPER ────────────────────────────────────────────
function BpInitNav(options = {}) {
  const user = Auth.getUser();
  const navRight = document.getElementById('bp-nav-right');
  if (!navRight) return;

  if (user) {
    const initials = (user.first_name?.[0] || '?').toUpperCase();
    const dashUrl = Auth.getDashboardUrl(user.role);
    navRight.innerHTML = `
      <a href="${dashUrl}" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit;font-size:0.9rem;font-weight:500">
        <div style="width:32px;height:32px;border-radius:50%;background:#0ABAB5;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem">${initials}</div>
        <span style="display:none" class="bp-show-desktop">${user.first_name}</span>
      </a>
      <button onclick="Auth.logout()" style="border:1.5px solid #e0e0e0;background:white;padding:8px 16px;border-radius:8px;font-size:0.85rem;cursor:pointer;font-family:Inter,sans-serif">Выйти</button>`;
  } else {
    navRight.innerHTML = `
      <button onclick="AuthModal.open('login')" style="border:1.5px solid #e0e0e0;background:white;padding:9px 18px;border-radius:8px;font-size:0.88rem;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;color:#1B1F3B">Войти</button>
      <a href="/tutor-onboarding.html" style="background:#0ABAB5;color:white;padding:9px 18px;border-radius:8px;font-size:0.88rem;font-weight:600;text-decoration:none">Стать репетитором</a>`;
  }
}
