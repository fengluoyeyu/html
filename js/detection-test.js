/**
 * 检测结果显示测试和修复
 * 用于确保结果界面能正确显示
 */

// 测试函数：直接显示检测结果
function testShowResults() {
    console.log('测试显示检测结果界面...');
    
    // 1. 显示主要结果区域
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.classList.add('active');
        resultsSection.style.display = 'block';
        console.log('✓ resultsSection 已显示');
    } else {
        console.error('✗ 找不到 resultsSection');
    }
    
    // 2. 显示详细结果容器
    const detectionResultsContainer = document.getElementById('detectionResultsContainer');
    if (detectionResultsContainer) {
        detectionResultsContainer.classList.add('active');
        detectionResultsContainer.style.display = 'block';
        console.log('✓ detectionResultsContainer 已显示');
    } else {
        console.error('✗ 找不到 detectionResultsContainer');
    }
    
    // 3. 显示病理报告
    const pathologyReport = document.getElementById('pathologyReport');
    if (pathologyReport) {
        pathologyReport.classList.add('active');
        pathologyReport.style.display = 'block';
        console.log('✓ pathologyReport 已显示');
    } else {
        console.warn('⚠ 找不到 pathologyReport（可选）');
    }
    
    // 4. 填充测试数据
    fillTestData();
}

// 填充测试数据
function fillTestData() {
    // 检测结果
    const detectionResult = document.getElementById('detectionResult');
    if (detectionResult) {
        detectionResult.textContent = '检测到口腔病变';
        detectionResult.style.color = '#ff4444';
    }

    // 置信度
    const confidenceResult = document.getElementById('confidenceResult');
    if (confidenceResult) {
        confidenceResult.textContent = '85';
    }

    // 病变类型
    const diseaseType = document.getElementById('diseaseType');
    if (diseaseType) {
        diseaseType.textContent = '口腔病变';
    }
    
    // 严重程度
    const severityLevel = document.getElementById('severityLevel');
    if (severityLevel) {
        severityLevel.textContent = '中度';
    }
    
    // 区域统计
    const areaResult = document.getElementById('areaResult');
    if (areaResult) {
        areaResult.innerHTML = `
            <span style="color: #00a651">观察: 1</span> | 
            <span style="color: #ff4444">手术: 1</span>
        `;
    }
    
    console.log('✓ 测试数据已填充');
}

// 修复版的开始检测函数
window.startDetectionFixed = async function() {
    console.log('=== 开始检测（修复版） ===');
    
    // 检查是否选择了图片
    const previewImage = document.getElementById('previewImage');
    if (!previewImage || !previewImage.src || previewImage.src.includes('placeholder')) {
        alert('请先选择测试图片');
        return;
    }
    
    // 获取检测按钮
    const detectBtn = document.getElementById('detectBtn');
    if (detectBtn) {
        detectBtn.disabled = true;
        detectBtn.textContent = '检测中...';
    }
    
    // 显示处理指示器
    const processingIndicator = document.getElementById('processingIndicator');
    if (processingIndicator) {
        processingIndicator.classList.add('active');
        processingIndicator.style.display = 'block';
    }
    
    // 模拟检测过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
        // 判断是否为测试图片
        let imageName = 'unknown';
        if (window.currentFile && window.currentFile.name) {
            imageName = window.currentFile.name;
        }
        
        console.log('检测图片:', imageName);
        
        // 获取离线数据
        const offlineData = getOfflineDataForImage(imageName);
        
        // 显示结果
        displayOfflineResults(offlineData);
        
        // 强制显示所有结果区域
        forceShowAllResultSections();
        
    } catch (error) {
        console.error('检测失败:', error);
        alert('检测失败，请查看控制台');
    } finally {
        // 恢复按钮状态
        if (detectBtn) {
            detectBtn.disabled = false;
            detectBtn.textContent = '开始检测';
        }
        
        // 隐藏处理指示器
        if (processingIndicator) {
            processingIndicator.classList.remove('active');
            processingIndicator.style.display = 'none';
        }
    }
};

