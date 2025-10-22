// 极简主页交互效果

document.addEventListener('DOMContentLoaded', function() {
    
    // 导航栏滚动效果
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // 背景图片轮播
    const slides = document.querySelectorAll('.bg-slide');
    let currentSlide = 0;
    
    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }
    
    // 每6秒切换背景
    if (slides.length > 0) {
        setInterval(nextSlide, 6000);
    }
    
    // 第二屏轮播功能
    let currentIndex = 0;
    const carouselImages = document.querySelectorAll('.carousel-image');
    const contentItems = document.querySelectorAll('.content-item');
    const indicators = document.querySelectorAll('.indicator');
    
    function changeSlide(direction) {
        // 移除当前active类
        if (carouselImages[currentIndex]) {
            carouselImages[currentIndex].classList.remove('active');
        }
        if (contentItems[currentIndex]) {
            contentItems[currentIndex].classList.remove('active');
        }
        if (indicators[currentIndex]) {
            indicators[currentIndex].classList.remove('active');
        }
        
        // 计算新索引
        if (direction === 1) {
            currentIndex = (currentIndex + 1) % carouselImages.length;
        } else if (direction === -1) {
            currentIndex = (currentIndex - 1 + carouselImages.length) % carouselImages.length;
        } else if (typeof direction === 'number') {
            currentIndex = direction;
        }
        
        // 添加新的active类
        if (carouselImages[currentIndex]) {
            carouselImages[currentIndex].classList.add('active');
        }
        if (contentItems[currentIndex]) {
            contentItems[currentIndex].classList.add('active');
        }
        if (indicators[currentIndex]) {
            indicators[currentIndex].classList.add('active');
        }
    }
    
    // 指示器点击事件
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            changeSlide(index);
        });
    });
    
    // 自动轮播
    setInterval(() => {
        changeSlide(1);
    }, 5000);
    
    // 全局函数供HTML调用
    window.changeSlide = changeSlide;
    
    // 创建动态粒子背景（可选）
    function createParticles() {
        const container = document.querySelector('.hero-fullscreen');
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles-container';
        particlesContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 4;
        `;
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 3 + 1}px;
                height: ${Math.random() * 3 + 1}px;
                background: rgba(0, 166, 251, ${Math.random() * 0.5 + 0.2});
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float ${Math.random() * 20 + 10}s linear infinite;
            `;
            particlesContainer.appendChild(particle);
        }
        
        container.appendChild(particlesContainer);
        
        // 添加浮动动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0% {
                    transform: translateY(0) translateX(0);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100vh) translateX(50px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 初始化粒子效果
    createParticles();
    
    // 鼠标视差效果
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        
        const heroMain = document.querySelector('.hero-main');
        if (heroMain) {
            heroMain.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
        }
        
        const gridAnimation = document.querySelector('.grid-animation');
        if (gridAnimation) {
            gridAnimation.style.transform = `translate(${x * -10}px, ${y * -10}px)`;
        }
    });
    
    // 文字打字效果
    function typeWriter() {
        const headline = document.querySelector('.hero-headline');
        if (!headline) return;
        
        const text = headline.textContent;
        headline.textContent = '';
        headline.style.opacity = '1';
        
        let index = 0;
        function type() {
            if (index < text.length) {
                headline.textContent += text.charAt(index);
                index++;
                setTimeout(type, 150);
            }
        }
        
        setTimeout(type, 500);
    }
    
    // 页面加载后执行打字效果
    window.addEventListener('load', () => {
        typeWriter();
        
        // 添加加载完成标记
        document.body.classList.add('loaded');
    });
    
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // 添加光标跟踪效果（可选）
    const cursor = document.createElement('div');
    cursor.className = 'cursor-follower';
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        border: 2px solid rgba(0, 166, 251, 0.5);
        border-radius: 50%;
        pointer-events: none;
        transition: all 0.1s ease;
        z-index: 9999;
        display: none;
    `;
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
        cursor.style.display = 'block';
        cursor.style.left = e.clientX - 10 + 'px';
        cursor.style.top = e.clientY - 10 + 'px';
    });
    
    // 按钮悬停效果增强
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('mouseenter', () => {
            cursor.style.transform = 'scale(2)';
            cursor.style.borderColor = 'rgba(0, 166, 251, 0.8)';
        });
        
        ctaButton.addEventListener('mouseleave', () => {
            cursor.style.transform = 'scale(1)';
            cursor.style.borderColor = 'rgba(0, 166, 251, 0.5)';
        });
    }
    
    // 性能优化：使用 requestAnimationFrame
    let ticking = false;
    function updateAnimation() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                // 动画更新逻辑
                ticking = false;
            });
            ticking = true;
        }
    }
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        updateAnimation();
    });
    
    // 添加加载进度（可选）
    function showLoadingProgress() {
        const progress = document.createElement('div');
        progress.className = 'loading-progress';
        progress.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 2px;
            background: linear-gradient(90deg, #00a6fb, #00ff88);
            z-index: 10000;
            transition: width 0.3s ease;
        `;
        document.body.appendChild(progress);
        
        // 模拟加载进度
        setTimeout(() => progress.style.width = '30%', 100);
        setTimeout(() => progress.style.width = '60%', 300);
        setTimeout(() => progress.style.width = '90%', 500);
        setTimeout(() => {
            progress.style.width = '100%';
            setTimeout(() => progress.remove(), 300);
        }, 700);
    }
    
    // 页面加载时显示进度条
    showLoadingProgress();
    
    // 控制台输出
    console.log(
        '%c智瞳AI %c智护视界',
        'color: #00a6fb; font-size: 20px; font-weight: bold;',
        'color: #fff; font-size: 16px;'
    );
    console.log('%cPowered by PaddleX', 'color: #666; font-size: 12px;');
});

// 防抖函数
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

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}