# VR全景图片资源

## 当前使用的测试图片

### 在线图片源
- **主要全景图**: https://photo-sphere-viewer.js.org/assets/demo.jpg
  - 分辨率: 2048x1024
  - 类型: 等角投影全景图
  - 用途: 水库全景、监测设施、管网枢纽演示

## 本地图片存放规则

如需添加本地全景图片，请将图片放置在 `public/vr-images/` 目录下：

```
public/
├── vr-images/
│   ├── reservoir-1-panorama.jpg  # 水库1全景
│   ├── reservoir-1-facility.jpg  # 水库1监测设施
│   ├── reservoir-1-pipeline.jpg  # 水库1管网枢纽
│   └── ...
```

## 图片要求

- **格式**: JPG/PNG
- **分辨率**: 建议2048x1024或更高
- **投影方式**: 等角投影(Equirectangular)
- **文件大小**: 建议控制在2MB以内以确保加载速度

## 使用方法

在VRViewer.vue组件中修改scenes数组：

```javascript
const scenes = [
  {
    name: '水库全景',
    panorama: '/vr-images/reservoir-panorama.jpg'
  },
  // ...
]
``` 