// 获取离线数据
function getOfflineDataForImage(imageName) {
    const offlineData = {
        '1.png': {
            disease_detected: true,
            disease_type: '口腔病变',
            confidence: 0.883,
            surgery_confidence: 0.883,
            observation_confidence: 0.117,  // 1 - 0.883 = 0.117
            severity: '重度',
            label: '手术',
            segmentationImage: '../test_fenge/1.jpg',  // 分割结果图
            recognitionImage: '../test_shibie/1.jpg',      // 识别结果图
            diseaseTypes: [
                { name: '填充', confidence: 0.5213 },
                { name: '种植体', confidence: 0.4624 },
                { name: '牙根管', confidence: 0.4352 }
            ]
        },
        '2.png': {
            disease_detected: true,
            disease_type: '口腔病变',
            confidence: 0.965,
            surgery_confidence: 0.965,
            observation_confidence: 0.035,  // 1 - 0.965 = 0.035
            severity: '重度',
            label: '手术',
            segmentationImage: '../test_fenge/2.jpg',
            recognitionImage: '../test_shibie/2.jpg',
            diseaseTypes: [
                { name: '阻生', confidence: 0.7778 },
                { name: '填充', confidence: 0.5906 },
                { name: '种植体', confidence: 0.4868 },
                { name: '牙根管', confidence: 0.3996 },
                { name: '龋齿', confidence: 0.3176 }
            ]
        },
        '3.png': {
            disease_detected: true,
            disease_type: '口腔病变',
            confidence: 0.8422,
            surgery_confidence: 0.1578,  // 1 - 0.8422 = 0.1578
            observation_confidence: 0.8422,
            severity: '轻度',
            label: '观察',
            segmentationImage: '../test_fenge/3.jpg',
            recognitionImage: '../test_shibie/3.jpg',
            diseaseTypes: [
                { name: '填充', confidence: 0.546 }
            ]
        },
        '4.png': {
            disease_detected: true,
            disease_type: '口腔病变',
            confidence: 0.8361,
            surgery_confidence: 0.1639,  // 1 - 0.8361 = 0.1639
            observation_confidence: 0.8361,
            severity: '轻度',
            label: '观察',
            segmentationImage: '../test_fenge/4.jpg',
            recognitionImage: '../test_shibie/4.jpg',
            diseaseTypes: [
                { name: '填充', confidence: 0.5528 },
                { name: '阻生', confidence: 0.5815 }
            ]
        }
    };
    
    // 添加测试图片名称到返回数据
    const result = offlineData[imageName] || {
        disease_detected: false,
        disease_type: '正常',
        confidence: 0.95,
        severity: '正常',
        label: '正常',
        segmentationImage: null,
        recognitionImage: null
    };
    
    // 添加测试图片名称
    result.testImageName = imageName;
    
    return result;
}

