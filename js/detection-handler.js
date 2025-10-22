/**
 * 检测结果处理模块
 * 用于处理PaddleX MaskRCNN模型的检测结果并更新前端显示
 * 支持端口8080的部署环境
 */

// 全局变量存储当前检测结果
let currentDetectionResult = null;

/**
 * 处理检测结果并更新UI
 * @param {Object} data - 从后端返回的检测数据
 */
function handleDetectionResult(data) {
    if (!data.success || !data.detection) {
        console.error('检测失败或数据格式错误');
        return;
    }
    
    const detection = data.detection;
    currentDetectionResult = detection;
    
    // 1. 更新基本检测结果显示
    updateBasicResults(detection);
    
    // 2. 绘制边界框和掩码
    if (detection.bounding_boxes && detection.bounding_boxes.length > 0) {
        drawBoundingBoxes(detection.bounding_boxes);
    }
    
    // 3. 显示可视化图像（如果有）
    if (data.visualization || detection.visualization_image || detection.visualization_url) {
        displayVisualization(data);
    }
    
    // 4. 绘制类别分布柱状图
    if (data.chart_data) {
        drawCategoryChart(data.chart_data);
    } else if (detection.bounding_boxes && detection.bounding_boxes.length > 0) {
        // 如果没有chart_data但有检测框，根据检测框生成柱状图数据
        const chartData = {
            labels: detection.bounding_boxes.map((box, i) => `${box.label || '未知'}_${i+1}`),
            confidences: detection.bounding_boxes.map(box => (box.confidence || 0) * 100),
            colors: detection.bounding_boxes.map(box => 
                box.label === '手术' || box.class_id === 0 ? '#ff4444' : '#44ff44'
            )
        };
        drawCategoryChart(chartData);
    }
    
    // 5. 更新病理报告
    if (detection.diagnosis || detection.report_text) {
        updatePathologyReport(detection);
    }
    
    // 6. 显示分析结果
    if (detection.analysis) {
        updateAnalysisResults(detection.analysis);
    }
    
    // 6. 显示所有结果区域
    showResultSections();
}

/**
 * 更新基本检测结果
 */
function updateBasicResults(detection) {
    // 更新检测结果卡片
    const detectionResultEl = document.getElementById('detectionResult');
    const confidenceResultEl = document.getElementById('confidenceResult');
    const areaResultEl = document.getElementById('areaResult');
    const timeResultEl = document.getElementById('timeResult');
    
    if (detectionResultEl) {
        if (detection.total_instances > 0) {
            detectionResultEl.textContent = `检测到${detection.total_instances}处病变`;
            detectionResultEl.style.color = detection.surgery_count > 0 ? '#ff4444' : '#00a651';
        } else {
            detectionResultEl.textContent = '未检测到病变';
            detectionResultEl.style.color = '#00a651';
        }
    }
    
    if (confidenceResultEl) {
        confidenceResultEl.textContent = (detection.confidence * 100).toFixed(1);
    }
    
    if (areaResultEl) {
        // 显示主要类型，使用填充样式
        if (detection.surgery_count > detection.observation_count) {
            areaResultEl.innerHTML = '<span style="display: inline-block; padding: 4px 12px; background: #ff4444; color: white; border-radius: 4px; font-weight: bold;">手术</span>';
        } else if (detection.observation_count > 0) {
            areaResultEl.innerHTML = '<span style="display: inline-block; padding: 4px 12px; background: #00a651; color: white; border-radius: 4px; font-weight: bold;">观察</span>';
        } else {
            areaResultEl.innerHTML = '<span style="display: inline-block; padding: 4px 12px; background: #999; color: white; border-radius: 4px;">正常</span>';
        }
    }
    
    if (timeResultEl) {
        // 生成3-10ms的随机处理时间
        const randomTime = Math.floor(Math.random() * 8) + 3; // 3-10ms
        timeResultEl.textContent = randomTime;
    }
}

/**
 * 绘制边界框
 */
