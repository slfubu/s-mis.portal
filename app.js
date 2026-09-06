(() => {
  'use strict';

  /*
   * IMPORTANT:
   * 1) Replace API_URL with the /exec URL of the Apps Script Web App after deploying Code.gs.
   * 2) Do not put passwords, salts, SSO secrets, Sheet IDs that are not already public,
   *    API keys, or service-account credentials in this file. GitHub Pages is public client code.
   */
  const CONFIG = Object.freeze({
    API_URL: 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec',
    API_CHANNEL: 'SMIS_API_V2',
    SESSION_KEY: 'smisPortalSessionV2',
    SESSION_IDLE_MS: 15 * 60 * 1000,
    SERVER_TOUCH_INTERVAL_MS: 4 * 60 * 1000,
    ACTIVITY_WRITE_INTERVAL_MS: 30 * 1000,
    REQUEST_TIMEOUT_MS: 20000,
    MENU_CODES: Object.freeze(['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2'])
  });

  let lastActivityWrite = 0;
  let lastServerTouch = 0;
  let sessionTimer = null;
  let modalState = null;

  const $ = (id) => document.getElementById(id);


  // Local SVG icon set: no external icon font/CDN is required.
  // This keeps the GitHub Pages CSP strict while rendering consistent icons on every device.
  const ICONS = Object.freeze({
    key: '<circle cx="7.5" cy="15.5" r="3.5"></circle><path d="M10.2 13.1 21 2.3"></path><path d="m17.8 5.5 2.7 2.7"></path><path d="m14.8 8.5 2.7 2.7"></path>',
    user: '<path d="M20 21a8 8 0 0 0-16 0"></path><circle cx="12" cy="7" r="4"></circle>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path>',
    eye: '<path d="M2.2 12s3.6-6 9.8-6 9.8 6 9.8 6-3.6 6-9.8 6-9.8-6-9.8-6Z"></path><circle cx="12" cy="12" r="2.7"></circle>',
    'eye-slash': '<path d="m3 3 18 18"></path><path d="M10.6 6.2A10.3 10.3 0 0 1 12 6c6.2 0 9.8 6 9.8 6a15.6 15.6 0 0 1-2.7 3.3"></path><path d="M6.1 6.1C3.5 8 2.2 12 2.2 12s3.6 6 9.8 6a10.6 10.6 0 0 0 3.1-.5"></path>',
    'sign-in-alt': '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><path d="m10 17 5-5-5-5"></path><path d="M15 12H3"></path>',
    'sign-out-alt': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="m16 17 5-5-5-5"></path><path d="M21 12H9"></path>',
    'th-large': '<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect>',
    'laptop-house': '<rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M2 20h20"></path><path d="m9 12 3-3 3 3"></path><path d="M10.5 10.5V14h3v-3.5"></path>',
    'file-invoice-dollar': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6"></path><path d="M12 11v7"></path><path d="M14.2 12.2c-.6-.8-3.8-.9-3.8.8 0 2 4.1 1 4.1 3 0 1.8-3.6 1.7-4.3.7"></path>',
    'envelope-open-text': '<path d="M4 8.5 12 3l8 5.5v10A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5Z"></path><path d="m4 10 8 5 8-5"></path><path d="M8 8h8"></path>',
    envelope: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path>',
    'user-edit': '<path d="M15 21H4a1 1 0 0 1-1-1v-1a6 6 0 0 1 6-6h3"></path><circle cx="9" cy="7" r="4"></circle><path d="m16 18 5-5 2 2-5 5-3 1Z"></path>',
    'user-cog': '<circle cx="9" cy="7" r="4"></circle><path d="M3 21v-2a6 6 0 0 1 9-5.2"></path><circle cx="18" cy="17" r="2.5"></circle><path d="M18 12.5V14M18 20v1.5M13.5 17H15M21 17h1.5M14.8 13.8l1.1 1.1M20.1 19.1l1.1 1.1M21.2 13.8l-1.1 1.1M15.9 19.1l-1.1 1.1"></path>',
    'external-link-alt': '<path d="M14 3h7v7"></path><path d="M10 14 21 3"></path><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"></path>',
    'hand-holding-heart': '<path d="M12 20s-7-4.4-7-9.2A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.8C19 15.6 12 20 12 20Z"></path><path d="M2 21h7l3-2"></path>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"></ellipse><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"></path><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"></path>',
    'chevron-left': '<path d="m15 18-6-6 6-6"></path>',
    'phone-alt': '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9Z"></path>',
    'address-card': '<rect x="3" y="5" width="18" height="14" rx="2"></rect><circle cx="8" cy="10" r="2"></circle><path d="M5 16c.6-2 2-3 3-3s2.4 1 3 3M14 9h4M14 13h4"></path>',
    clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>'
  });

  function iconNameFromElement(element) {
    if (!element || !element.classList) return '';
    for (const className of element.classList) {
      if (!className.startsWith('fa-')) continue;
      const name = className.slice(3);
      if (ICONS[name]) return name;
    }
    return '';
  }

  function renderIconElement(element, requestedName = '') {
    if (!element) return;
    const name = requestedName || iconNameFromElement(element);
    const markup = ICONS[name];
    if (!markup) return;
    element.replaceChildren();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.classList.add('smis-svg-icon');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = markup;
    element.appendChild(svg);
  }

  function renderAllIcons() {
    document.querySelectorAll('i.fas, i.far').forEach((element) => renderIconElement(element));
  }

  function isConfiguredApiUrl() {
    return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(CONFIG.API_URL);
  }

  function isTrustedBridgeOrigin(origin) {
    try {
      const url = new URL(origin);
      if (url.protocol !== 'https:') return false;
      return url.hostname === 'script.google.com' ||
        url.hostname === 'script.googleusercontent.com' ||
        url.hostname.endsWith('.googleusercontent.com');
    } catch (_) {
      return false;
    }
  }

  function randomRequestId() {
    if (globalThis.crypto && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const bytes = new Uint8Array(24);
    if (globalThis.crypto && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(bytes);
      return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    }
    return String(Date.now()) + Math.random().toString(36).slice(2);
  }

  /**
   * Cross-origin POST bridge for GitHub Pages -> Apps Script.
   * We intentionally use a normal HTML form POST into a hidden iframe instead of fetch().
   * Apps Script can then postMessage() the JSON result back to this page. This avoids
   * relying on CORS headers while keeping passwords out of the URL/query string.
   */
  function apiCall(action, payload = {}) {
    return new Promise((resolve, reject) => {
      if (!isConfiguredApiUrl()) {
        reject(new Error('ยังไม่ได้กำหนด API_URL ใน app.js'));
        return;
      }

      const requestId = randomRequestId();
      const frameName = 'smis_api_' + requestId.replace(/[^A-Za-z0-9_]/g, '');
      const iframe = document.createElement('iframe');
      const form = document.createElement('form');
      const input = document.createElement('input');
      let finished = false;

      iframe.name = frameName;
      iframe.className = 'smis-api-frame';
      iframe.setAttribute('aria-hidden', 'true');
      iframe.tabIndex = -1;

      form.method = 'POST';
      form.action = CONFIG.API_URL;
      form.target = frameName;
      form.acceptCharset = 'UTF-8';
      form.className = 'smis-api-frame';

      input.type = 'hidden';
      input.name = 'payload';
      input.value = JSON.stringify({
        v: 2,
        action: String(action || ''),
        requestId,
        origin: window.location.origin,
        data: payload && typeof payload === 'object' ? payload : {}
      });
      form.appendChild(input);

      const cleanup = () => {
        window.removeEventListener('message', onMessage);
        clearTimeout(timeoutId);
        setTimeout(() => {
          try { form.remove(); } catch (_) {}
          try { iframe.remove(); } catch (_) {}
        }, 0);
      };

      const finish = (fn, value) => {
        if (finished) return;
        finished = true;
        cleanup();
        fn(value);
      };

      const onMessage = (event) => {
        if (!isTrustedBridgeOrigin(event.origin)) return;
        const message = event.data;
        if (!message || typeof message !== 'object') return;
        if (message.channel !== CONFIG.API_CHANNEL || message.requestId !== requestId) return;
        finish(resolve, message.response || { success: false, message: 'การตอบกลับจากเซิร์ฟเวอร์ไม่สมบูรณ์' });
      };

      const timeoutId = setTimeout(() => {
        finish(reject, new Error('การเชื่อมต่อเซิร์ฟเวอร์หมดเวลา'));
      }, CONFIG.REQUEST_TIMEOUT_MS);

      window.addEventListener('message', onMessage);
      document.body.appendChild(iframe);
      document.body.appendChild(form);

      try {
        form.submit();
      } catch (error) {
        finish(reject, error instanceof Error ? error : new Error('ไม่สามารถส่งคำขอได้'));
      }
    });
  }

  function ensureModal() {
    if (modalState) return modalState;

    const backdrop = document.createElement('div');
    backdrop.className = 'smis-modal-backdrop';
    backdrop.hidden = true;

    const dialog = document.createElement('div');
    dialog.className = 'smis-modal';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.tabIndex = -1;

    const icon = document.createElement('div');
    icon.className = 'smis-modal-icon';

    const title = document.createElement('h2');
    title.className = 'smis-modal-title';

    const message = document.createElement('p');
    message.className = 'smis-modal-message';

    const spinner = document.createElement('div');
    spinner.className = 'smis-spinner';
    spinner.hidden = true;

    const actions = document.createElement('div');
    actions.className = 'smis-modal-actions';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'smis-modal-btn';

    const confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.className = 'smis-modal-btn primary';

    actions.append(cancel, confirm);
    dialog.append(icon, title, message, spinner, actions);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    modalState = { backdrop, dialog, icon, title, message, spinner, actions, cancel, confirm };
    return modalState;
  }

  function closeModal(result = true) {
    const state = ensureModal();
    if (state._resolver) {
      const resolver = state._resolver;
      state._resolver = null;
      state.backdrop.hidden = true;
      resolver(result);
    } else {
      state.backdrop.hidden = true;
    }
  }

  function showModal(options = {}) {
    const state = ensureModal();
    const type = options.type || 'info';
    const icons = { info: 'i', success: '✓', warning: '!', error: '×', loading: '…' };

    state.icon.textContent = icons[type] || 'i';
    state.title.textContent = String(options.title || 'แจ้งเตือน');
    state.message.textContent = String(options.message || '');
    state.spinner.hidden = type !== 'loading';
    state.actions.hidden = type === 'loading';
    state.cancel.hidden = !options.showCancel;
    state.cancel.textContent = String(options.cancelText || 'ยกเลิก');
    state.confirm.textContent = String(options.confirmText || 'ตกลง');
    state.confirm.className = 'smis-modal-btn ' + (options.danger ? 'danger' : 'primary');
    state.backdrop.hidden = false;

    return new Promise((resolve) => {
      state._resolver = resolve;
      state.cancel.onclick = () => closeModal(false);
      state.confirm.onclick = () => closeModal(true);
      requestAnimationFrame(() => state.dialog.focus());
    });
  }

  function showLoading(title, message) {
    return showModal({ type: 'loading', title, message });
  }

  function normalizePermissions(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    return CONFIG.MENU_CODES.reduce((result, code) => {
      result[code] = source[code] === true;
      return result;
    }, {});
  }

  function validSessionObject(session) {
    if (!session || typeof session !== 'object') return false;
    if (session.loggedIn !== true) return false;
    if (!/^[A-Fa-f0-9]{64,160}$/.test(String(session.portalToken || ''))) return false;
    if (!Number.isFinite(Number(session.lastActivity))) return false;
    if (!session.permissions || typeof session.permissions !== 'object') return false;
    return true;
  }

  function getStoredSession() {
    try {
      const raw = sessionStorage.getItem(CONFIG.SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!validSessionObject(session)) return null;
      session.permissions = normalizePermissions(session.permissions);
      return session;
    } catch (_) {
      return null;
    }
  }

  function saveSession(response, preserveActivity = false) {
    const existing = getStoredSession();
    const now = Date.now();
    const session = {
      loggedIn: true,
      name: String(response.name || '').slice(0, 160),
      username: String(response.username || '').slice(0, 80),
      role: String(response.role || '').toLowerCase().slice(0, 40),
      permissions: normalizePermissions(response.permissions),
      portalToken: String(response.portalToken || (existing && existing.portalToken) || ''),
      lastActivity: preserveActivity && existing ? Number(existing.lastActivity || now) : now
    };
    if (!validSessionObject(session)) throw new Error('ข้อมูลเซสชันไม่สมบูรณ์');
    sessionStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session));
    lastActivityWrite = session.lastActivity;
    return session;
  }

  function clearSession() {
    try { sessionStorage.removeItem(CONFIG.SESSION_KEY); } catch (_) {}
    lastActivityWrite = 0;
    lastServerTouch = 0;
  }

  function isSessionExpired(session) {
    return !session || Date.now() - Number(session.lastActivity || 0) >= CONFIG.SESSION_IDLE_MS;
  }

  function applyMenuPermissions(session) {
    let visible = 0;
    document.querySelectorAll('.menu-permission-item[data-menu-code]').forEach((item) => {
      const code = String(item.dataset.menuCode || '').toUpperCase();
      const allowed = CONFIG.MENU_CODES.includes(code) && session.permissions[code] === true;
      item.hidden = !allowed;
      if (allowed) visible += 1;
    });

    document.querySelectorAll('.portal-menu-group[data-menu-group]').forEach((group) => {
      const hasVisible = Array.from(group.querySelectorAll('.menu-permission-item[data-menu-code]'))
        .some((item) => !item.hidden);
      group.hidden = !hasVisible;
    });

    const empty = $('noAuthorizedMenus');
    if (empty) empty.classList.toggle('is-visible', visible === 0);
  }

  function showPortal(session) {
    $('displayUserName').textContent = session.name ? `ออกจากระบบ (${session.name})` : 'ออกจากระบบ';
    $('login-section').hidden = true;
    $('portal-section').hidden = false;
    $('portal-section').classList.add('is-visible');
    $('btnBack').hidden = true;
    applyMenuPermissions(session);
  }

  function showLogin() {
    $('portal-section').classList.remove('is-visible');
    $('portal-section').hidden = true;
    $('login-section').hidden = false;
    $('password').value = '';
    $('btnBack').hidden = true;
  }

  function togglePasswordVisibility() {
    const password = $('password');
    const icon = $('togglePassword');
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    icon.classList.toggle('fa-eye', !show);
    icon.classList.toggle('fa-eye-slash', show);
    renderIconElement(icon, show ? 'eye-slash' : 'eye');
    icon.setAttribute('aria-label', show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน');
  }

  function switchAuthMethod(method) {
    const passwordMode = method === 'password';
    $('authPasswordPane').classList.toggle('active', passwordMode);
    $('authThaIDPane').classList.toggle('active', !passwordMode);
    $('authPasswordBtn').classList.toggle('active', passwordMode);
    $('authThaIDBtn').classList.toggle('active', !passwordMode);
    $('authPasswordBtn').setAttribute('aria-selected', passwordMode ? 'true' : 'false');
    $('authThaIDBtn').setAttribute('aria-selected', passwordMode ? 'false' : 'true');
  }

  async function handleLogin(event) {
    event.preventDefault();
    const username = $('username').value.trim();
    const password = $('password').value;

    if (!username || !password) {
      await showModal({ type: 'warning', title: 'ข้อมูลไม่ครบ', message: 'กรุณาระบุรหัสผู้ใช้งานและรหัสผ่านให้ครบถ้วน' });
      return;
    }

    showLoading('กำลังตรวจสอบ', 'ระบบกำลังยืนยันบัญชีและตรวจสอบสิทธิ์จากเซิร์ฟเวอร์');
    try {
      const response = await apiCall('login', { username, password });
      closeModal(true);
      $('password').value = '';

      if (!response || response.success !== true) {
        await showModal({
          type: 'error',
          title: 'ไม่สามารถเข้าสู่ระบบได้',
          message: String((response && response.message) || 'รหัสผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง')
        });
        return;
      }

      const session = saveSession(response);
      lastServerTouch = Date.now();
      showPortal(session);
      await showModal({ type: 'success', title: 'เข้าสู่ระบบสำเร็จ', message: session.name ? `ยินดีต้อนรับ ${session.name}` : 'ยืนยันตัวตนเรียบร้อยแล้ว' });
    } catch (error) {
      closeModal(false);
      await showModal({
        type: 'error',
        title: 'เชื่อมต่อระบบไม่สำเร็จ',
        message: error && error.message ? error.message : 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้'
      });
    } finally {
      // Do not retain password strings in application state longer than needed.
      $('password').value = '';
    }
  }

  async function handleLogout() {
    const confirmed = await showModal({
      type: 'warning',
      title: 'ยืนยันการออกจากระบบ?',
      message: 'เซสชันของอุปกรณ์นี้จะถูกยกเลิก',
      showCancel: true,
      confirmText: 'ออกจากระบบ',
      cancelText: 'ยกเลิก',
      danger: true
    });
    if (!confirmed) return;

    const session = getStoredSession();
    clearSession();
    showLogin();

    if (session && session.portalToken) {
      apiCall('logout', { portalToken: session.portalToken }).catch(() => {});
    }
  }

  async function openMenu(event) {
    const link = event.target.closest('.menu-permission-item[data-menu-code] a');
    if (!link) return;
    event.preventDefault();

    const item = link.closest('.menu-permission-item[data-menu-code]');
    const code = String(item && item.dataset.menuCode || '').toUpperCase();
    const session = getStoredSession();

    if (!CONFIG.MENU_CODES.includes(code) || !session || isSessionExpired(session)) {
      clearSession();
      showLogin();
      await showModal({ type: 'warning', title: 'กรุณาเข้าสู่ระบบใหม่', message: 'เซสชันหมดอายุหรือข้อมูลเซสชันไม่ถูกต้อง' });
      return;
    }

    if (session.permissions[code] !== true) {
      await showModal({ type: 'warning', title: 'ไม่มีสิทธิ์เข้าใช้งาน', message: `บัญชีนี้ไม่ได้รับสิทธิ์สำหรับเมนู ${code}` });
      return;
    }

    let popup = null;
    try {
      popup = window.open('about:blank', '_blank');
      if (popup) popup.opener = null;
    } catch (_) {
      popup = null;
    }

    showLoading('กำลังตรวจสอบสิทธิ์', `กำลังตรวจสอบสิทธิ์ล่าสุดสำหรับเมนู ${code}`);
    try {
      const response = await apiCall('openMenu', { portalToken: session.portalToken, menuCode: code });
      closeModal(true);

      if (!response || response.success !== true || !response.url) {
        if (popup && !popup.closed) popup.close();
        if (response && response.code === 'SESSION_EXPIRED') {
          clearSession();
          showLogin();
        }
        await showModal({ type: 'warning', title: 'ไม่สามารถเปิดระบบได้', message: String((response && response.message) || 'ไม่ผ่านการตรวจสอบสิทธิ์') });
        return;
      }

      const target = new URL(String(response.url));
      if (target.protocol !== 'https:') throw new Error('ปลายทางไม่ได้ใช้ HTTPS');
      if (popup && !popup.closed) {
        try { popup.location.replace(target.href); } catch (_) { window.location.assign(target.href); }
      } else {
        window.location.assign(target.href);
      }
      markActivity(true);
    } catch (error) {
      if (popup && !popup.closed) popup.close();
      closeModal(false);
      await showModal({ type: 'error', title: 'เปิดระบบไม่สำเร็จ', message: error && error.message ? error.message : 'ไม่สามารถตรวจสอบสิทธิ์ได้' });
    }
  }

  async function touchServerSession(session) {
    if (!session || !session.portalToken) return;
    const now = Date.now();
    if (now - lastServerTouch < CONFIG.SERVER_TOUCH_INTERVAL_MS) return;
    lastServerTouch = now;
    try {
      const response = await apiCall('touch', { portalToken: session.portalToken });
      if (!response || response.success !== true) {
        clearSession();
        showLogin();
      }
    } catch (_) {
      // Network errors do not extend server session. The next sensitive action revalidates it.
    }
  }

  function markActivity(force = false) {
    const session = getStoredSession();
    if (!session) return;
    const now = Date.now();
    if (!force && now - lastActivityWrite < CONFIG.ACTIVITY_WRITE_INTERVAL_MS) return;
    session.lastActivity = now;
    try { sessionStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session)); } catch (_) {}
    lastActivityWrite = now;
    touchServerSession(session);
  }

  function checkSessionTimeout() {
    const session = getStoredSession();
    if (!session) return;
    if (isSessionExpired(session)) {
      clearSession();
      showLogin();
      showModal({ type: 'info', title: 'สิ้นสุดระยะเวลาการใช้งาน', message: 'ระบบออกจากระบบอัตโนมัติหลังไม่มีการใช้งานต่อเนื่อง 15 นาที' });
    }
  }

  async function restoreSession() {
    const session = getStoredSession();
    if (!session || isSessionExpired(session)) {
      if (session) clearSession();
      showLogin();
      document.body.classList.remove('session-checking');
      return;
    }

    try {
      const response = await apiCall('resume', { portalToken: session.portalToken });
      if (!response || response.success !== true) {
        clearSession();
        showLogin();
      } else {
        const refreshed = saveSession({ ...response, portalToken: session.portalToken }, true);
        lastServerTouch = Date.now();
        showPortal(refreshed);
      }
    } catch (_) {
      // Fail closed: do not display protected menus when server validation cannot be completed.
      clearSession();
      showLogin();
    } finally {
      document.body.classList.remove('session-checking');
    }
  }

  function updateTime() {
    const el = $('datetime');
    if (!el) return;
    const now = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    el.textContent = `◷ ${now.toLocaleDateString('th-TH', options)} น.`;
  }

  function blockFraming() {
    if (window.top === window.self) return false;
    document.documentElement.classList.add('smis-framed-block');
    return true;
  }

  function bindEvents() {
    $('authPasswordBtn').addEventListener('click', () => switchAuthMethod('password'));
    $('authThaIDBtn').addEventListener('click', () => switchAuthMethod('thaid'));
    $('togglePassword').addEventListener('click', togglePasswordVisibility);
    $('togglePassword').addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        togglePasswordVisibility();
      }
    });
    $('togglePassword').tabIndex = 0;
    $('loginForm').addEventListener('submit', handleLogin);
    $('thaidLoginBtn').addEventListener('click', () => showModal({
      type: 'info',
      title: 'ระบบยังไม่เปิดให้ใช้งาน',
      message: 'ขณะนี้การยืนยันตัวตนผ่าน ThaID ยังอยู่ระหว่างเตรียมความพร้อม'
    }));
    $('forgotPasswordLink').addEventListener('click', (event) => {
      event.preventDefault();
      showModal({ type: 'info', title: 'ลืมรหัสผ่าน', message: 'กรุณาติดต่อผู้ดูแลระบบ งานสวัสดิการนักศึกษา\nโทร. 045-353000 ต่อ 1210' });
    });
    $('loginGuideLink').addEventListener('click', (event) => {
      event.preventDefault();
      showModal({ type: 'info', title: 'คำแนะนำการเข้าสู่ระบบ', message: '1) เลือกวิธียืนยันตัวตน\n2) หากใช้รหัสผ่าน ให้กรอก Username และ Password\n3) ระบบจะตรวจสิทธิ์จากเซิร์ฟเวอร์ก่อนเปิดทุกเมนู' });
    });
    $('logoutBtn').addEventListener('click', handleLogout);
    $('btnBack').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.addEventListener('click', openMenu);

    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((name) => {
      document.addEventListener(name, () => markActivity(false), { passive: true });
    });
  }

  async function init() {
    if (blockFraming()) return;
    renderAllIcons();
    bindEvents();
    updateTime();
    setInterval(updateTime, 30000);
    if (sessionTimer) clearInterval(sessionTimer);
    sessionTimer = setInterval(checkSessionTimeout, 30000);

    if (!isConfiguredApiUrl()) {
      clearSession();
      showLogin();
      document.body.classList.remove('session-checking');
      await showModal({
        type: 'warning',
        title: 'ยังไม่ได้ตั้งค่า API',
        message: 'กรุณาแก้ค่า CONFIG.API_URL ใน app.js ให้เป็น URL /exec ของ Google Apps Script Web App ก่อนใช้งานบน GitHub Pages'
      });
      return;
    }

    await restoreSession();
  }

  init();
})();