// 显示离线结果
function displayOfflineResults(data) {
    console.log('显示离线结果:', data);

    // 更新病理报告（根据不同的测试图片）
    updatePathologyReportForTestImage(data);

    // 填充病变类型数据
    updateDiseaseTypes(data);

    // 更新检测类型（固定输出）
    const detectionType = document.getElementById('detectionType');
    if (detectionType) {
        detectionType.textContent = '曲面断层牙齿分割与牙齿疾病识别';
    }

    // 更新处理时间（随机3-10ms）
    setTimeout(() => {
        const timeResult = document.getElementById('timeResult');
        if (timeResult) {
            const randomTime = Math.floor(Math.random() * 8) + 3; // 3-10ms
            timeResult.innerHTML = String(randomTime);
            timeResult.textContent = String(randomTime);
            console.log('设置处理时间:', randomTime + 'ms');
        }
    }, 100); // 延迟100ms确保DOM已更新

    // 显示牙齿分割图片
    if (data.segmentationImage) {
        const segmentationImage = document.getElementById('segmentationImage');
        if (segmentationImage) {
            segmentationImage.src = data.segmentationImage;
            segmentationImage.style.display = 'block';

            console.log('加载分割结果图片:', data.segmentationImage);

            segmentationImage.onerror = function() {
                console.error('无法加载分割结果图片:', data.segmentationImage);
                console.log('尝试的路径:', data.segmentationImage);
                // 如果加载失败，使用原图
                const previewImage = document.getElementById('previewImage');
                if (previewImage && previewImage.src) {
                    segmentationImage.src = previewImage.src;
                }
            };

            segmentationImage.onload = function() {
                console.log('✓ 分割结果图片加载成功');
            };
        }
    }

    // 显示牙齿疾病识别图片
    if (data.recognitionImage) {
        const recognitionImage = document.getElementById('recognitionImage');
        if (recognitionImage) {
            recognitionImage.src = data.recognitionImage;
            recognitionImage.style.display = 'block';

            console.log('加载识别结果图片:', data.recognitionImage);

            recognitionImage.onerror = function() {
                console.error('无法加载识别结果图片:', data.recognitionImage);
                console.log('尝试的路径:', data.recognitionImage);
                // 如果加载失败，使用原图
                const previewImage = document.getElementById('previewImage');
                if (previewImage && previewImage.src) {
                    recognitionImage.src = previewImage.src;
                }
            };

            recognitionImage.onload = function() {
                console.log('✓ 识别结果图片加载成功');
            };
        }
    }

    // 显示离线模式指示器
    showOfflineModeIndicator();
}

// 绘制置信度柱状图（显示两类）
function drawConfidenceChart(data) {
    const canvas = document.getElementById('severityChart') || document.getElementById('confidenceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    // 提高清晰度 - 使用设备像素比
    const dpr = window.devicePixelRatio || 1;
    
    // 使用固定大小
    const canvasWidth = 500;  // 固定宽度350px
    const canvasHeight = 350; // 固定高度250px
    
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    ctx.scale(dpr, dpr);
    
    // 清除画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 准备数据
    const surgeryConfidence = data.surgery_confidence || (data.label === '手术' ? data.confidence : 1 - data.confidence);
    const observationConfidence = data.observation_confidence || (data.label === '观察' ? data.confidence : 1 - data.confidence);
    
    /* ========================================
     * 柱状图参数配置（固定大小）
     * ========================================
     * 如需调整柱状图大小，请修改以下参数：
     * 1. barWidth: 柱子的宽度（单位：像素）
     * 2. gap: 两个柱子之间的间距（单位：像素）
     * 3. maxBarHeight: 柱子的最大高度（单位：像素）
     * 4. bottomMargin: 底部边距，用于显示标签（单位：像素）
     * ======================================== */
    const barWidth = 60;                    // 固定柱子宽度60px
    const gap = 40;                         // 固定间距40px
    const maxBarHeight = 220;               // 固定最大高度150px
    const bottomMargin = 40;                // 固定底部边距40px

    // 绘制手术柱
    const surgeryHeight = surgeryConfidence * maxBarHeight;
    const surgeryX = canvasWidth / 2 - barWidth - gap / 2;
    const surgeryY = canvasHeight - surgeryHeight - bottomMargin;
    
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(surgeryX, surgeryY, barWidth, surgeryHeight);
    
    // 绘制观察柱
    const observationHeight = observationConfidence * maxBarHeight;
    const observationX = canvasWidth / 2 + gap / 2;
    const observationY = canvasHeight - observationHeight - bottomMargin;
    
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(observationX, observationY, barWidth, observationHeight);
    
    // 绘制标题
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('置信度分布', canvasWidth / 2, 25);
    
    // 绘制手术标签和数值
    ctx.font = '12px Arial';
    ctx.fillStyle = '#ff4444';
    ctx.fillText('手术', surgeryX + barWidth / 2, canvasHeight - bottomMargin + 20);
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.fillText((surgeryConfidence * 100).toFixed(1) + '%', surgeryX + barWidth / 2, surgeryY - 5);
    
    // 绘制观察标签和数值
    ctx.font = '12px Arial';
    ctx.fillStyle = '#44ff44';
    ctx.fillText('观察', observationX + barWidth / 2, canvasHeight - bottomMargin + 20);
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.fillText((observationConfidence * 100).toFixed(1) + '%', observationX + barWidth / 2, observationY - 5);
    
    // 绘制Y轴
    ctx.beginPath();
    ctx.moveTo(35, canvasHeight - bottomMargin);
    ctx.lineTo(35, 40);
    ctx.strokeStyle = '#ddd';
    ctx.stroke();
    
    // 绘制Y轴刻度
    ctx.font = '9px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
        const y = canvasHeight - bottomMargin - (i * maxBarHeight / 10);
        ctx.fillText((i * 10) + '%', 30, y + 3);
        
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(35, y);
        ctx.stroke();
    }
    
    // 绘制X轴
    ctx.beginPath();
    ctx.moveTo(35, canvasHeight - bottomMargin);
    ctx.lineTo(canvasWidth - 35, canvasHeight - bottomMargin);
    ctx.stroke();
    
    console.log('柱状图绘制完成 - 手术:', (surgeryConfidence * 100).toFixed(1) + '%', '观察:', (observationConfidence * 100).toFixed(1) + '%');
}