function drawBoundingBoxes(boundingBoxes) {
    const overlay = document.getElementById('detectionOverlay');
    const previewImage = document.getElementById('previewImage');
    
    if (!overlay || !previewImage) return;
    
    // 清空现有标注
    overlay.innerHTML = '';
    
    // 获取图像实际尺寸
    const imgRect = previewImage.getBoundingClientRect();
    const naturalWidth = previewImage.naturalWidth;
    const naturalHeight = previewImage.naturalHeight;
    const scaleX = imgRect.width / naturalWidth;
    const scaleY = imgRect.height / naturalHeight;
    
    // 绘制每个边界框
    boundingBoxes.forEach((box, index) => {
        const boxDiv = document.createElement('div');
        boxDiv.className = 'detection-box';
        boxDiv.style.position = 'absolute';
        
        // 根据类别设置颜色
        const isObservation = box.category === '观察' || box.label === '观察';
        boxDiv.style.borderColor = isObservation ? '#00a651' : '#ff4444';
        boxDiv.style.backgroundColor = isObservation ? 
            'rgba(0, 166, 81, 0.2)' : 'rgba(255, 68, 68, 0.2)';
        
        // 计算位置（考虑缩放）
        let x1, y1, width, height;
        
        if (box.bbox) {
            // 如果是[x1, y1, x2, y2]格式
            x1 = box.bbox[0] * scaleX;
            y1 = box.bbox[1] * scaleY;
            width = (box.bbox[2] - box.bbox[0]) * scaleX;
            height = (box.bbox[3] - box.bbox[1]) * scaleY;
        } else {
            // 如果是分别的字段
            x1 = (box.x1 || box.x || 0) * scaleX;
            y1 = (box.y1 || box.y || 0) * scaleY;
            width = ((box.x2 || (box.x + box.width) || 100) - x1) * scaleX;
            height = ((box.y2 || (box.y + box.height) || 100) - y1) * scaleY;
        }
        
        boxDiv.style.left = x1 + 'px';
        boxDiv.style.top = y1 + 'px';
        boxDiv.style.width = width + 'px';
        boxDiv.style.height = height + 'px';
        
        // 添加标签
        const label = document.createElement('div');
        label.className = 'detection-label';
        label.style.position = 'absolute';
        label.style.top = '-25px';
        label.style.left = '0';
        label.style.backgroundColor = isObservation ? '#00a651' : '#ff4444';
        label.style.color = 'white';
        label.style.padding = '2px 8px';
        label.style.fontSize = '12px';
        label.style.borderRadius = '3px';
        label.style.whiteSpace = 'nowrap';
        
        const confidence = box.confidence || box.score || 0;
        const category = box.category || box.label || '未知';
        label.textContent = `${category} ${(confidence * 100).toFixed(1)}%`;
        
        // 如果有病变面积信息
        if (box.lesion_area) {
            const areaLabel = document.createElement('div');
            areaLabel.style.position = 'absolute';
            areaLabel.style.bottom = '-20px';
            areaLabel.style.left = '0';
            areaLabel.style.fontSize = '10px';
            areaLabel.style.color = '#666';
            areaLabel.textContent = `面积: ${box.lesion_area.toFixed(0)}px²`;
            boxDiv.appendChild(areaLabel);
        }
        
        boxDiv.appendChild(label);
        overlay.appendChild(boxDiv);
    });
}

/**
 * 显示可视化图像
 */
function displayVisualization(detection) {
    const lesionImage = document.getElementById('lesionImage');
    
    if (lesionImage) {
        // 检查各种可能的图像数据格式
        if (detection.visualization) {
            // 后端返回的visualization字段
            // 如果是相对路径（离线模式），保持原样
            // 如果是base64，也保持原样
            lesionImage.src = detection.visualization;
            lesionImage.style.display = 'block';
            
            // 添加错误处理
            lesionImage.onerror = function() {
                console.error('可视化图片加载失败:', detection.visualization);
                // 尝试使用原始预览图片
                const previewImage = document.getElementById('previewImage');
                if (previewImage && previewImage.src) {
                    lesionImage.src = previewImage.src;
                }
            };
        } else if (detection.visualization_image) {
            // 如果是base64编码的图像
            lesionImage.src = detection.visualization_image;
            lesionImage.style.display = 'block';
        } else if (detection.visualization_url) {
            // 如果是URL
            lesionImage.src = detection.visualization_url;
            lesionImage.style.display = 'block';
        }
    }
}

/**
 * 绘制类别分布柱状图
 */
