"""
BML-CodeLab本地模型推理模块
支持直接加载和调用本地训练的实例分割模型
"""

import os
import json
import numpy as np
from PIL import Image
import logging
import base64
import io
from typing import Dict, List, Optional, Tuple, Any

# 配置日志
logger = logging.getLogger(__name__)

# 尝试导入不同的深度学习框架
PADDLE_AVAILABLE = False
ONNX_AVAILABLE = False
TORCH_AVAILABLE = False

try:
    import paddle
    import paddle.inference as paddle_infer
    from paddledet.core.workspace import load_config
    from paddledet.engine import Trainer
    PADDLE_AVAILABLE = True
    logger.info("PaddlePaddle框架可用")
except ImportError:
    logger.warning("PaddlePaddle未安装，尝试其他框架")

try:
    import onnxruntime as ort
    ONNX_AVAILABLE = True
    logger.info("ONNX Runtime可用")
except ImportError:
    logger.warning("ONNX Runtime未安装")

try:
    import torch
    import torchvision
    TORCH_AVAILABLE = True
    logger.info("PyTorch框架可用")
except ImportError:
    logger.warning("PyTorch未安装")


class LocalModelInference:
    """本地模型推理类"""
    
    def __init__(self, model_path: str = None, config_path: str = None):
        """
        初始化本地模型
        
        Args:
            model_path: 模型文件路径（支持.pdparams, .onnx, .pth等）
            config_path: 模型配置文件路径
        """
        self.model_path = model_path or os.environ.get('MODEL_PATH', 'models/eye_pterygium_model')
        self.config_path = config_path or os.environ.get('MODEL_CONFIG', 'models/model_config.json')
        
        self.model = None
        self.predictor = None
        self.model_type = None
        self.config = self.load_config()
        
        # 类别映射
        self.classes = self.config.get('classes', ['观察', '手术'])
        self.num_classes = len(self.classes)
        
        # 模型参数
        self.input_size = tuple(self.config.get('input_size', [512, 512]))
        self.confidence_threshold = self.config.get('confidence_threshold', 0.5)
        self.nms_threshold = self.config.get('nms_threshold', 0.5)
        
        # 加载模型
        self.load_model()
    
    def load_config(self) -> Dict:
        """加载模型配置文件"""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"加载配置文件失败: {e}")
        
        # 默认配置
        return {
            'model_type': 'instance_segmentation',
            'framework': 'paddle',
            'classes': ['观察', '手术'],
            'input_size': [512, 512],
            'confidence_threshold': 0.5,
            'nms_threshold': 0.5,
            'mean': [0.485, 0.456, 0.406],
            'std': [0.229, 0.224, 0.225]
        }
    
    def load_model(self):
        """根据可用框架加载模型"""
        framework = self.config.get('framework', 'auto')
        
        if framework == 'auto':
            # 自动检测可用框架
            if PADDLE_AVAILABLE and self._check_paddle_model():
                self._load_paddle_model()
            elif ONNX_AVAILABLE and self._check_onnx_model():
                self._load_onnx_model()
            elif TORCH_AVAILABLE and self._check_torch_model():
                self._load_torch_model()
            else:
                logger.warning("未找到可用的模型文件或框架")
                self.model_type = 'mock'
        else:
            # 指定框架加载
            if framework == 'paddle' and PADDLE_AVAILABLE:
                self._load_paddle_model()
            elif framework == 'onnx' and ONNX_AVAILABLE:
                self._load_onnx_model()
            elif framework == 'torch' and TORCH_AVAILABLE:
                self._load_torch_model()
            else:
                logger.error(f"指定的框架 {framework} 不可用")
                self.model_type = 'mock'
    
    def _check_paddle_model(self) -> bool:
        """检查PaddlePaddle模型文件是否存在"""
        model_file = f"{self.model_path}.pdparams"
        return os.path.exists(model_file)
    
    def _check_onnx_model(self) -> bool:
        """检查ONNX模型文件是否存在"""
        model_file = f"{self.model_path}.onnx"
        return os.path.exists(model_file)
    
    def _check_torch_model(self) -> bool:
        """检查PyTorch模型文件是否存在"""
        model_file = f"{self.model_path}.pth"
        return os.path.exists(model_file)
    
    def _load_paddle_model(self):
        """加载PaddlePaddle模型"""
        try:
            # 使用Paddle Inference API
            model_file = f"{self.model_path}.pdmodel"
            params_file = f"{self.model_path}.pdiparams"
            
            if os.path.exists(model_file) and os.path.exists(params_file):
                # 创建配置
                config = paddle_infer.Config(model_file, params_file)
                
                # 启用GPU（如果可用）
                if paddle.is_compiled_with_cuda():
                    config.enable_use_gpu(1000, 0)
                else:
                    config.enable_mkldnn()
                    config.set_cpu_math_library_num_threads(4)
                
                # 创建预测器
                self.predictor = paddle_infer.create_predictor(config)
                self.model_type = 'paddle'
                logger.info("成功加载PaddlePaddle模型")
            else:
                logger.error(f"PaddlePaddle模型文件不存在: {model_file}, {params_file}")
                self.model_type = 'mock'
                
        except Exception as e:
            logger.error(f"加载PaddlePaddle模型失败: {e}")
            self.model_type = 'mock'
    
    def _load_onnx_model(self):
        """加载ONNX模型"""
        try:
            model_file = f"{self.model_path}.onnx"
            
            # 创建ONNX Runtime会话
            providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
            self.predictor = ort.InferenceSession(model_file, providers=providers)
            self.model_type = 'onnx'
            logger.info("成功加载ONNX模型")
            
        except Exception as e:
            logger.error(f"加载ONNX模型失败: {e}")
            self.model_type = 'mock'
    
    def _load_torch_model(self):
        """加载PyTorch模型"""
        try:
            model_file = f"{self.model_path}.pth"
            
            # 加载模型权重
            device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            
            # 这里需要根据实际模型架构创建模型
            # 示例：使用torchvision的Mask R-CNN
            from torchvision.models.detection import maskrcnn_resnet50_fpn
            
            self.model = maskrcnn_resnet50_fpn(num_classes=self.num_classes + 1)
            checkpoint = torch.load(model_file, map_location=device)
            self.model.load_state_dict(checkpoint)
            self.model.to(device)
            self.model.eval()
            
            self.model_type = 'torch'
            self.device = device
            logger.info("成功加载PyTorch模型")
            
        except Exception as e:
            logger.error(f"加载PyTorch模型失败: {e}")
            self.model_type = 'mock'
    
    def preprocess_image(self, image: Image.Image) -> np.ndarray:
        """预处理图像"""
        # 调整尺寸
        image = image.resize(self.input_size, Image.Resampling.LANCZOS)
        
        # 转换为numpy数组
        img_array = np.array(image).astype(np.float32)
        
        # 归一化
        img_array = img_array / 255.0
        
        # 标准化（如果配置中有）
        mean = self.config.get('mean', [0.485, 0.456, 0.406])
        std = self.config.get('std', [0.229, 0.224, 0.225])
        
        for i in range(3):
            img_array[:, :, i] = (img_array[:, :, i] - mean[i]) / std[i]
        
        # 转换维度 HWC -> CHW
        img_array = img_array.transpose(2, 0, 1)
        
        # 添加batch维度
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    
    def predict(self, image: Image.Image) -> Dict:
        """
        执行模型推理
        
        Args:
            image: PIL图像对象
            
        Returns:
            推理结果字典
        """
        if self.model_type == 'paddle':
            return self._predict_paddle(image)
        elif self.model_type == 'onnx':
            return self._predict_onnx(image)
        elif self.model_type == 'torch':
            return self._predict_torch(image)
        else:
            return self._predict_mock(image)
    
    def _predict_paddle(self, image: Image.Image) -> Dict:
        """使用PaddlePaddle模型推理"""
        try:
            # 预处理
            img_array = self.preprocess_image(image)
            
            # 获取输入输出名称
            input_names = self.predictor.get_input_names()
            output_names = self.predictor.get_output_names()
            
            # 设置输入
            input_handle = self.predictor.get_input_handle(input_names[0])
            input_handle.reshape([1, 3, self.input_size[0], self.input_size[1]])
            input_handle.copy_from_cpu(img_array)
            
            # 执行推理
            self.predictor.run()
            
            # 获取输出
            results = {}
            for output_name in output_names:
                output_handle = self.predictor.get_output_handle(output_name)
                results[output_name] = output_handle.copy_to_cpu()
            
            # 解析结果
            return self._parse_results(results, image.size)
            
        except Exception as e:
            logger.error(f"PaddlePaddle推理失败: {e}")
            return self._predict_mock(image)
    
    def _predict_onnx(self, image: Image.Image) -> Dict:
        """使用ONNX模型推理"""
        try:
            # 预处理
            img_array = self.preprocess_image(image)
            
            # 获取输入名称
            input_name = self.predictor.get_inputs()[0].name
            
            # 执行推理
            outputs = self.predictor.run(None, {input_name: img_array})
            
            # 解析结果
            results = {
                'boxes': outputs[0] if len(outputs) > 0 else None,
                'labels': outputs[1] if len(outputs) > 1 else None,
                'scores': outputs[2] if len(outputs) > 2 else None,
                'masks': outputs[3] if len(outputs) > 3 else None
            }
            
            return self._parse_results(results, image.size)
            
        except Exception as e:
            logger.error(f"ONNX推理失败: {e}")
            return self._predict_mock(image)
    
    def _predict_torch(self, image: Image.Image) -> Dict:
        """使用PyTorch模型推理"""
        try:
            import torch
            from torchvision import transforms
            
            # 预处理
            transform = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=self.config.get('mean', [0.485, 0.456, 0.406]),
                    std=self.config.get('std', [0.229, 0.224, 0.225])
                )
            ])
            
            img_tensor = transform(image).unsqueeze(0).to(self.device)
            
            # 推理
            with torch.no_grad():
                outputs = self.model(img_tensor)
            
            # 解析结果
            if len(outputs) > 0:
                output = outputs[0]
                results = {
                    'boxes': output['boxes'].cpu().numpy() if 'boxes' in output else None,
                    'labels': output['labels'].cpu().numpy() if 'labels' in output else None,
                    'scores': output['scores'].cpu().numpy() if 'scores' in output else None,
                    'masks': output['masks'].cpu().numpy() if 'masks' in output else None
                }
                return self._parse_results(results, image.size)
            
            return self._get_empty_result()
            
        except Exception as e:
            logger.error(f"PyTorch推理失败: {e}")
            return self._predict_mock(image)
    
    def _predict_mock(self, image: Image.Image) -> Dict:
        """模拟推理（用于测试）"""
        import random
        
        num_instances = random.randint(0, 3)
        
        if num_instances == 0:
            return self._get_empty_result()
        
        instances = []
        for i in range(num_instances):
            category = random.choice(self.classes)
            confidence = random.uniform(0.7, 0.99)
            
            # 生成随机边界框
            x1 = random.uniform(0.1, 0.4) * image.width
            y1 = random.uniform(0.1, 0.4) * image.height
            x2 = random.uniform(0.5, 0.9) * image.width
            y2 = random.uniform(0.5, 0.9) * image.height
            
            # 生成模拟掩码
            mask = np.zeros((image.height, image.width), dtype=np.uint8)
            mask[int(y1):int(y2), int(x1):int(x2)] = 255
            
            instances.append({
                'category': category,
                'score': confidence,
                'bbox': [x1, y1, x2, y2],
                'mask': self._encode_mask(mask),
                'area': (x2 - x1) * (y2 - y1)
            })
        
        return {'results': instances}
    
    def _parse_results(self, raw_results: Dict, original_size: Tuple[int, int]) -> Dict:
        """解析模型输出结果"""
        instances = []
        
        # 获取各项输出
        boxes = raw_results.get('boxes', [])
        labels = raw_results.get('labels', [])
        scores = raw_results.get('scores', [])
        masks = raw_results.get('masks', [])
        
        # 过滤低置信度结果
        valid_indices = []
        if isinstance(scores, np.ndarray):
            valid_indices = np.where(scores > self.confidence_threshold)[0]
        
        for idx in valid_indices:
            try:
                # 获取类别
                label_idx = int(labels[idx]) if idx < len(labels) else 0
                category = self.classes[label_idx] if label_idx < len(self.classes) else '未知'
                
                # 获取边界框
                box = boxes[idx] if idx < len(boxes) else [0, 0, 100, 100]
                
                # 缩放到原始图像尺寸
                scale_x = original_size[0] / self.input_size[0]
                scale_y = original_size[1] / self.input_size[1]
                
                bbox = [
                    float(box[0] * scale_x),
                    float(box[1] * scale_y),
                    float(box[2] * scale_x),
                    float(box[3] * scale_y)
                ]
                
                # 处理掩码
                mask_encoded = None
                if masks is not None and idx < len(masks):
                    mask = masks[idx]
                    # 如果是多维数组，取第一个通道
                    if len(mask.shape) > 2:
                        mask = mask[0]
                    # 缩放掩码到原始尺寸
                    mask_resized = self._resize_mask(mask, original_size)
                    mask_encoded = self._encode_mask(mask_resized)
                
                instances.append({
                    'category': category,
                    'score': float(scores[idx]) if idx < len(scores) else 0.5,
                    'bbox': bbox,
                    'mask': mask_encoded,
                    'area': (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
                })
                
            except Exception as e:
                logger.error(f"解析第{idx}个实例失败: {e}")
                continue
        
        return {'results': instances}
    
    def _resize_mask(self, mask: np.ndarray, target_size: Tuple[int, int]) -> np.ndarray:
        """调整掩码尺寸"""
        from PIL import Image
        
        # 转换为PIL图像
        mask_img = Image.fromarray((mask * 255).astype(np.uint8))
        
        # 调整尺寸
        mask_resized = mask_img.resize(target_size, Image.Resampling.NEAREST)
        
        return np.array(mask_resized)
    
    def _encode_mask(self, mask: np.ndarray) -> str:
        """将掩码编码为base64字符串"""
        # 转换为PIL图像
        mask_img = Image.fromarray(mask.astype(np.uint8))
        
        # 编码为base64
        buffer = io.BytesIO()
        mask_img.save(buffer, format='PNG')
        mask_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return mask_base64
    
    def _get_empty_result(self) -> Dict:
        """返回空结果"""
        return {'results': []}
    
    def get_model_info(self) -> Dict:
        """获取模型信息"""
        return {
            'model_type': self.model_type,
            'framework': self.config.get('framework', 'unknown'),
            'classes': self.classes,
            'num_classes': self.num_classes,
            'input_size': self.input_size,
            'confidence_threshold': self.confidence_threshold,
            'nms_threshold': self.nms_threshold,
            'status': 'loaded' if self.model_type != 'mock' else 'mock'
        }


# 全局模型实例
_model_instance = None


def get_model_instance(model_path: str = None, config_path: str = None) -> LocalModelInference:
    """获取模型单例"""
    global _model_instance
    if _model_instance is None:
        _model_instance = LocalModelInference(model_path, config_path)
    return _model_instance


def predict_image(image: Image.Image, model_path: str = None) -> Dict:
    """
    便捷的预测接口
    
    Args:
        image: PIL图像对象
        model_path: 可选的模型路径
        
    Returns:
        预测结果字典
    """
    model = get_model_instance(model_path)
    return model.predict(image)