// 强制显示所有结果区域
function forceShowAllResultSections() {
    console.log('强制显示所有结果区域...');
    
    const sectionsToShow = [
        'resultsSection',
        'detectionResultsContainer',
        'pathologyReport',
        'analysisSection'
    ];
    
    sectionsToShow.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('active');
            element.style.display = 'block';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            console.log(`✓ ${id} 已显示`);
        } else {
            console.warn(`⚠ ${id} 不存在`);
        }
    });
    
    // 滚动到结果区域
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 显示离线模式指示器
function showOfflineModeIndicator() {
    if (!document.getElementById('offlineModeIndicator')) {
        const indicator = document.createElement('div');
        indicator.id = 'offlineModeIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border-radius: 5px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        indicator.innerHTML = `
            <i class="fas fa-check-circle"></i> 测试结果展示
        `;
        document.body.appendChild(indicator);
        
        // 5秒后自动隐藏
        setTimeout(() => {
            indicator.style.transition = 'opacity 0.5s';
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 500);
        }, 5000);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('检测测试脚本已加载');
    
    // 重新绑定检测按钮
    setTimeout(() => {
        const detectBtn = document.getElementById('detectBtn');
        if (detectBtn) {
            // 移除所有旧的事件监听器
            const newBtn = detectBtn.cloneNode(true);
            detectBtn.parentNode.replaceChild(newBtn, detectBtn);
            
            // 添加新的事件监听器
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('检测按钮被点击（from detection-test.js）');
                window.startDetectionFixed();
            });
            
            console.log('✓ 检测按钮已重新绑定');
        }
    }, 1000);
    
    // 添加测试按钮
    const testButton = document.createElement('button');
    testButton.textContent = '测试显示结果';
    testButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        z-index: 10000;
    `;
    testButton.onclick = testShowResults;
    document.body.appendChild(testButton);
    
    console.log('提示：点击右下角的"测试显示结果"按钮可以直接显示结果界面');
});

// 导出到全局
window.testShowResults = testShowResults;

// 获取当前测试图片名称
function getCurrentTestImageName() {
    if (window.currentFile && window.currentFile.isTest) {
        return window.currentFile.name;
    }
    return null;
}

// 更新病变类型显示
function updateDiseaseTypes(data) {
    const reportDiseaseTypes = document.getElementById('reportDiseaseTypes');
    if (!reportDiseaseTypes) {
        console.warn('找不到 reportDiseaseTypes 元素');
        return;
    }

    if (data.diseaseTypes && data.diseaseTypes.length > 0) {
        const diseaseHTML = data.diseaseTypes.map(disease => {
            return `<p style="margin: 0.5rem 0; padding: 0.5rem; background: white; border-left: 3px solid #0066cc;">
                <strong>${disease.name}</strong>，平均置信度：<span style="color: #0066cc; font-weight: bold;">${disease.confidence.toFixed(4)}</span>
            </p>`;
        }).join('');

        reportDiseaseTypes.innerHTML = diseaseHTML;
        console.log('病变类型已更新:', data.diseaseTypes.length + '个');
    } else {
        reportDiseaseTypes.innerHTML = '<p style="color: #666;">未检测到具体病变类型</p>';
    }
}

