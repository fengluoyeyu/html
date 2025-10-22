/**
 * 移动端导航菜单功能
 * 处理汉堡菜单的展开/收起
 */

(function() {
    'use strict';

    // 等待DOM加载完成
    document.addEventListener('DOMContentLoaded', function() {
        initMobileMenu();
    });

    function initMobileMenu() {
        // 检查是否已经存在汉堡菜单按钮
        let menuToggle = document.querySelector('.mobile-menu-toggle');

        if (!menuToggle) {
            // 如果不存在，创建汉堡菜单按钮
            createMobileMenuButton();
            menuToggle = document.querySelector('.mobile-menu-toggle');
        }

        // 获取导航链接容器
        const navLinks = document.querySelector('.nav-links');

        // 创建遮罩层
        let overlay = document.querySelector('.mobile-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'mobile-overlay';
            document.body.appendChild(overlay);
        }

        if (!menuToggle || !navLinks) {
            console.warn('移动端菜单元素未找到');
            return;
        }

        // 点击汉堡菜单按钮
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMenu();
        });

        // 点击遮罩层关闭菜单
        overlay.addEventListener('click', function() {
            closeMenu();
        });

        // 点击导航链接后关闭菜单
        const navItems = navLinks.querySelectorAll('.nav-item');
        navItems.forEach(function(item) {
            item.addEventListener('click', function() {
                closeMenu();
            });
        });

        // ESC键关闭菜单
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeMenu();
            }
        });

        // 窗口大小改变时，关闭菜单（从移动端切换到桌面端）
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.innerWidth > 768) {
                    closeMenu();
                }
            }, 250);
        });

        function toggleMenu() {
            const isActive = navLinks.classList.contains('active');

            if (isActive) {
                closeMenu();
            } else {
                openMenu();
            }
        }

        function openMenu() {
            menuToggle.classList.add('active');
            navLinks.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        }

        function closeMenu() {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = ''; // 恢复滚动
        }
    }

    function createMobileMenuButton() {
        // 查找导航栏
        const navbar = document.querySelector('.navbar');
        if (!navbar) {
            console.warn('未找到导航栏');
            return;
        }

        // 创建汉堡菜单按钮
        const menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.setAttribute('aria-label', '打开菜单');
        menuToggle.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;

        // 将按钮添加到导航栏（在logo之后）
        const navLogo = navbar.querySelector('.nav-logo');
        if (navLogo && navLogo.nextSibling) {
            navbar.insertBefore(menuToggle, navLogo.nextSibling);
        } else {
            navbar.appendChild(menuToggle);
        }

        console.log('✓ 移动端菜单按钮已创建');
    }

    // 触摸滑动关闭菜单（可选功能）
    function initSwipeToClose() {
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;

        let startX = 0;
        let currentX = 0;

        navLinks.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
        }, { passive: true });

        navLinks.addEventListener('touchmove', function(e) {
            currentX = e.touches[0].clientX;
            const diff = currentX - startX;

            // 向右滑动超过50px时关闭
            if (diff > 50) {
                navLinks.classList.remove('active');
                document.querySelector('.mobile-overlay').classList.remove('active');
                document.querySelector('.mobile-menu-toggle').classList.remove('active');
                document.body.style.overflow = '';
            }
        }, { passive: true });
    }

    // 可选：启用滑动关闭功能
    // initSwipeToClose();

})();
