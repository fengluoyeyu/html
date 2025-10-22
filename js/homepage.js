// 主页交互效果

document.addEventListener('DOMContentLoaded', function() {
    
    // 导航栏滚动效果
    let lastScrollY = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 50) {
            navbar.style.background = 'rgba(0, 0, 0, 0.9)';
            navbar.style.backdropFilter = 'blur(30px)';
        } else {
            navbar.style.background = 'rgba(0, 0, 0, 0.3)';
            navbar.style.backdropFilter = 'blur(20px)';
        }
        
        lastScrollY = currentScrollY;
    });
    
    // 背景图片轮播
    const bgImages = document.querySelectorAll('.bg-image');
    let currentImageIndex = 0;
    
    // 创建虚拟背景图片（使用渐变色模拟）
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)',
        'linear-gradient(135deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)'
    ];
    
    // 设置背景渐变
    bgImages.forEach((img, index) => {
        img.style.background = gradients[index];
    });
    
    function changeBackground() {
        bgImages[currentImageIndex].classList.remove('active');
        currentImageIndex = (currentImageIndex + 1) % bgImages.length;
        bgImages[currentImageIndex].classList.add('active');
    }
    
    // 每5秒切换背景
    setInterval(changeBackground, 5000);
    
    // 粒子效果
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        
        draw() {
            ctx.fillStyle = `rgba(0, 191, 255, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    const particles = [];
    const particleCount = 80;
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // 连接临近粒子
        particles.forEach((p1, index) => {
            particles.slice(index + 1).forEach(p2 => {
                const distance = Math.sqrt(
                    Math.pow(p1.x - p2.x, 2) + 
                    Math.pow(p1.y - p2.y, 2)
                );
                
                if (distance < 100) {
                    ctx.strokeStyle = `rgba(0, 191, 255, ${0.1 * (1 - distance / 100)})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    animateParticles();
    
    // 窗口大小改变时重新设置canvas大小
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    
    // 鼠标交互效果
    let mouseX = 0;
    let mouseY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // 视差效果
        const moveX = (mouseX - window.innerWidth / 2) * 0.01;
        const moveY = (mouseY - window.innerHeight / 2) * 0.01;
        
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
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
    
    // 打字机效果（可选）
    const titleElement = document.querySelector('.title-line');
    if (titleElement) {
        const text = titleElement.textContent;
        titleElement.textContent = '';
        let index = 0;
        
        function typeWriter() {
            if (index < text.length) {
                titleElement.textContent += text.charAt(index);
                index++;
                setTimeout(typeWriter, 100);
            }
        }
        
        // 延迟开始打字效果
        setTimeout(typeWriter, 500);
    }
    
    // 添加页面加载完成的动画类
    document.body.classList.add('loaded');
    
    // 监听导航链接点击
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // 性能优化：使用 requestAnimationFrame 进行节流
    let ticking = false;
    function updateAnimation() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                // 在这里执行动画更新
                ticking = false;
            });
            ticking = true;
        }
    }
    
    // 添加加载完成的视觉反馈
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.querySelector('.hero-section').classList.add('ready');
        }, 100);
    });
});

// 控制台输出
console.log('%c智瞳AI - 智护视界', 'color: #0080ff; font-size: 20px; font-weight: bold;');
console.log('%cPowered by PaddleX', 'color: #666; font-size: 12px;');