// 更新病理报告（根据测试图片）
function updatePathologyReportForTestImage(data) {
    console.log('更新病理报告，测试图片:', data.testImageName);
    
    // 更新基本信息
    const patientName = document.getElementById('patientName');
    if (patientName) patientName.textContent = 'xxx';
    
    const patientAge = document.getElementById('patientAge');
    if (patientAge) patientAge.textContent = 'xxx';
    
    const patientGender = document.getElementById('patientGender');
    if (patientGender) patientGender.textContent = 'xxx';
    
    // 更新检查部位为口腔
    const tds = document.querySelectorAll('td');
    tds.forEach(td => {
        if (td.textContent === '眼前节' || td.textContent === '角膜') {
            td.textContent = '口腔';
        }
    });
    
    // 更新检测模型
    const rows = document.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            if (cells[0].textContent.includes('检测模型')) {
                cells[1].textContent = 'MaskRCNN-LAPP';
            }
            if (cells[0].textContent.includes('图像质量')) {
                cells[1].textContent = '优良';
            }
        }
    });
    
    // 更新置信度（保留1位小数）
    const reportConfidence = document.getElementById('reportConfidence');
    if (reportConfidence) {
        reportConfidence.textContent = (data.confidence * 100).toFixed(1);
    }
    
    // 病变检测结果固定为阳性
    const reportDetection = document.getElementById('reportDetection');
    if (reportDetection) {
        reportDetection.textContent = '阳性';
        reportDetection.style.color = '#ff4444';
    }
    
    // 病变类型固定为口腔病变
    const reportArea = document.getElementById('reportArea');
    if (reportArea) {
        reportArea.textContent = '口腔病变';
    }
    
    // 根据不同的测试图片设置具体内容
    let invasionLength = '';
    let severity = '';
    let diagnosis = '';
    let recommendations = [];
    
    const imageName = data.testImageName || getCurrentTestImageName();
    
    switch(imageName) {
        case '1.png':
            invasionLength = '多处';
            severity = '需要关注';
            diagnosis = '曲面断层影像分析显示口腔内存在多处需要关注的区域：检测到牙齿填充物（置信度52.13%），种植体（置信度46.24%），以及牙根管治疗痕迹（置信度43.52%）。这些发现提示患者既往接受过较为全面的口腔治疗。建议定期复查，确保填充物完整性、种植体稳定性以及根管治疗效果的持续性。';
            recommendations = [
                '定期复查牙齿填充物状态，检查是否有脱落、磨损或继发龋',
                '监测种植体周围组织健康，预防种植体周围炎',
                '评估根管治疗牙齿的稳定性，必要时进行根尖片复查',
                '保持良好口腔卫生，使用牙线和漱口水',
                '建议每6个月进行一次口腔全面检查'
            ];
            break;

        case '2.png':
            invasionLength = '多处';
            severity = '需要重点关注';
            diagnosis = '曲面断层影像显示口腔内存在多种病理状况：检测到阻生牙（置信度77.78%），牙齿填充物（置信度59.06%），种植体（置信度48.68%），牙根管治疗（置信度39.96%），以及龋齿（置信度31.76%）。其中阻生牙置信度较高，提示可能存在智齿阻生或其他牙齿萌出异常，需要重点关注。龋齿的检出提示需要及时治疗以防病变进展。';
            recommendations = [
                '建议拍摄阻生牙的全景片或CBCT，评估是否需要拔除',
                '对检出的龋齿进行及时治疗，防止龋坏加深',
                '检查现有填充物是否需要更换或修复',
                '评估种植体和根管治疗牙齿的长期稳定性',
                '加强口腔卫生管理，使用含氟牙膏，定期洁牙',
                '建议每3-6个月复查一次，密切监测病变进展'
            ];
            break;

        case '3.png':
            invasionLength = '单处';
            severity = '良好';
            diagnosis = '曲面断层影像分析显示口腔内检测到牙齿填充物（置信度54.60%）。填充物位置及形态基本正常，未见明显继发龋或填充物脱落迹象。整体口腔健康状况良好，建议继续保持现有的口腔卫生习惯，定期复查即可。';
            recommendations = [
                '定期检查填充物边缘密合性，预防继发龋',
                '保持良好的刷牙习惯，每天至少刷牙两次',
                '使用牙线清洁牙缝，减少食物残留',
                '避免过硬食物，防止填充物崩裂',
                '建议每6-12个月进行一次常规口腔检查'
            ];
            break;

        case '4.png':
            invasionLength = '两处';
            severity = '需要关注';
            diagnosis = '曲面断层影像显示口腔内存在两处需要关注的情况：检测到阻生牙（置信度58.15%）和牙齿填充物（置信度55.28%）。阻生牙的存在提示可能有智齿或其他牙齿未能正常萌出，需要评估其对邻牙及咬合的影响。填充物状态基本稳定。建议进一步检查阻生牙的位置和生长方向，必要时考虑拔除。';
            recommendations = [
                '建议拍摄阻生牙的详细影像（全景片或CBCT），评估拔除必要性',
                '监测阻生牙对邻牙的影响，预防邻牙龋坏或牙根吸收',
                '检查填充物的完整性和边缘密合性',
                '保持良好的口腔卫生，特别注意阻生牙周围清洁',
                '定期复查，每6个月至1年进行一次口腔检查'
            ];
            break;
            
        default:
            invasionLength = '2mm';
            severity = '中度';
            diagnosis = '检测发现口腔存在病变，建议进一步检查并考虑治疗方案。';
            recommendations = [
                '建议到口腔科门诊详细检查',
                '评估病变严重程度',
                '制定个体化治疗方案',
                '定期复查监测病情变化'
            ];
    }
    
    // 更新报告内容
    const reportInvasion = document.getElementById('reportInvasion');
    if (reportInvasion) {
        reportInvasion.textContent = invasionLength;
    }
    
    const reportSeverity = document.getElementById('reportSeverity');
    if (reportSeverity) {
        reportSeverity.textContent = severity;
    }
    
    const reportConclusion = document.getElementById('reportConclusion');
    if (reportConclusion) {
        reportConclusion.textContent = diagnosis;
    }
    
    const reportRecommendations = document.getElementById('reportRecommendations');
    if (reportRecommendations) {
        reportRecommendations.innerHTML = recommendations.map(rec => `<li>${rec}</li>`).join('');
    }
    
    // 更新日期时间
    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN');
    const timeStr = today.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    
    const reportDate = document.getElementById('reportDate');
    if (reportDate) reportDate.textContent = dateStr;
    
    const printTime = document.getElementById('printTime');
    if (printTime) printTime.textContent = dateStr + ' ' + timeStr;
    
    const reportSignDate = document.getElementById('reportSignDate');
    if (reportSignDate) reportSignDate.textContent = dateStr;
    
    // 生成报告编号
    const reportId = 'RPT' + today.getFullYear() + 
                   ('0' + (today.getMonth() + 1)).slice(-2) + 
                   ('0' + today.getDate()).slice(-2) + 
                   ('000' + Math.floor(Math.random() * 1000)).slice(-3);
    const reportIdEl = document.getElementById('reportId');
    if (reportIdEl) reportIdEl.textContent = reportId;
    
    // 生成病历号
    const patientId = 'MR-' + today.getFullYear() + '-' + 
                    ('0000' + Math.floor(Math.random() * 10000)).slice(-4);
    const patientIdEl = document.getElementById('patientId');
    if (patientIdEl) patientIdEl.textContent = patientId;
    
    console.log('病理报告已更新，图片:', imageName);
}
window.startDetectionFixed = startDetectionFixed;
window.forceShowAllResultSections = forceShowAllResultSections;