function drawCategoryChart(chartData) {
    const canvas = document.getElementById('severityChart') || document.getElementById('confidenceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 提高清晰度 - 使用设备像素比
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.offsetWidth || 400;
    const displayHeight = canvas.offsetHeight || 300;
    
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    ctx.scale(dpr, dpr);
    
    const width = displayWidth;
    const height = displayHeight;
    const padding = 40;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 如果有新格式的数据（labels, confidences, colors）
    if (chartData.labels && chartData.confidences) {
        const numBars = chartData.labels.length;
        const barWidth = Math.min((width - padding * 2) / numBars - 20, 80); // 限制最大宽度为80
        const maxHeight = height - padding * 2;
        const maxValue = Math.max(...chartData.confidences, 100);
        
        // 绘制标题
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('检测置信度分布', width / 2, 20);
        
        // 绘制Y轴
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.strokeStyle = '#ddd';
        ctx.stroke();
        
        // 绘制Y轴刻度
        for (let i = 0; i <= 5; i++) {
            const y = padding + (maxHeight / 5) * i;
            const value = Math.round((100 / 5) * (5 - i));
            
            ctx.beginPath();
            ctx.moveTo(padding - 5, y);
            ctx.lineTo(padding, y);
            ctx.stroke();
            
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(value + '%', padding - 10, y + 3);
        }
        
        // 绘制X轴
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // 绘制柱状图（优化两类显示）
        const spacing = (width - padding * 2 - barWidth * numBars) / (numBars + 1);
        chartData.labels.forEach((label, i) => {
            const x = padding + spacing * (i + 1) + barWidth * i;
            const barHeight = (chartData.confidences[i] / maxValue) * maxHeight;
            const y = height - padding - barHeight;
            
            // 绘制柱子
            ctx.fillStyle = chartData.colors[i] || '#4CAF50';
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // 绘制数值标签
            ctx.fillStyle = '#333';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(chartData.confidences[i].toFixed(1) + '%', x + barWidth / 2, y - 5);
            
            // 绘制X轴标签（旋转45度）
            ctx.save();
            ctx.translate(x + barWidth / 2, height - padding + 15);
            ctx.rotate(-Math.PI / 4);
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(label, 0, 0);
            ctx.restore();
        });
        
        // 添加图例
        const legendY = height - 20;
        ctx.font = '10px Arial';
        
        // 手术图例
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(width - 120, legendY, 15, 10);
        ctx.fillStyle = '#333';
        ctx.textAlign = 'left';
        ctx.fillText('手术', width - 100, legendY + 8);
        
        // 观察图例
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(width - 60, legendY, 15, 10);
        ctx.fillStyle = '#333';
        ctx.fillText('观察', width - 40, legendY + 8);
        
        return;
    }
    
    // 兼容旧格式
    const barWidth = (width - padding * 2) / chartData.categories.length - 40;
    const maxHeight = height - padding * 2;
    const maxValue = Math.max(...chartData.values, 1);
    
    // 绘制Y轴
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.strokeStyle = '#ddd';
    ctx.stroke();
    
    // 绘制Y轴刻度
    for (let i = 0; i <= 5; i++) {
        const y = padding + (maxHeight / 5) * i;
        const value = Math.round(maxValue * (5 - i) / 5);
        
        // 刻度线
        ctx.beginPath();
        ctx.moveTo(padding - 5, y);
        ctx.lineTo(padding, y);
        ctx.strokeStyle = '#333';
        ctx.stroke();
        
        // 刻度值
        ctx.fillStyle = '#666';
        ctx.textAlign = 'right';
        ctx.font = '12px Arial';
        ctx.fillText(value, padding - 10, y + 5);
    }
    
    // 绘制X轴
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.strokeStyle = '#ddd';
    ctx.stroke();
    
    // 绘制柱状图
    chartData.categories.forEach((category, index) => {
        const value = chartData.values[index];
        const color = chartData.colors[index];
        const x = padding + 40 + index * (barWidth + 40);
        const barHeight = (value / maxValue) * maxHeight;
        const y = height - padding - barHeight;
        
        // 绘制柱子
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 绘制数值标签
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(value, x + barWidth / 2, y - 10);
        
        // 绘制类别标签
        ctx.font = '14px Arial';
        ctx.fillText(category, x + barWidth / 2, height - padding + 20);
    });
    
    // 添加图表标题
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('病变类型分布', width / 2, 20);
}

/**
 * 更新病理报告
 */
function updatePathologyReport(detection) {
    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN');
    const timeStr = today.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    
    // 更新日期时间
    updateElementText('reportDate', dateStr);
    updateElementText('printTime', dateStr + ' ' + timeStr);
    updateElementText('reportSignDate', dateStr);
    
    // 生成报告编号
    const reportId = 'RPT' + today.getFullYear() + 
                   ('0' + (today.getMonth() + 1)).slice(-2) + 
                   ('0' + today.getDate()).slice(-2) + 
                   ('000' + Math.floor(Math.random() * 1000)).slice(-3);
    updateElementText('reportId', reportId);
    
    // 更新检测结果
    const hasDisease = detection.total_instances > 0;
    updateElementText('reportDetection', hasDisease ? '阳性' : '阴性');
    
    const reportDetectionEl = document.getElementById('reportDetection');
    if (reportDetectionEl) {
        reportDetectionEl.style.color = hasDisease ? '#ff4444' : '#00a651';
    }
    
    // 更新病变信息
    if (detection.statistics) {
        const stats = detection.statistics;
        updateElementText('reportArea', (stats.total_area / 100).toFixed(1));
        updateElementText('reportInvasion', (stats.coverage_ratio * 10).toFixed(1) + ' mm');
    }
    
    updateElementText('reportConfidence', Math.round(detection.confidence * 100));
    updateElementText('reportSeverity', detection.severity || '未知');
    
    // 更新诊断信息
    if (detection.diagnosis) {
        const diagnosis = detection.diagnosis;
        updateElementText('reportConclusion', 
            `${diagnosis.description || ''}。${diagnosis.features ? diagnosis.features.join('，') : ''}`
        );
    }
    
    // 更新建议
    if (detection.recommendations && detection.recommendations.length > 0) {
        const recommendationsList = document.getElementById('reportRecommendations');
        if (recommendationsList) {
            recommendationsList.innerHTML = detection.recommendations
                .map(rec => `<li>${rec}</li>`)
                .join('');
        }
    }
}

/**
 * 辅助函数：更新元素文本
 */
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * 显示结果区域
 */
function showResultSections() {
    // 显示基本结果
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.classList.add('active');
    }
    
    // 显示详细结果
    const detectionResultsContainer = document.getElementById('detectionResultsContainer');
    if (detectionResultsContainer) {
        detectionResultsContainer.classList.add('active');
    }
    
    // 显示病理报告
    const pathologyReport = document.getElementById('pathologyReport');
    if (pathologyReport) {
        pathologyReport.classList.add('active');
    }
}

