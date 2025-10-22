# 明眸辨齿 - 曲面断层口腔健康智能筛查系统

基于多模型融合的口腔健康AI检测系统，提供牙齿分割与疾病识别功能。

## 📋 项目介绍

- **系统名称**: 明眸辨齿
- **团队**: AI智齿卫团队
- **功能**: 曲面断层牙齿分割与牙齿疾病识别

## 🚀 快速开始

### 在线访问

网站已部署在 Netlify，可以直接访问：
- 主页：`/index.html`
- 系统介绍：`/pages/intro.html`
- AI检测：`/pages/detection.html`
- 设备监控：`/pages/device-monitor.html`

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/fengluoyeyu/html.git
cd html

# 使用任何静态服务器运行
# 方法1: Python
python -m http.server 8000

# 方法2: Node.js
npx serve .

# 方法3: PHP
php -S localhost:8000
```

然后访问 `http://localhost:8000`

## 📱 移动端支持

网站已完全适配移动端：
- 响应式布局
- 汉堡菜单导航
- 触摸友好的按钮和表单
- 优化的移动端排版

## 🛠️ 部署到 Netlify

### 方法1: 通过 Git（推荐）

1. Fork或克隆此仓库到你的GitHub账号
2. 登录 [Netlify](https://netlify.com)
3. 点击 "Add new site" → "Import an existing project"
4. 选择 GitHub 并授权
5. 选择此仓库
6. 配置构建设置：
   - **Base directory**: 留空
   - **Build command**: 留空
   - **Publish directory**: `.`（根目录）
7. 点击 "Deploy site"

### 方法2: 拖放部署

1. 打包项目目录为 zip 文件
2. 登录 [Netlify](https://netlify.com)
3. 直接将 zip 文件拖放到部署区域

## 📂 项目结构

```
nurou/
├── index.html              # 主页
├── pages/                  # 其他页面
│   ├── intro.html         # 系统介绍
│   ├── detection.html     # AI检测
│   ├── admin.html         # 系统管理
│   └── device-monitor.html # 设备监控
├── css/                    # 样式文件
│   ├── minimal-style.css  # 主样式
│   ├── mobile-responsive.css # 移动端样式
│   └── ...
├── js/                     # JavaScript文件
│   ├── mobile-nav.js      # 移动端导航
│   ├── detection-test.js  # 检测功能
│   └── ...
├── images/                 # 图片资源
├── test_images/            # 测试图片（输入）
├── test_fenge/             # 分割结果图
├── test_shibie/            # 识别结果图
├── netlify.toml           # Netlify配置
└── README.md              # 项目说明
```

## 🎨 功能特性

### 主页
- 响应式英雄区
- 核心价值展示
- 团队介绍

### AI检测页面
- 图片上传与预览
- 测试图片快速选择
- 实时检测结果展示
- 牙齿分割可视化
- 疾病识别展示
- 病理报告生成

### 系统介绍
- 系统概述
- 技术架构
- 模型介绍

### 设备监控
- 系统状态监控
- 设备信息展示

## 🔧 技术栈

- **前端框架**: 原生 HTML/CSS/JavaScript
- **样式**: CSS3 + Flexbox + Grid
- **图标**: Font Awesome 6.4.0
- **部署**: Netlify

## ⚙️ 配置说明

### Netlify 配置

项目已包含 `netlify.toml` 配置文件，包括：
- 发布目录设置
- 重定向规则
- 安全头部
- 缓存策略

### 移动端优化

移动端响应式断点：
- 桌面端: > 1024px
- 平板: 768px - 1024px
- 手机: < 768px
- 小屏手机: < 480px

## 📝 注意事项

### 后端功能

- `app.py` 是Python后端，Netlify静态托管不支持
- 当前系统使用**离线模式**，直接加载预设的检测结果图片
- 如需真实AI检测功能，需要：
  - 使用 Netlify Functions（Serverless）
  - 或部署到支持Python的平台（Heroku、Railway、Render等）

### 测试图片

测试图片映射关系：
- `test_images/1.png` → 分割: `test_fenge/1.jpg` + 识别: `test_shibie/1.jpg`
- `test_images/2.png` → 分割: `test_fenge/2.jpg` + 识别: `test_shibie/2.jpg`
- `test_images/3.png` → 分割: `test_fenge/3.jpg` + 识别: `test_shibie/3.jpg`
- `test_images/4.png` → 分割: `test_fenge/4.jpg` + 识别: `test_shibie/4.jpg`

## 📞 联系方式

- 项目作者: AI智齿卫团队
- GitHub: https://github.com/fengluoyeyu/html

## 📄 许可证

本项目仅供学习和展示使用。

---

**🤖 Generated with Claude Code**
