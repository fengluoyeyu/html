@echo off
echo ========================================
echo 调整测试图片尺寸
echo ========================================
echo.
echo 该脚本将调整 test_images 文件夹中的图片
echo 调整为 640x640 像素（模型输入尺寸）
echo.
pause

python resize_test_images.py

echo.
echo 处理完成！
echo.
echo 如果要使用调整后的图片：
echo 1. 进入 test_images_resized 文件夹
echo 2. 将图片复制回 test_images 文件夹
echo.
pause