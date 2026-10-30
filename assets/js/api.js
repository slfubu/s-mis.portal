         
        const SESSION_KEY = 'smisAdminSession';
        const SESSION_PAGE_KEY = 'smisAdminCurrentPage';
        const SESSION_TITLE_KEY = 'smisAdminCurrentTitle';
        const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
        const ACTIVITY_UPDATE_INTERVAL_MS = 30 * 1000;
        const SERVER_SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;
        const PORTAL_MENU_CODES = Object.freeze(['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2']);

        let lastActivityWrite = 0;
        let lastServerTouch = 0;
        let sessionCheckTimer = null;


        // ===== GitHub Pages -> Google Apps Script Web App API =====
        const APP_CONFIG = window.APP_CONFIG || {};
        const API_URL = String(APP_CONFIG.API_URL || '').trim();
        const API_TIMEOUT_MS = Number(APP_CONFIG.REQUEST_TIMEOUT_MS || 30000);
        const API_DEBUG = APP_CONFIG.DEBUG_API === true;

        function validateApiConfig() {
            if (!API_URL || /PASTE_|YOUR_DEPLOYMENT|AKfycb\.\.\./i.test(API_URL)) {
                throw new Error('ยังไม่ได้ตั้งค่า API_URL ใน assets/js/config.js');
            }
            if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/i.test(API_URL)) {
                throw new Error('API_URL ต้องเป็น URL Google Apps Script Web App ที่ลงท้ายด้วย /exec');
            }
        }

        async function apiRequest(action, payload = {}) {
            validateApiConfig();

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    redirect: 'follow',
                    headers: {
                        // ใช้ simple request เพื่อลดปัญหา CORS/preflight ของ Apps Script Web App
                        'Content-Type': 'text/plain;charset=utf-8'
                    },
                    body: JSON.stringify({ action, payload }),
                    signal: controller.signal,
                    cache: 'no-store'
                });

                const raw = await response.text();
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + (raw ? ': ' + raw.slice(0, 160) : ''));
                }

                let data;
                try {
                    data = JSON.parse(raw);
                } catch (_) {
                    throw new Error('Backend ตอบกลับมาไม่ใช่ JSON กรุณาตรวจสอบ Deployment /exec และสิทธิ์การเข้าถึง');
                }

                if (API_DEBUG) console.debug('[S-MIS API]', action, { success: data && data.success === true });
                return data;
            } catch (error) {
                if (error && error.name === 'AbortError') {
                    throw new Error('หมดเวลาการเชื่อมต่อ Backend กรุณาลองใหม่อีกครั้ง');
                }
                throw error;
            } finally {
                clearTimeout(timer);
            }
        }
