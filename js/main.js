// 主要JavaScript功能

document.addEventListener('DOMContentLoaded', function() {
    // 导航栏滚动效果
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
        }
        lastScrollY = window.scrollY;
    });
    
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = target.offsetTop - navHeight - 20;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // 导航链接高亮
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function highlightNavigation() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavigation);
    
    // 动画效果 - 元素进入视口时显示
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // 观察所有需要动画的元素
    const animatedElements = document.querySelectorAll('.feature-card, .tech-layer, .workflow-step, .monitor-card');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
    
    // 实时数据更新模拟（仅演示用）
    function updateMonitoringData() {
        const statValues = document.querySelectorAll('.monitor-stats .stat-value');
        
        // 模拟设备状态更新
        if (statValues.length > 0) {
            // 随机更新一些值来展示动态效果
            const deviceCount = Math.floor(Math.random() * 5);
            const onlineCount = Math.floor(Math.random() * (deviceCount + 1));
            
            if (statValues[0]) statValues[0].textContent = deviceCount;
            if (statValues[1]) statValues[1].textContent = onlineCount;
            
            // 更新推理速度
            if (statValues[3]) {
                const speed = Math.floor(Math.random() * 50 + 100);
                statValues[3].textContent = speed + 'ms';
            }
            
            // 更新存储空间
            if (statValues[4]) {
                const storage = (Math.random() * 5).toFixed(1);
                statValues[4].textContent = storage + 'GB';
            }
            
            // 更新检测记录
            if (statValues[5]) {
                const records = Math.floor(Math.random() * 100);
                statValues[5].textContent = records;
            }
        }
    }
    
    // 每5秒更新一次监控数据
    if (document.querySelector('.monitor-dashboard')) {
        setInterval(updateMonitoringData, 5000);
    }
    
    // 神经网络动画效果
    const networkConnections = document.querySelectorAll('.connection');
    networkConnections.forEach((connection, index) => {
        connection.style.animationDelay = `${index * 0.1}s`;
    });
    
    // 添加粒子效果到浮动元素
    const floatingElements = document.querySelectorAll('.float-element');
    floatingElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });
        element.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // 统计数字动画
    function animateValue(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                element.textContent = end;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }
    
    // 页面加载完成后的初始化动画
    window.addEventListener('load', () => {
        // 添加加载完成类
        document.body.classList.add('loaded');
        
        // 英雄区域标题动画
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            heroTitle.classList.add('fade-in');
        }
        
        // 英雄区域描述动画
        const heroDesc = document.querySelector('.hero-description');
        if (heroDesc) {
            setTimeout(() => {
                heroDesc.classList.add('fade-in');
            }, 200);
        }
        
        // 按钮动画
        const heroActions = document.querySelector('.hero-actions');
        if (heroActions) {
            setTimeout(() => {
                heroActions.classList.add('fade-in');
            }, 400);
        }
    });
    
    // 移动端菜单功能预留
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const navMenu = document.querySelector('.nav-menu');
            navMenu.classList.toggle('active');
        });
    }
});

// 工具函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 导出函数供其他页面使用
window.aiDetection = {
    // 初始化检测功能
    initDetection: function() {
        console.log('Detection module initialized');
    },
    
    // 上传图像
    uploadImage: function(file) {
        console.log('Uploading image:', file.name);
        // 这里将来会连接到后端API
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: '图像上传成功',
                    fileId: 'demo_' + Date.now()
                });
            }, 1000);
        });
    },
    
    // 执行检测
    runDetection: function(fileId) {
        console.log('Running detection on:', fileId);
        // 这里将来会调用PaddleDetection模型
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    results: {
                        detected: true,
                        confidence: 0.95,
                        regions: []
                    }
                });
            }, 2000);
        });
    }
};

// 设备监控模块
window.deviceMonitor = {
    // 初始化监控
    initMonitor: function() {
        console.log('Device monitor initialized');
    },
    
    // 获取设备列表
    getDevices: function() {
        // 模拟获取设备数据
        return [
            { id: 1, name: '设备1', status: 'online', lastSeen: new Date() },
            { id: 2, name: '设备2', status: 'offline', lastSeen: new Date() }
        ];
    },
    
    // 更新设备状态
    updateDeviceStatus: function(deviceId, status) {
        console.log(`Updating device ${deviceId} status to ${status}`);
        return true;
    }
};