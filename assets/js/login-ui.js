         
        function togglePasswordVisibility() {
            const passwordEl = document.getElementById('password');
            const toggleIcon = document.getElementById('togglePassword');
            if (passwordEl.type === 'password') {
                passwordEl.type = 'text';
                toggleIcon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                passwordEl.type = 'password';
                toggleIcon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        }


         
        function switchAuthMethod(method) {
            const isPassword = method === 'password';
            document.getElementById('authPasswordPane').classList.toggle('active', isPassword);
            document.getElementById('authThaIDPane').classList.toggle('active', !isPassword);
            document.getElementById('authPasswordBtn').classList.toggle('active', isPassword);
            document.getElementById('authThaIDBtn').classList.toggle('active', !isPassword);
            document.getElementById('authPasswordBtn').setAttribute('aria-selected', isPassword ? 'true' : 'false');
            document.getElementById('authThaIDBtn').setAttribute('aria-selected', isPassword ? 'false' : 'true');
        }

        function showForgotPasswordInfo() {
            Swal.fire({
                icon: 'info',
                title: 'ลืมรหัสผ่าน',
                html: 'กรุณาติดต่อผู้ดูแลระบบ งานสวัสดิการนักศึกษา<br>โทร. 045-353000 ต่อ 1210',
                confirmButtonText: 'ตกลง'
            });
        }

        function showLoginGuide() {
            Swal.fire({
                icon: 'info',
                title: 'คำแนะนำการเข้าสู่ระบบ',
                html: '<div style="text-align:left; line-height:1.7">1) เลือกวิธียืนยันตัวตน<br>2) หากใช้รหัสผ่าน ให้กรอก Username และ Password<br>3) หากเลือก ThaID ระบบจะแจ้งว่าส่วนนี้ยังไม่เปิดให้ใช้งาน</div>',
                confirmButtonText: 'เข้าใจแล้ว'
            });
        }
         
        function handleThaIDLogin() {
            Swal.fire({
                icon: 'info',
                title: 'ระบบยังไม่เปิดให้ใช้งาน',
                html: 'ขออภัย ขณะนี้การยืนยันตัวตนผ่าน <b>ThaID</b> ยังไม่เปิดให้ใช้งานในส่วนนี้<br>หากมีการเปิดใช้งานจะแจ้งให้ทราบอีกครั้ง',
                confirmButtonText: 'รับทราบ'
            });
        }

         
