// 测试图片配置文件
// 将你的测试图片放在 test_images 文件夹中，然后在这里添加配置

const TEST_IMAGES_CONFIG = [
    // 测试图片配置（只需4个）
    { filename: "1.png", description: "口腔病例1" },
    { filename: "2.png", description: "口腔病例2" },
    { filename: "3.png", description: "口腔病例3" },
    { filename: "4.png", description: "口腔病例4" }
];

// 自动生成完整的测试图片数组
const TEST_IMAGES = TEST_IMAGES_CONFIG.map((img, index) => ({
    id: index + 1,
    name: img.filename,
    description: img.description,
    path: `../test_images/${img.filename}`,
    // 用于后端的相对路径
    serverPath: `test_images/${img.filename}`
}));

// 创建测试图片选择界面
function createTestImageGallery() {
    const uploadZone = document.getElementById('uploadZone');
    if (!uploadZone) {
        console.error('上传区域不存在');
        return;
    }
    
    // 创建图片库容器
    const galleryContainer = document.createElement('div');
    galleryContainer.style.cssText = `
        margin-top: 30px;
        padding: 20px;
        background: #f9f9f9;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
    `;
    
    // 阻止测试图片区域的点击事件冒泡
    galleryContainer.onclick = function(e) {
        e.stopPropagation();
    };
    
    galleryContainer.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">
            <i class="fas fa-images"></i> 测试图片库
        </h3>
        <p style="color: #666; margin-bottom: 15px; font-size: 14px;">
            选择以下测试图片进行检测（请先将对应图片放入 test_images 文件夹）
        </p>
        <div id="testImageGrid" style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 15px;
            max-height: 300px;
            overflow-y: auto;
            padding: 10px;
            background: white;
            border-radius: 4px;
        ">
            ${TEST_IMAGES.map(img => `
                <div class="test-image-item" 
                     data-path="${img.path}"
                     data-server-path="${img.serverPath}"
                     data-name="${img.name}"
                     onclick="event.stopPropagation(); event.preventDefault(); return false;"
                     style="
                        cursor: pointer;
                        text-align: center;
                        padding: 10px;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        transition: all 0.3s;
                        background: white;
                        user-select: none;
                     "
                     onmouseover="this.style.borderColor='#4CAF50'; this.style.transform='scale(1.05)';"
                     onmouseout="this.style.borderColor='#e0e0e0'; this.style.transform='scale(1)';">
                    <div style="
                        width: 80px;
                        height: 80px;
                        margin: 0 auto 8px;
                        background: #f0f0f0;
                        border-radius: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                    ">
                        <img src="${img.path}" 
                             alt="${img.description}"
                             style="max-width: 100%; max-height: 100%; object-fit: cover;"
                             onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\"fas fa-image\" style=\"font-size:30px;color:#ccc;\"></i>'">
                    </div>
                    <div style="font-size: 12px; color: #333; font-weight: 500;">
                        ${img.description}
                    </div>
                    <div style="font-size: 10px; color: #999; margin-top: 4px;">
                        ${img.name}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    uploadZone.appendChild(galleryContainer);
    
    // 绑定点击事件
    document.querySelectorAll('.test-image-item').forEach(item => {
        item.addEventListener('click', function(e) {
            // 阻止事件冒泡，防止触发上层的文件选择
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const imagePath = this.dataset.path;
            const serverPath = this.dataset.serverPath;
            const imageName = this.dataset.name;
            
            console.log('选择测试图片:', imageName);
            loadTestImage(imagePath, serverPath, imageName);
            
            // 高亮选中的图片
            document.querySelectorAll('.test-image-item').forEach(el => {
                el.style.background = 'white';
                el.style.borderColor = '#e0e0e0';
            });
            this.style.background = '#e8f5e9';
            this.style.borderColor = '#4CAF50';
            
            return false; // 确保不触发其他事件
        });
    });
}

// 加载测试图片到预览区
function loadTestImage(imagePath, serverPath, imageName) {
    const previewImage = document.getElementById('previewImage');
    const detectBtn = document.getElementById('detectBtn');
    
    if (!previewImage) {
        console.error('预览图片元素不存在');
        return;
    }
    
    // 创建新的图片对象来测试加载
    const testImg = new Image();
    
    testImg.onload = function() {
        console.log('测试图片加载成功');
        
        // 设置预览图片
        previewImage.src = imagePath;
        previewImage.style.display = 'block';
        previewImage.style.maxWidth = '100%';
        previewImage.style.height = 'auto';
        
        // 隐藏占位符
        const placeholder = document.querySelector('.preview-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        // 启用检测按钮
        if (detectBtn) {
            detectBtn.disabled = false;
        }
        
        // 保存当前文件信息（用于发送到后端）
        window.currentFile = {
            name: imageName,
            type: 'image/jpeg',
            size: 0, // 测试图片不需要真实大小
            isTest: true,
            testPath: imagePath,
            serverPath: serverPath // 后端可以直接使用的路径
        };
        
        console.log('测试图片已设置，可以开始检测');
        
        // 显示图片信息
        const uploadZone = document.getElementById('uploadZone');
        if (uploadZone) {
            const infoDiv = document.getElementById('imageInfo') || document.createElement('div');
            infoDiv.id = 'imageInfo';
            infoDiv.style.cssText = 'margin-top: 10px; padding: 10px; background: #e3f2fd; border-radius: 4px; font-size: 14px;';
            infoDiv.innerHTML = `
                <strong>已选择：</strong>${imageName}<br>
                <small style="color: #666;">点击"开始检测"进行AI分析</small>
            `;
            if (!document.getElementById('imageInfo')) {
                uploadZone.appendChild(infoDiv);
            }
        }
    };
    
    testImg.onerror = function() {
        console.error('测试图片加载失败:', imagePath);
        alert(`图片加载失败：${imageName}\n请确保图片已放入 test_images 文件夹`);
    };
    
    // 开始加载图片
    testImg.src = imagePath;
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        createTestImageGallery();
        
        // 确保检测按钮正确绑定事件
        setTimeout(() => {
            const detectBtn = document.getElementById('detectBtn');
            if (detectBtn) {
                console.log('重新绑定检测按钮事件');
                
                // 克隆按钮以移除所有旧事件
                const newBtn = detectBtn.cloneNode(true);
                detectBtn.parentNode.replaceChild(newBtn, detectBtn);
                
                // 绑定新事件
                newBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('检测按钮被点击 - from test_images_config');
                    
                    if (window.aiDetection) {
                        window.aiDetection.startDetection();
                    } else if (window.AIDetectionSystem) {
                        // 如果使用的是类名
                        const detection = new window.AIDetectionSystem();
                        detection.startDetection();
                    } else {
                        console.error('AI检测系统未找到');
                        alert('检测系统未初始化，请刷新页面重试');
                    }
                });
                
                console.log('检测按钮事件绑定完成');
            }
        }, 500);
    });
} else {
    setTimeout(() => {
        createTestImageGallery();
        
        // 同样的按钮绑定逻辑
        const detectBtn = document.getElementById('detectBtn');
        if (detectBtn) {
            console.log('重新绑定检测按钮事件（页面已加载）');
            
            const newBtn = detectBtn.cloneNode(true);
            detectBtn.parentNode.replaceChild(newBtn, detectBtn);
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('检测按钮被点击 - from test_images_config（已加载）');
                
                if (window.aiDetection) {
                    window.aiDetection.startDetection();
                } else {
                    console.error('AI检测系统未找到');
                    alert('检测系统未初始化，请刷新页面重试');
                }
            });
        }
    }, 100);
}

console.log('测试图片系统已加载，共配置', TEST_IMAGES.length, '张测试图片');