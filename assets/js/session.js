        function getStoredSession() {
            try {
                const raw = sessionStorage.getItem(SESSION_KEY);
                if (!raw) return null;
                const session = JSON.parse(raw);
                 
                 
                if (
                    !session ||
                    !session.loggedIn ||
                    !session.lastActivity ||
                    !session.portalToken ||
                    !session.permissions ||
                    typeof session.permissions !== 'object'
                ) return null;

                session.permissions = normalizeMenuPermissions(session.permissions);
                return session;
            } catch (e) {
                return null;
            }
        }

        function saveLoginSession(response) {
            const now = Date.now();
            const session = {
                loggedIn: true,
                name: String(response.name || '').trim(),
                username: String(response.username || '').trim(),
                role: String(response.role || '').trim().toLowerCase(),
                permissions: normalizeMenuPermissions(response.permissions),
                portalToken: String(response.portalToken || '').trim(),
                lastActivity: now
            };

            sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
            sessionStorage.setItem(SESSION_PAGE_KEY, 'page-home');
            sessionStorage.setItem(
                SESSION_TITLE_KEY,
                '<i class="fas fa-th-large text-primary me-2"></i> Applications'
            );
            lastActivityWrite = now;
            lastServerTouch = now;
        }

        function clearLoginSession() {
            sessionStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_PAGE_KEY);
            sessionStorage.removeItem(SESSION_TITLE_KEY);
            lastActivityWrite = 0;
            lastServerTouch = 0;
        }

        function touchPortalServerSessionIfNeeded(session) {
            if (!session || !session.portalToken) return;

            const now = Date.now();
            if (now - lastServerTouch < SERVER_SESSION_TOUCH_INTERVAL_MS) return;
            lastServerTouch = now;

            apiRequest('touchPortalSession', {
                portalToken: session.portalToken
            }).then(function(response) {
                if (!response || !response.success) {
                    if (API_DEBUG) console.warn('[S-MIS] touch session rejected', response);
                }
            }).catch(function(error) {
                if (API_DEBUG) console.warn('[S-MIS] touch session failed', error);
            });
        }

        function updateSessionActivity(force = false) {
            const session = getStoredSession();
            if (!session) return;

            const now = Date.now();
            if (!force && now - lastActivityWrite < ACTIVITY_UPDATE_INTERVAL_MS) return;

            session.lastActivity = now;
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
            lastActivityWrite = now;
            touchPortalServerSessionIfNeeded(session);
        }

        function isSessionExpired(session) {
            return !session || (Date.now() - Number(session.lastActivity || 0)) >= SESSION_TIMEOUT_MS;
        }

        function showPortalFromSession(session) {
            document.getElementById('displayUserName').innerText = session.name
                ? ' ออกจากระบบ (' + session.name + ')'
                : ' ออกจากระบบ';

            document.getElementById('login-section').style.display = 'none';
            document.getElementById('portal-section').style.display = 'flex';

            document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
            document.getElementById('page-home').classList.add('active');
            document.getElementById('pageTitle').innerHTML =
                '<i class="fas fa-th-large text-primary me-2"></i> Applications';
            document.getElementById('btnBack').style.display = 'none';

            historyStack = ['page-home'];
            titleStack = ['<i class="fas fa-th-large text-primary me-2"></i> Applications'];
            sessionStorage.setItem(SESSION_PAGE_KEY, 'page-home');
            sessionStorage.setItem(SESSION_TITLE_KEY, titleStack[0]);

            applyMenuPermissions(session);
        }

        function resetPortalToLogin() {
            document.getElementById('portal-section').style.display = 'none';
            document.getElementById('login-section').style.display = 'flex';
            document.getElementById('password').value = '';

            historyStack = ['page-home'];
            titleStack = ['<i class="fas fa-th-large text-primary me-2"></i> Applications'];
            document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
            document.getElementById('page-home').classList.add('active');
            document.getElementById('pageTitle').innerHTML = titleStack[0];
            document.getElementById('btnBack').style.display = 'none';
        }

        function autoLogoutDueToInactivity() {
            clearLoginSession();
            resetPortalToLogin();

            Swal.fire({
                icon: 'info',
                title: 'สิ้นสุดระยะเวลาการใช้งานระบบ',
                html: 'ระบบได้ออกจากระบบโดยอัตโนมัติ เนื่องจากไม่มีการใช้งานต่อเนื่องเป็นเวลาเกิน <b>15 นาที</b><br>กรุณายืนยันตัวตนเพื่อเข้าใช้งานระบบอีกครั้ง',
                confirmButtonText: 'รับทราบ',
                allowOutsideClick: false
            });
        }

        function checkSessionTimeout() {
            const session = getStoredSession();
            if (!session) return;
            if (isSessionExpired(session)) {
                autoLogoutDueToInactivity();
            }
        }

        function startSessionMonitoring() {
            if (sessionCheckTimer) clearInterval(sessionCheckTimer);
            sessionCheckTimer = setInterval(checkSessionTimeout, 30 * 1000);

             
            ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(eventName => {
                document.addEventListener(eventName, () => updateSessionActivity(false), { passive: true });
            });
        }

        function restoreSessionOnLoad() {
            const session = getStoredSession();

            if (session && !isSessionExpired(session)) {
                 
                lastActivityWrite = Number(session.lastActivity || 0);
                lastServerTouch = 0;
                touchPortalServerSessionIfNeeded(session);
                showPortalFromSession(session);
            } else {
                if (session) clearLoginSession();
                resetPortalToLogin();
            }

            document.body.classList.remove('session-checking');
            startSessionMonitoring();
        }

         
