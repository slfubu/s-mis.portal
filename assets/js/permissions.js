
        function normalizeMenuPermissions(rawPermissions) {
            const source = rawPermissions && typeof rawPermissions === 'object'
                ? rawPermissions
                : {};

            return PORTAL_MENU_CODES.reduce((result, code) => {
                result[code] = source[code] === true;
                return result;
            }, {});
        }

        function hasMenuAccess(session, menuCode) {
            if (!session) return false;
            const code = String(menuCode || '').trim().toUpperCase();
            if (!PORTAL_MENU_CODES.includes(code)) return false;
            if (String(session.role || '').trim().toLowerCase() === 'admin') return true;
            return !!(session.permissions && session.permissions[code] === true);
        }

        function applyMenuPermissions(session) {
            let visibleCount = 0;

            document.querySelectorAll('.menu-permission-item[data-menu-code]').forEach(item => {
                const code = String(item.dataset.menuCode || '').trim().toUpperCase();
                const allowed = hasMenuAccess(session, code);
                item.style.display = allowed ? '' : 'none';
                if (allowed) visibleCount++;
            });

            document.querySelectorAll('.portal-menu-group[data-menu-group]').forEach(group => {
                const visibleItems = Array.from(
                    group.querySelectorAll('.menu-permission-item[data-menu-code]')
                ).some(item => item.style.display !== 'none');

                group.style.display = visibleItems ? '' : 'none';
            });

            const emptyState = document.getElementById('noAuthorizedMenus');
            if (emptyState) {
                emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
            }
        }

