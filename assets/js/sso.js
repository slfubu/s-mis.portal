        async function openInternalSystemSso(event, audience, menuCode) {
            if (event) event.preventDefault();

            const session = getStoredSession();
            if (!session || isSessionExpired(session) || !session.portalToken) {
                clearLoginSession();
                resetPortalToLogin();
                Swal.fire({
                    icon: 'warning',
                    title: 'กรุณายืนยันตัวตนใหม่',
                    text: 'เซสชัน S-MIS PORTAL หมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
                    confirmButtonText: 'ตกลง'
                });
                return false;
            }

            if (!hasMenuAccess(session, menuCode)) {
                Swal.fire({
                    icon: 'warning',
                    title: 'ไม่มีสิทธิ์เข้าใช้งาน',
                    text: 'บัญชีนี้ไม่ได้รับสิทธิ์สำหรับเมนู ' + String(menuCode || ''),
                    confirmButtonText: 'ตกลง'
                });
                return false;
            }

            // เปิดหน้าต่างทันทีจาก click event ป้องกัน popup blocker
            const popup = window.open('about:blank', '_blank');

            Swal.fire({
                title: 'กำลังเปิดระบบ',
                html: 'กำลังตรวจสอบสิทธิ์และสร้าง Single Sign-On',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => Swal.showLoading()
            });

            try {
                const response = await apiRequest('createSsoTicket', {
                    portalToken: session.portalToken,
                    audience: audience
                });

                Swal.close();

                if (!response || !response.success || !response.url) {
                    if (popup && !popup.closed) popup.close();
                    Swal.fire({
                        icon: 'error',
                        title: 'ไม่สามารถเข้าสู่ระบบได้',
                        text: response && response.message
                            ? response.message
                            : 'ไม่สามารถสร้าง Single Sign-On ได้'
                    });
                    return false;
                }

                if (popup && !popup.closed) {
                    try {
                        popup.opener = null;
                        popup.location.replace(response.url);
                    } catch (_) {
                        window.location.href = response.url;
                    }
                } else {
                    window.location.href = response.url;
                }
            } catch (error) {
                if (popup && !popup.closed) popup.close();
                Swal.close();
                Swal.fire({
                    icon: 'error',
                    title: 'Single Sign-On ไม่สำเร็จ',
                    text: error && error.message
                        ? error.message
                        : 'ไม่สามารถเชื่อมต่อบริการ SSO ได้ กรุณาลองใหม่'
                });
            }

            return false;
        }

        async function openPermittedExternal(event, menuCode) {
            if (event) event.preventDefault();

            const session = getStoredSession();
            if (!session || isSessionExpired(session) || !session.portalToken) {
                clearLoginSession();
                resetPortalToLogin();
                Swal.fire({
                    icon: 'warning',
                    title: 'กรุณายืนยันตัวตนใหม่',
                    text: 'เซสชัน S-MIS PORTAL หมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
                    confirmButtonText: 'ตกลง'
                });
                return false;
            }

            if (!hasMenuAccess(session, menuCode)) {
                Swal.fire({
                    icon: 'warning',
                    title: 'ไม่มีสิทธิ์เข้าใช้งาน',
                    text: 'บัญชีนี้ไม่ได้รับสิทธิ์สำหรับเมนู ' + String(menuCode || ''),
                    confirmButtonText: 'ตกลง'
                });
                return false;
            }

            const popup = window.open('about:blank', '_blank');

            try {
                const response = await apiRequest('authorizeMenuOpen', {
                    portalToken: session.portalToken,
                    menuCode: menuCode
                });

                if (!response || !response.success) {
                    if (popup && !popup.closed) popup.close();
                    Swal.fire({
                        icon: 'warning',
                        title: 'ไม่มีสิทธิ์เข้าใช้งาน',
                        text: response && response.message
                            ? response.message
                            : 'ไม่สามารถตรวจสอบสิทธิ์เมนูได้'
                    });
                    return false;
                }

                // Destination comes exclusively from the verified server response.
                // The backend must check token + menu permission and use a menu-code allowlist.
                const targetUrl = String(response.url || '').trim();
                let parsedTarget;
                try {
                    parsedTarget = new URL(targetUrl);
                    if (parsedTarget.protocol !== 'https:' || parsedTarget.username || parsedTarget.password) {
                        throw new Error('Invalid URL');
                    }
                } catch (_) {
                    if (popup && !popup.closed) popup.close();
                    Swal.fire({
                        icon: 'error',
                        title: 'ยังไม่สามารถเปิดระบบได้',
                        text: 'เซิร์ฟเวอร์ยังไม่ได้ส่ง URL ของเมนูที่ได้รับอนุญาต กรุณาปรับ API authorizeMenuOpen'
                    });
                    return false;
                }

                if (popup && !popup.closed) {
                    try {
                        popup.opener = null;
                        popup.location.replace(targetUrl);
                    } catch (_) {
                        window.location.href = targetUrl;
                    }
                } else {
                    window.location.href = targetUrl;
                }
            } catch (error) {
                if (popup && !popup.closed) popup.close();
                Swal.fire({
                    icon: 'error',
                    title: 'ตรวจสอบสิทธิ์ไม่สำเร็จ',
                    text: error && error.message
                        ? error.message
                        : 'ไม่สามารถตรวจสอบสิทธิ์เมนูได้ กรุณาลองใหม่'
                });
            }

            return false;
        }

        function openJobStudentSso(event) {
            return openInternalSystemSso(event, 'ubu-jobstudent', 'A1');
        }

        function openENoteSyncSso(event) {
            return openInternalSystemSso(event, 'ubu-enotesync', 'A2');
        }

        function openStudentJobsAdminSso(event) {
            return openInternalSystemSso(event, 'ubu-studentjobs-admin', 'A5');
        }

