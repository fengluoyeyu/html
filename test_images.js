// 测试图片数据（用于本地测试）
// 请将测试图片放在 test_images 文件夹中
const TEST_IMAGES = [
    {
        name: "test1.jpg",
        description: "眼部测试图片1",
        path: "../test_images/test1.jpg"
    },
    {
        name: "test2.jpg", 
        description: "眼部测试图片2",
        path: "../test_images/test2.jpg"
    },
    {
        name: "test3.jpg",
        description: "眼部测试图片3",
        path: "../test_images/test3.jpg"
    }
];

// 添加测试图片选择功能
function addTestImageSelector() {
    const uploadZone = document.getElementById('uploadZone');
    if (!uploadZone) return;
    
    // 创建测试图片选择区域
    const testSelector = document.createElement('div');
    testSelector.style.cssText = 'margin-top: 30px; padding-top: 20px; border-top: 1px dashed #ddd;';
    
    // 检查是否有测试图片
    const testImagesHTML = TEST_IMAGES.map((img, index) => {
        // 创建一个图片元素来测试是否存在
        const testImg = new Image();
        testImg.src = img.path;
        
        return `
            <button class="test-image-btn" data-index="${index}" 
                    style="padding: 8px 15px; background: #f0f0f0; border: 1px solid #ddd; 
                           border-radius: 4px; cursor: pointer; font-size: 14px;
                           transition: all 0.3s;">
                ${img.description}
            </button>
        `;
    }).join('');
    
    testSelector.innerHTML = `
        <p style="color: #666; margin-bottom: 10px;">
            <strong>测试图片</strong>（请先将测试图片放入 test_images 文件夹）：
        </p>
        <div id="testImageButtons" style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${testImagesHTML}
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 10px;">
            提示：如果看不到图片，请将 test1.jpg, test2.jpg, test3.jpg 放入 test_images 文件夹
        </p>
    `;
    
    uploadZone.appendChild(testSelector);
    
    // 绑定测试图片按钮事件
    document.querySelectorAll('.test-image-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const index = parseInt(this.dataset.index);
            const testImage = TEST_IMAGES[index];
            
            console.log('选择测试图片:', testImage.description);
            
            // 加载测试图片到预览
            const previewImage = document.getElementById('previewImage');
            const detectBtn = document.getElementById('detectBtn');
            
            if (previewImage) {
                previewImage.src = testImage.path;
                previewImage.style.display = 'block';
                
                // 隐藏占位符
                const placeholder = document.querySelector('.preview-placeholder');
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
                
                // 启用检测按钮
                if (detectBtn) {
                    detectBtn.disabled = false;
                }
                
                // 创建一个虚拟文件对象用于测试
                window.currentFile = {
                    name: testImage.name,
                    type: 'image/jpeg',
                    size: 1024000, // 1MB 虚拟大小
                    isTest: true,
                    testPath: testImage.path
                };
                
                console.log('测试图片已加载，可以开始检测');
            }
        });
    });
}

// 页面加载完成后添加测试选择器
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addTestImageSelector);
} else {
    // 页面已加载
    setTimeout(addTestImageSelector, 100);
}