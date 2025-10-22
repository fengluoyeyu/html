"""
明眸辨齿曲面断层口腔健康智能筛查系统 - 主应用程序
适配百度BML-CodeLab平台部署
支持多模型融合智能分析
"""

from flask import Flask, request, jsonify, send_from_directory, render_template, send_file
from flask_cors import CORS
import os
import base64
import json
import requests
from datetime import datetime
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import io
import logging
import cv2
import uuid
from werkzeug.utils import secure_filename

# 尝试导入本地模型推理模块
LOCAL_MODEL_AVAILABLE = False
try:
    from model_inference import get_model_instance, predict_image
    LOCAL_MODEL_AVAILABLE = True
except ImportError:
    pass

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if LOCAL_MODEL_AVAILABLE:
    logger.info("本地模型推理模块可用")
else:
    logger.warning("本地模型推理模块不可用，将使用API或模拟模式")

app = Flask(__name__, static_folder='.')
CORS(app, resources={r"/api/*": {"origins": "*"}})

# BML-CodeLab配置
USE_LOCAL_MODEL = os.environ.get('USE_LOCAL_MODEL', 'true').lower() == 'true'  # 优先使用本地模型
MODEL_PATH = os.environ.get('MODEL_PATH', 'models/oral_health_model')  # 本地模型路径
MODEL_CONFIG = os.environ.get('MODEL_CONFIG', 'models/model_config.json')  # 模型配置文件

# API配置（作为备用）
BML_API_KEY = os.environ.get('BML_API_KEY', '')  # 从环境变量获取
BML_MODEL_ENDPOINT = os.environ.get('BML_MODEL_ENDPOINT', '')  # 模型API端点
USE_LOCAL_MODEL = os.environ.get('USE_LOCAL_MODEL', 'true').lower() == 'true'  # 是否使用本地模型
MODEL_PATH = os.environ.get('MODEL_PATH', 'models')  # 本地模型路径

# 上传文件配置
UPLOAD_FOLDER = 'uploads'
RESULTS_FOLDER = 'results'
SEGMENTATION_FOLDER = 'segmentation_results'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

# 确保必要目录存在
for folder in [UPLOAD_FOLDER, RESULTS_FOLDER, SEGMENTATION_FOLDER, MODEL_PATH]:
    os.makedirs(folder, exist_ok=True)

# 初始化本地模型推理器（如果使用本地模型）
local_inference = None
if USE_LOCAL_MODEL:
    try:
        local_inference = get_model_inference()
        logger.info("本地模型推理器初始化成功")
    except Exception as e:
        logger.error(f"本地模型推理器初始化失败: {str(e)}")
        local_inference = None

