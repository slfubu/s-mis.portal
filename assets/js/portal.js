        function setPortalHeading_(heading, iconClass) {
            const element = document.getElementById('pageTitle');
            if (!element) return;
            element.replaceChildren();
            const icon = document.createElement('i');
            icon.className = 'fas ' + (['fa-briefcase', 'fa-graduation-cap', 'fa-globe-asia', 'fa-university', 'fa-folder-open', 'fa-th-large'].includes(iconClass) ? iconClass : 'fa-folder-open') + ' text-primary me-2';
            element.append(icon, document.createTextNode(String(heading || '')));
        }

         
        let historyStack = ['page-home'];
        let titleStack = ['<i class="fas fa-th-large text-primary me-2"></i> Applications'];

        function goToPage(pageId, title) {
            document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            
            const iconMap = {
                'page-job': 'fa-briefcase',
                'page-scholarship': 'fa-graduation-cap',
                'page-ext': 'fa-globe-asia',
                'page-int': 'fa-university',
            };
            const iconClass = iconMap[pageId] || 'fa-folder-open';
            const fullTitle = String(title || '');
            
            setPortalHeading_(fullTitle, iconClass);
            document.getElementById('btnBack').style.display = 'flex';
            
            if(historyStack[historyStack.length - 1] !== pageId) {
                historyStack.push(pageId);
                titleStack.push(fullTitle);
            }

            sessionStorage.setItem(SESSION_PAGE_KEY, pageId);
            sessionStorage.setItem(SESSION_TITLE_KEY, fullTitle);
            updateSessionActivity(true);
            window.scrollTo(0, 0);
        }

        function goBack() {
            if (historyStack.length > 1) {
                historyStack.pop(); 
                titleStack.pop();
                
                const prevPage = historyStack[historyStack.length - 1];
                const prevTitle = titleStack[titleStack.length - 1];
                
                document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
                document.getElementById(prevPage).classList.add('active');
                setPortalHeading_(historyStack.length === 1 ? 'Applications' : prevTitle, historyStack.length === 1 ? 'fa-th-large' : 'fa-folder-open');
                
                if (historyStack.length === 1) {
                    document.getElementById('btnBack').style.display = 'none';
                }

                sessionStorage.setItem(SESSION_PAGE_KEY, prevPage);
                sessionStorage.setItem(SESSION_TITLE_KEY, prevTitle);
                updateSessionActivity(true);
                window.scrollTo(0, 0);
            }
        }

         
        function updateTime() {
            const now = new Date();
            const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
            document.getElementById('datetime').textContent = now.toLocaleDateString('th-TH', options) + ' น.';
        }
        setInterval(updateTime, 1000);
        updateTime();

         
        document.addEventListener('DOMContentLoaded', function() {
            restoreSessionOnLoad();
            try {
                validateApiConfig();
            } catch (error) {
                console.error('[S-MIS] API configuration error:', error.message);
            }
        });
    
