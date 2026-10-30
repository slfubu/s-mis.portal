        async function handleLogin() {
            const user = document.getElementById('username').value.trim();
            const pass = document.getElementById('password').value;
            const loginBtn = document.getElementById('loginBtn');

            if (!user || !pass) {
                Swal.fire({
                    icon: 'warning',
                    title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
                    text: 'กรุณาระบุรหัสผู้ใช้งานและรหัสผ่าน'
                });
                return;
            }

            if (loginBtn) loginBtn.disabled = true;

            Swal.fire({
                title: 'กำลังตรวจสอบ',
                html: 'กรุณารอสักครู่ ระบบกำลังยืนยันบัญชีผู้ใช้งาน',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => { Swal.showLoading(); }
            });

            try {
                const response = await apiRequest('checkLogin', {
                    username: user,
                    password: pass
                });

                if (response && response.success) {
                    saveLoginSession(response);
                    document.getElementById('password').value = '';

                    await Swal.fire({
                        icon: 'success',
                        title: 'เข้าสู่ระบบสำเร็จ',
                        text: 'ยินดีต้อนรับ ' + (response.name || ''),
                        showConfirmButton: false,
                        timer: 1200
                    });

                    showPortalFromSession(getStoredSession());
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'ไม่สามารถเข้าสู่ระบบได้',
                        text: response && response.message
                            ? response.message
                            : 'ไม่สามารถยืนยันบัญชีผู้ใช้งานได้'
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: error && error.message
                        ? error.message
                        : 'ไม่สามารถติดต่อฐานข้อมูลได้ กรุณาลองใหม่'
                });
            } finally {
                if (loginBtn) loginBtn.disabled = false;
            }
        }

        function handleLogout() {
            Swal.fire({
                title: 'ยืนยันการออกจากระบบ',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'ออกจากระบบ',
                cancelButtonText: 'ยกเลิก'
            }).then(async (result) => {
                if (!result.isConfirmed) return;

                const session = getStoredSession();
                if (session && session.portalToken) {
                    try {
                        await apiRequest('revokePortalSession', {
                            portalToken: session.portalToken
                        });
                    } catch (error) {
                        if (API_DEBUG) console.warn('[S-MIS] revoke session failed', error);
                    }
                }

                clearLoginSession();
                resetPortalToLogin();
            });
        }