def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 路由配置
@app.route('/')
def index():
    """主页"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """提供静态文件服务"""
    if os.path.exists(path):
        return send_from_directory('.', path)
    return "File not found", 404

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'model_connected': bool(BML_MODEL_ENDPOINT) or (USE_LOCAL_MODEL and local_inference is not None),
        'model_type': 'instance_segmentation',
        'supported_classes': ['观察', '手术'],
        'use_local_model': USE_LOCAL_MODEL,
        'local_model_available': local_inference is not None if USE_LOCAL_MODEL else False,
        'model_path': MODEL_PATH if USE_LOCAL_MODEL else None
    })

@app.route('/api/upload', methods=['POST'])
def upload_image():
    """上传图像接口"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': '没有找到图像文件'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': '未选择文件'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': '不支持的文件格式'}), 400
        
        # 检查文件大小
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': f'文件大小超过限制（最大{MAX_FILE_SIZE//1024//1024}MB）'}), 400
        
        # 生成唯一文件名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{timestamp}_{uuid.uuid4().hex[:8]}.{file_ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        # 保存文件
        file.save(filepath)
        
        # 生成预览URL
        preview_url = f"/uploads/{filename}"
        
        return jsonify({
            'success': True,
            'filename': filename,
            'path': filepath,
            'preview_url': preview_url,
            'upload_time': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"上传错误: {str(e)}")
        return jsonify({'error': '文件上传失败'}), 500

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """提供上传文件的访问"""
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/segmentation_results/<filename>')
def segmentation_file(filename):
    """提供分割结果文件的访问"""
    return send_from_directory(SEGMENTATION_FOLDER, filename)

@app.route('/api/detect', methods=['POST'])
def detect_disease():
    """AI检测接口 - 支持实例分割"""
    try:
        data = request.json
        
        if 'image' not in data and 'filename' not in data:
            return jsonify({'error': '缺少图像数据'}), 400
        
        # 获取检测参数
        options = {
            'confidence_threshold': data.get('confidence_threshold', 0.5),
            'nms_threshold': data.get('nms_threshold', 0.5),
            'include_segmentation': True,  # 实例分割总是返回分割掩码
            'include_visualization': data.get('include_visualization', True)
        }
        
        # 处理图像
        if 'image' in data:
            # Base64图像
            image_data = data['image']
            if 'base64,' in image_data:
                image_data = image_data.split('base64,')[1]
            
            # 解码图像
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # 保存临时文件用于处理
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            temp_filename = f"temp_{timestamp}_{uuid.uuid4().hex[:8]}.jpg"
            temp_filepath = os.path.join(UPLOAD_FOLDER, temp_filename)
            image.save(temp_filepath)
            
        elif 'filename' in data:
            # 从文件路径读取
            temp_filename = data['filename']
            temp_filepath = os.path.join(UPLOAD_FOLDER, temp_filename)
            if not os.path.exists(temp_filepath):
                return jsonify({'error': '文件不存在'}), 404
            image = Image.open(temp_filepath)
        
        # 预处理图像
        processed_image = preprocess_image_for_segmentation(image)
        
        # 选择推理方式：优先使用本地模型
        if USE_LOCAL_MODEL and local_inference is not None:
            # 使用本地模型进行推理
            detection_result = call_local_segmentation_model(image, options)
        elif BML_MODEL_ENDPOINT:
            # 使用BML API进行推理
            detection_result = call_bml_segmentation_model(processed_image, image, options)
        else:
            # 模拟检测结果（用于测试）
            detection_result = simulate_segmentation_detection(image)
        
        # 如果有分割结果，生成可视化图像
        if detection_result.get('segmentation_masks'):
            visualization_result = create_segmentation_visualization(
                temp_filepath,
                detection_result['segmentation_masks'],
                detection_result.get('class_labels', [])
            )
            detection_result['visualization_url'] = visualization_result['url']
            detection_result['mask_urls'] = visualization_result['mask_urls']
        
        # 保存检测结果
        result_id = save_detection_result(detection_result, temp_filename)
        
        return jsonify({
            'success': True,
            'result_id': result_id,
            'detection': detection_result,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"检测错误: {str(e)}")
        return jsonify({'error': f'检测失败：{str(e)}'}), 500

def call_local_segmentation_model(image, options=None):
    """调用本地实例分割模型
    
    直接在BML-CodeLab环境中加载和运行本地模型文件
    """
    try:
        if local_inference is None:
            logger.warning("本地模型未初始化，使用模拟数据")
            return simulate_segmentation_detection(image)
        
        # 获取推理参数
        confidence_threshold = options.get('confidence_threshold', 0.5) if options else 0.5
        nms_threshold = options.get('nms_threshold', 0.5) if options else 0.5
        
        logger.info(f"使用本地模型进行推理，置信度阈值: {confidence_threshold}")
        
        # 调用本地模型推理
        result = local_inference.predict(
            image,
            confidence_threshold=confidence_threshold,
            nms_threshold=nms_threshold
        )
        
        logger.info("本地模型推理完成")
        return result
        
    except Exception as e:
        logger.error(f"本地模型推理失败: {str(e)}")
        # 出错时使用模拟数据
        return simulate_segmentation_detection(image)

def call_local_model(image, options=None):
    """调用本地模型进行推理"""
    try:
        # 获取模型实例
        model = get_model_instance(MODEL_PATH, MODEL_CONFIG)
        
        # 更新模型参数
        if options:
            model.confidence_threshold = options.get('confidence_threshold', 0.5)
            model.nms_threshold = options.get('nms_threshold', 0.5)
        
        # 执行推理
        result = model.predict(image)
        
        # 转换结果格式
        instances = result.get('results', [])
        
        # 统计各类别数量
        observation_count = sum(1 for inst in instances if inst['category'] == '观察')
        surgery_count = sum(1 for inst in instances if inst['category'] == '手术')
        total_instances = len(instances)
        
        # 判断严重程度
        surgery_ratio = surgery_count / total_instances if total_instances > 0 else 0
        severity = '轻度'
        if surgery_ratio > 0.5:
            severity = '重度'
        elif surgery_ratio > 0.2:
            severity = '中度'
        
        # 转换为统一格式
        bounding_boxes = []
        segmentation_masks = []
        class_labels = []
        
        for idx, inst in enumerate(instances):
            bounding_boxes.append({
                'id': idx,
                'x1': inst['bbox'][0],
                'y1': inst['bbox'][1],
                'x2': inst['bbox'][2],
                'y2': inst['bbox'][3],
                'label': inst['category'],
                'confidence': inst['score'],
                'area': inst.get('area', 0)
            })
            
            if inst.get('mask'):
                segmentation_masks.append({
                    'id': idx,
                    'mask': inst['mask'],
                    'category': inst['category'],
                    'confidence': inst['score']
                })
            
            class_labels.append({
                'id': idx,
                'category': inst['category'],
                'confidence': inst['score']
            })
        
        # 生成建议
        recommendations = generate_segmentation_recommendations(
            observation_count,
            surgery_count,
            severity
        )
        
        return {
            'disease_detected': total_instances > 0,
            'total_instances': total_instances,
            'observation_count': observation_count,
            'surgery_count': surgery_count,
            'severity': severity,
            'confidence': np.mean([inst['score'] for inst in instances]) if instances else 0,
            'bounding_boxes': bounding_boxes,
            'segmentation_masks': segmentation_masks,
            'class_labels': class_labels,
            'class_distribution': {
                '观察': observation_count,
                '手术': surgery_count
            },
            'recommendations': recommendations,
            'details': {
                'model_version': 'local_v1.0.0',
                'processing_time': 0,
                'model_type': 'instance_segmentation',
                'inference_mode': 'local'
            }
        }
        
    except Exception as e:
        logger.error(f"本地模型推理失败: {e}")
        # 回退到模拟模式
        return simulate_segmentation_detection(image)

def preprocess_image_for_segmentation(image):
    """预处理图像以适配实例分割模型输入"""
    # 转换为RGB
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # PaddleDetection模型通常使用以下尺寸之一
    # 根据您的模型训练时的配置调整
    target_sizes = {
        'yolo': (640, 640),
        'mask_rcnn': (800, 1333),  # 短边800，长边最大1333
        'default': (512, 512)
    }
    
    # 使用适合您模型的尺寸
    target_size = target_sizes.get('default')
    
    # 保持长宽比的缩放
    image.thumbnail(target_size, Image.Resampling.LANCZOS)
    
    # 创建目标尺寸的画布（填充黑色）
    new_image = Image.new('RGB', target_size, (0, 0, 0))
    
    # 将调整后的图像粘贴到中心
    paste_x = (target_size[0] - image.width) // 2
    paste_y = (target_size[1] - image.height) // 2
    new_image.paste(image, (paste_x, paste_y))
    
    # 转换为numpy数组
    img_array = np.array(new_image)
    
    # 归一化（根据模型要求调整）
    img_array = img_array.astype(np.float32) / 255.0
    
    return img_array

def call_bml_segmentation_model(image_array, original_image, options=None):
    """调用BML平台上的实例分割模型API

    支持检测口腔病变并分类为：观察/手术两类
    返回分割掩码和边界框
    """
    try:
        if not BML_MODEL_ENDPOINT:
            logger.warning("未配置BML模型端点，使用模拟数据")
            return simulate_segmentation_detection(original_image)
        
        # 将图像转换为base64
        img = Image.fromarray((image_array * 255).astype(np.uint8))
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        # 构建BML标准请求格式
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {BML_API_KEY}',
            'X-Baidu-Access-Token': BML_API_KEY
        }
        
        # BML实例分割模型输入格式
        payload = {
            'data': {
                'image': img_base64,
                'format': 'base64'
            },
            'params': {
                'threshold': options.get('confidence_threshold', 0.5) if options else 0.5,
                'nms_threshold': options.get('nms_threshold', 0.5) if options else 0.5,
                'return_mask': True,  # 返回分割掩码
                'return_bbox': True,   # 返回边界框
                'max_detections': 20,  # 最多检测20个实例
                'classes': ['观察', '手术']  # 指定类别
            }
        }
        
        # 发送请求到BML模型
        logger.info(f"调用BML实例分割模型: {BML_MODEL_ENDPOINT}")
        response = requests.post(
            BML_MODEL_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=60  # 增加超时时间
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info("BML模型调用成功")
            
            # 解析实例分割结果
            # 假设模型返回格式：
            # {
            #   "results": [{
            #     "category": "观察",
            #     "score": 0.95,
            #     "bbox": [x1, y1, x2, y2],
            #     "mask": "base64编码的掩码",
            #     "area": 1234
            #   }],
            #   "metadata": {...}
            # }
            
            instances = result.get('results', [])
            
            if instances:
                # 处理检测到的实例
                segmentation_masks = []
                bounding_boxes = []
                class_labels = []
                
                # 统计各类别数量
                observation_count = 0
                surgery_count = 0
                
                for idx, instance in enumerate(instances):
                    category = instance.get('category', '未知')
                    confidence = instance.get('score', 0)
                    
                    # 统计类别
                    if category == '观察':
                        observation_count += 1
                    elif category == '手术':
                        surgery_count += 1
                    
                    # 处理边界框
                    if instance.get('bbox'):
                        bbox = instance['bbox']
                        bounding_boxes.append({
                            'id': idx,
                            'x1': bbox[0],
                            'y1': bbox[1],
                            'x2': bbox[2],
                            'y2': bbox[3],
                            'label': category,
                            'confidence': confidence,
                            'area': instance.get('area', 0)
                        })
                    
                    # 处理分割掩码
                    if instance.get('mask'):
                        mask_data = base64.b64decode(instance['mask'])
                        # 根据实际格式解析掩码
                        segmentation_masks.append({
                            'id': idx,
                            'mask': instance['mask'],  # base64编码
                            'category': category,
                            'confidence': confidence
                        })
                    
                    class_labels.append({
                        'id': idx,
                        'category': category,
                        'confidence': confidence
                    })
                
                # 判断整体严重程度
                total_instances = len(instances)
                surgery_ratio = surgery_count / total_instances if total_instances > 0 else 0
                
                severity = '轻度'
                if surgery_ratio > 0.5:
                    severity = '重度'
                elif surgery_ratio > 0.2:
                    severity = '中度'
                
                # 生成建议
                recommendations = generate_segmentation_recommendations(
                    observation_count, 
                    surgery_count,
                    severity
                )
                
                return {
                    'disease_detected': total_instances > 0,
                    'total_instances': total_instances,
                    'observation_count': observation_count,
                    'surgery_count': surgery_count,
                    'severity': severity,
                    'confidence': np.mean([inst.get('score', 0) for inst in instances]),
                    'bounding_boxes': bounding_boxes,
                    'segmentation_masks': segmentation_masks,
                    'class_labels': class_labels,
                    'class_distribution': {
                        '观察': observation_count,
                        '手术': surgery_count
                    },
                    'recommendations': recommendations,
                    'details': {
                        'model_version': result.get('metadata', {}).get('model_version', 'v1.0.0'),
                        'processing_time': result.get('metadata', {}).get('time_ms', 0),
                        'model_type': 'instance_segmentation'
                    }
                }
            else:
                # 没有检测到病变
                return {
                    'disease_detected': False,
                    'total_instances': 0,
                    'observation_count': 0,
                    'surgery_count': 0,
                    'severity': '正常',
                    'confidence': 1.0,
                    'bounding_boxes': [],
                    'segmentation_masks': [],
                    'class_labels': [],
                    'class_distribution': {
                        '观察': 0,
                        '手术': 0
                    },
                    'recommendations': ['口腔健康状况良好', '建议定期检查', '保持良好口腔卫生习惯'],
                    'details': {
                        'model_version': result.get('metadata', {}).get('model_version', 'v1.0.0'),
                        'model_type': 'instance_segmentation'
                    }
                }
        else:
            logger.error(f"BML API错误: {response.status_code}, {response.text}")
            return simulate_segmentation_detection(original_image)
    
    except Exception as e:
        logger.error(f"调用BML模型失败: {str(e)}")
        return simulate_segmentation_detection(original_image)

def simulate_segmentation_detection(image):
    """模拟实例分割检测结果（用于测试）"""
    import random
    
    # 随机生成检测结果
    num_instances = random.randint(0, 3)
    
    if num_instances == 0:
        return {
            'disease_detected': False,
            'total_instances': 0,
            'observation_count': 0,
            'surgery_count': 0,
            'severity': '正常',
            'confidence': 1.0,
            'bounding_boxes': [],
            'segmentation_masks': [],
            'class_labels': [],
            'class_distribution': {
                '观察': 0,
                '手术': 0
            },
            'recommendations': ['口腔健康状况良好', '建议定期检查'],
            'details': {
                'model_version': 'v1.0.0-demo',
                'processing_time': random.randint(100, 500),
                'model_type': 'instance_segmentation'
            }
        }
    
    # 生成模拟的实例
    bounding_boxes = []
    segmentation_masks = []
    class_labels = []
    observation_count = 0
    surgery_count = 0
    
    for i in range(num_instances):
        # 随机分配类别
        category = random.choice(['观察', '手术'])
        if category == '观察':
            observation_count += 1
        else:
            surgery_count += 1
        
        confidence = random.uniform(0.7, 0.99)
        
        # 生成随机边界框
        x1 = random.randint(50, 200)
        y1 = random.randint(50, 200)
        width = random.randint(50, 150)
        height = random.randint(50, 150)
        
        bounding_boxes.append({
            'id': i,
            'x1': x1,
            'y1': y1,
            'x2': x1 + width,
            'y2': y1 + height,
            'label': category,
            'confidence': confidence,
            'area': width * height
        })
        
        # 生成模拟的掩码（简化为矩形区域的base64编码）
        mask_img = Image.new('L', (512, 512), 0)
        draw = ImageDraw.Draw(mask_img)
        draw.ellipse([x1, y1, x1 + width, y1 + height], fill=255)
        
        mask_buffer = io.BytesIO()
        mask_img.save(mask_buffer, format='PNG')
        mask_base64 = base64.b64encode(mask_buffer.getvalue()).decode()
        
        segmentation_masks.append({
            'id': i,
            'mask': mask_base64,
            'category': category,
            'confidence': confidence
        })
        
        class_labels.append({
            'id': i,
            'category': category,
            'confidence': confidence
        })
    
    # 判断严重程度
    surgery_ratio = surgery_count / num_instances if num_instances > 0 else 0
    severity = '轻度'
    if surgery_ratio > 0.5:
        severity = '重度'
    elif surgery_ratio > 0.2:
        severity = '中度'
    
    recommendations = generate_segmentation_recommendations(
        observation_count, 
        surgery_count,
        severity
    )
    
    return {
        'disease_detected': True,
        'total_instances': num_instances,
        'observation_count': observation_count,
        'surgery_count': surgery_count,
        'severity': severity,
        'confidence': np.mean([box['confidence'] for box in bounding_boxes]),
        'bounding_boxes': bounding_boxes,
        'segmentation_masks': segmentation_masks,
        'class_labels': class_labels,
        'class_distribution': {
            '观察': observation_count,
            '手术': surgery_count
        },
        'recommendations': recommendations,
        'details': {
            'model_version': 'v1.0.0-demo',
            'processing_time': random.randint(100, 500),
            'model_type': 'instance_segmentation'
        }
    }

def create_segmentation_visualization(image_path, masks, labels):
    """创建分割结果的可视化图像"""
    try:
        # 读取原始图像
        image = cv2.imread(image_path)
        if image is None:
            image = np.zeros((512, 512, 3), dtype=np.uint8)
        
        height, width = image.shape[:2]
        
        # 创建叠加图像
        overlay = image.copy()
        mask_urls = []
        
        # 颜色映射
        colors = {
            '观察': (0, 255, 0),    # 绿色
            '手术': (0, 0, 255),    # 红色
            '未知': (255, 255, 0)   # 黄色
        }
        
        for idx, (mask_data, label_data) in enumerate(zip(masks, labels)):
            category = label_data.get('category', '未知')
            color = colors.get(category, (255, 255, 255))
            
            # 解码掩码
            if mask_data.get('mask'):
                mask_base64 = mask_data['mask']
                mask_bytes = base64.b64decode(mask_base64)
                mask_img = Image.open(io.BytesIO(mask_bytes)).convert('L')
                mask_array = np.array(mask_img.resize((width, height)))
                
                # 应用掩码到叠加图像
                mask_bool = mask_array > 128
                overlay[mask_bool] = overlay[mask_bool] * 0.5 + np.array(color) * 0.5
                
                # 保存单独的掩码图像
                mask_filename = f"mask_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{idx}.png"
                mask_path = os.path.join(SEGMENTATION_FOLDER, mask_filename)
                cv2.imwrite(mask_path, mask_array)
                mask_urls.append(f"/segmentation_results/{mask_filename}")
        
        # 保存可视化结果
        vis_filename = f"segmentation_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.jpg"
        vis_path = os.path.join(SEGMENTATION_FOLDER, vis_filename)
        cv2.imwrite(vis_path, overlay)
        
        return {
            'url': f"/segmentation_results/{vis_filename}",
            'mask_urls': mask_urls
        }
    
    except Exception as e:
        logger.error(f"创建可视化失败: {str(e)}")
        return {
            'url': '',
            'mask_urls': []
        }

def generate_segmentation_recommendations(observation_count, surgery_count, severity):
    """根据实例分割结果生成建议"""
    recommendations = []
    
    if surgery_count > 0:
        recommendations.extend([
            f'检测到{surgery_count}处需要手术治疗的病变区域',
            '建议尽快就医，进行详细检查',
            '可能需要考虑手术干预'
        ])
    
    if observation_count > 0:
        recommendations.extend([
            f'检测到{observation_count}处需要观察的病变区域',
            '建议定期复查，监测病变发展',
            '注意保持口腔卫生，避免刺激'
        ])
    
    # 根据严重程度添加额外建议
    severity_recommendations = {
        '轻度': [
            '病变程度较轻，可先采取保守治疗',
            '保持良好的口腔卫生习惯',
            '避免刺激性食物和饮料'
        ],
        '中度': [
            '病变已有一定进展，需密切关注',
            '考虑药物治疗控制炎症',
            '每3个月复查一次'
        ],
        '重度': [
            '病变严重，可能影响正常功能',
            '建议尽快手术治疗',
            '术后需要规律用药，预防复发'
        ]
    }
    
    if severity in severity_recommendations:
        recommendations.extend(severity_recommendations[severity])
    
    return recommendations[:5]  # 返回前5条建议

def save_detection_result(result, filename):
    """保存检测结果"""
    result_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # 保存到文件
    result_file = os.path.join(RESULTS_FOLDER, f'{result_id}.json')
    
    result_data = {
        'id': result_id,
        'filename': filename,
        'timestamp': datetime.now().isoformat(),
        'result': result
    }
    
    with open(result_file, 'w', encoding='utf-8') as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)
    
    return result_id

@app.route('/api/result/<result_id>', methods=['GET'])
def get_result(result_id):
    """获取检测结果"""
    try:
        result_file = os.path.join(RESULTS_FOLDER, f'{result_id}.json')
        
        if not os.path.exists(result_file):
            return jsonify({'error': '结果不存在'}), 404
        
        with open(result_file, 'r', encoding='utf-8') as f:
            result_data = json.load(f)
        
        return jsonify(result_data)
    
    except Exception as e:
        logger.error(f"获取结果错误: {str(e)}")
        return jsonify({'error': '获取结果失败'}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    """获取检测历史"""
    try:
        history = []
        
        if os.path.exists(RESULTS_FOLDER):
            for filename in os.listdir(RESULTS_FOLDER):
                if filename.endswith('.json'):
                    filepath = os.path.join(RESULTS_FOLDER, filename)
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        result = data.get('result', {})
                        history.append({
                            'id': data['id'],
                            'timestamp': data['timestamp'],
                            'disease_detected': result.get('disease_detected', False),
                            'severity': result.get('severity', '未知'),
                            'total_instances': result.get('total_instances', 0),
                            'observation_count': result.get('observation_count', 0),
                            'surgery_count': result.get('surgery_count', 0),
                            'confidence': result.get('confidence', 0)
                        })
        
        # 按时间排序
        history.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'success': True,
            'history': history[:50]  # 返回最近50条
        })
    
    except Exception as e:
        logger.error(f"获取历史错误: {str(e)}")
        return jsonify({'error': '获取历史失败'}), 500

@app.route('/api/export/<result_id>', methods=['GET'])
def export_report(result_id):
    """导出检测报告为PDF或图片"""
    try:
        format_type = request.args.get('format', 'pdf')
        
        # 获取检测结果
        result_file = os.path.join(RESULTS_FOLDER, f'{result_id}.json')
        if not os.path.exists(result_file):
            return jsonify({'error': '结果不存在'}), 404
        
        with open(result_file, 'r', encoding='utf-8') as f:
            result_data = json.load(f)
        
        # 生成报告
        if format_type == 'pdf':
            # TODO: 实现PDF生成
            return jsonify({'error': 'PDF导出功能开发中'}), 501
        else:
            # 生成图片报告
            report_image = generate_image_report(result_data)
            return send_file(report_image, mimetype='image/png')
    
    except Exception as e:
        logger.error(f"导出报告错误: {str(e)}")
        return jsonify({'error': '导出失败'}), 500

def generate_image_report(result_data):
    """生成图片格式的报告"""
    # 创建报告图片
    width, height = 800, 1200
    img = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(img)

    # 添加标题
    title = "明眸辨齿曲面断层口腔健康检测报告"
    draw.text((width//2 - 200, 50), title, fill='black')
    
    # 添加检测结果
    y_pos = 150
    result = result_data['result']
    
    lines = [
        f"检测时间: {result_data['timestamp']}",
        f"检测结果: {'发现病变' if result['disease_detected'] else '正常'}",
        f"病变数量: {result.get('total_instances', 0)}",
        f"观察病变: {result.get('observation_count', 0)}",
        f"手术病变: {result.get('surgery_count', 0)}",
        f"严重程度: {result.get('severity', '未知')}",
        f"置信度: {result.get('confidence', 0):.2%}"
    ]
    
    for line in lines:
        draw.text((50, y_pos), line, fill='black')
        y_pos += 40
    
    # 保存到BytesIO
    img_io = io.BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    
    return img_io

# BML-CodeLab专用配置
if __name__ == '__main__':
    # 获取BML平台分配的端口
    port = int(os.environ.get('PORT', 8080))
    
    # 打印启动信息
    logger.info(f"明眸辨齿曲面断层口腔健康智能筛查系统启动")
    logger.info(f"端口: {port}")
    
    if USE_LOCAL_MODEL:
        logger.info(f"使用本地模型模式")
        logger.info(f"模型路径: {MODEL_PATH}")
        logger.info(f"本地模型状态: {'可用' if local_inference is not None else '不可用'}")
    else:
        logger.info(f"使用远程API模式")
        logger.info(f"模型端点: {BML_MODEL_ENDPOINT if BML_MODEL_ENDPOINT else '未配置（使用模拟数据）'}")
    
    logger.info(f"支持类别: 观察、手术")
    
    # 在BML-CodeLab上运行
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False  # 生产环境关闭调试
    )