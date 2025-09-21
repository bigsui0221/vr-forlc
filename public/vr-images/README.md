# VR全景图资源指南

## 🌍 免费全景图资源网站

### 1. **Poly Haven** (推荐 ⭐⭐⭐⭐⭐)
- **网址**: https://polyhaven.com/hdris
- **特点**: 高质量免费HDRI环境贴图，支持CC0协议
- **格式**: HDR, EXR格式，需要转换为JPG
- **分辨率**: 1K-16K多种选择
- **用途**: 专业级环境贴图，质量极高

### 2. **HDRi Haven** (推荐 ⭐⭐⭐⭐⭐)
- **网址**: https://hdrihaven.com/
- **特点**: 免费CC0授权，无需注册
- **格式**: HDR, EXR格式
- **分辨率**: 最高8K分辨率
- **用途**: 室外环境、自然景观

### 3. **360Cities** (推荐 ⭐⭐⭐⭐)
- **网址**: https://www.360cities.net/
- **特点**: 世界各地城市全景，部分免费
- **格式**: JPG等角投影格式
- **分辨率**: 2K-8K
- **用途**: 城市景观、建筑物内外景

### 4. **Ricoh Theta 360.org** (推荐 ⭐⭐⭐)
- **网址**: https://theta360.com/
- **特点**: 用户上传的360度照片
- **格式**: JPG格式
- **分辨率**: 2K-4K
- **用途**: 生活场景、室内外景观

### 5. **Google Street View** (推荐 ⭐⭐⭐)
- **网址**: https://www.google.com/streetview/
- **特点**: 全球街景，可截取使用
- **格式**: 需要特殊工具下载
- **分辨率**: 2K-4K
- **用途**: 街景、城市景观

### 6. **Flickr 360°** (推荐 ⭐⭐⭐)
- **网址**: https://www.flickr.com/groups/equirectangular/
- **特点**: 摄影师分享的全景照片
- **格式**: JPG等角投影
- **分辨率**: 2K-8K
- **用途**: 自然风光、旅游景点

## 📥 下载和使用指南

### 推荐下载的图片类型

#### 🏞️ 水库相关场景
1. **湖泊水景**: 搜索"lake panorama"、"reservoir 360"
2. **水坝设施**: 搜索"dam panorama"、"hydroelectric 360"  
3. **监测站**: 搜索"industrial facility 360"、"control room panorama"

#### 🏭 工业设施场景
1. **控制室**: 搜索"control room 360"、"monitoring station"
2. **机房设备**: 搜索"server room panorama"、"equipment room 360"
3. **管道系统**: 搜索"pipeline panorama"、"utility room 360"

### 📱 使用方法

1. **下载全景图片**
   ```bash
   # 在项目中创建VR图片目录
   mkdir public/vr-images
   ```

2. **图片命名规范**
   ```
   public/vr-images/
   ├── reservoir-panorama.jpg     # 水库全景
   ├── facility-control.jpg       # 监测设施
   ├── pipeline-network.jpg       # 管网枢纽
   ├── dam-overview.jpg           # 大坝概览
   └── monitoring-station.jpg     # 监测站
   ```

3. **修改VRViewer.vue中的图片路径**
   ```javascript
   const scenes = [
     {
       name: '水库全景',
       panorama: '/vr-images/reservoir-panorama.jpg'
     },
     {
       name: '监测设施', 
       panorama: '/vr-images/facility-control.jpg'
     },
     {
       name: '管网枢纽',
       panorama: '/vr-images/pipeline-network.jpg'
     }
   ]
   ```

## 🎨 图片要求

### 技术规格
- **格式**: JPG, PNG
- **投影方式**: 等角投影 (Equirectangular)
- **长宽比**: 2:1 (如2048x1024, 4096x2048)
- **分辨率**: 建议2K以上 (2048x1024最低)
- **文件大小**: 建议2-10MB以内

### 质量建议
- **亮度**: 避免过暗或过亮的图片
- **清晰度**: 选择高清无模糊的图片
- **色彩**: 色彩饱和度适中，符合实际场景
- **内容**: 避免包含版权保护的内容

## 🔧 格式转换工具

如果下载的是HDR/EXR格式，需要转换为JPG：

### 在线转换工具
1. **HDR to JPG Converter**: https://convertio.co/hdr-jpg/
2. **Online HDR Converter**: https://www.aconvert.com/image/hdr-to-jpg/

### 本地转换工具
1. **GIMP** (免费): 支持HDR导入和JPG导出
2. **Photoshop**: 专业HDR处理
3. **ImageMagick**: 命令行批量转换

## 💡 使用建议

1. **预览测试**: 下载后先在VR查看器中测试效果
2. **多场景**: 准备3-5个不同角度的全景图
3. **命名清晰**: 使用有意义的文件名便于管理
4. **定期更新**: 根据项目需求更新全景图内容
5. **性能优化**: 根据网络情况调整图片质量

---

**💡 提示**: 优先推荐使用Poly Haven和HDRi Haven，质量最高且完全免费！ 