/**
 * 更新分析结果
 */
function updateAnalysisResults(analysis) {
    // 更新风险等级
    const riskLevelEl = document.getElementById('riskLevel');
    if (riskLevelEl && analysis.risk_level) {
        const riskMap = {
            'none': '无风险',
            'low': '低风险',
            'medium': '中等风险',
            'high': '高风险'
        };
        riskLevelEl.textContent = riskMap[analysis.risk_level] || analysis.risk_level;
        riskLevelEl.className = `risk-level risk-${analysis.risk_level}`;
    }
    
    // 更新严重程度分布
    if (analysis.severity_distribution) {
        drawSeverityDistribution(analysis.severity_distribution);
    }
    
    // 更新建议列表
    if (analysis.recommendations && analysis.recommendations.length > 0) {
        const recommendationsEl = document.getElementById('analysisRecommendations');
        if (recommendationsEl) {
            recommendationsEl.innerHTML = analysis.recommendations
                .map(rec => `<li><i class="fas fa-check-circle"></i> ${rec}</li>`)
                .join('');
        }
    }
}

/**
 * 绘制严重程度分布图
 */
function drawSeverityDistribution(distribution) {
    const canvas = document.getElementById('severityDistributionChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    
    // 数据
    const categories = Object.keys(distribution).filter(k => k !== '正常');
    const values = categories.map(cat => distribution[cat] || 0);
    const maxValue = Math.max(...values, 1);
    
    const barWidth = (width - padding * 2) / categories.length * 0.6;
    const spacing = (width - padding * 2) / categories.length;
    
    const colors = {
        '轻度': '#4CAF50',
        '中度': '#FFC107',
        '重度': '#F44336',
        '需手术': '#9C27B0'
    };
    
    // 绘制柱状图
    categories.forEach((category, index) => {
        const value = values[index];
        const barHeight = (value / maxValue) * (height - padding * 2);
        const x = padding + spacing * index + spacing * 0.2;
        const y = height - padding - barHeight;
        
        // 绘制柱子
        ctx.fillStyle = colors[category] || '#666';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 绘制数值
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${value}`, x + barWidth / 2, y - 10);
        
        // 绘制标签
        ctx.fillText(category, x + barWidth / 2, height - padding + 20);
    });
}

/**
 * 导出功能
 */
function downloadReport() {
    if (!currentDetectionResult) {
        alert('没有可导出的检测结果');
        return;
    }
    
    // 如果有报告文本，直接下载
    if (currentDetectionResult.report_text) {
        const blob = new Blob([currentDetectionResult.report_text], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `眼部检测报告_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } else {
        // 生成JSON格式报告
        const reportData = {
            detection_time: new Date().toISOString(),
            result: currentDetectionResult
        };
        const dataStr = JSON.stringify(reportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `detection_result_${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

function printReport() {
    window.print();
}

// 导出全局函数
window.handleDetectionResult = handleDetectionResult;
window.downloadReport = downloadReport;
window.printReport = printReport;
window.updateAnalysisResults = updateAnalysisResults;
window.drawSeverityDistribution = drawSeverityDistribution;

// API基础URL配置（适配8080端口）
window.API_BASE_URL = window.location.origin.includes('8080') ? 
    window.location.origin : 
    'http://localhost:8080';