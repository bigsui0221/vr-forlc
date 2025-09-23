#!/usr/bin/env node

/**
 * VR图像优化脚本
 * 用于压缩和优化HDR文件以提高加载速度
 */

const fs = require('fs');
const path = require('path');

// 配置选项
const config = {
  inputDir: './public/vr-images',
  outputDir: './public/vr-images/optimized',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  targetFileSize: 8 * 1024 * 1024, // 8MB
  compressionQuality: 0.8,
  supportedFormats: ['.hdr', '.exr']
};

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 分析VR图像文件
function analyzeVRImages() {
  log('\n🔍 分析VR图像文件...', 'cyan');

  if (!fs.existsSync(config.inputDir)) {
    log('❌ VR图像目录不存在: ' + config.inputDir, 'red');
    return [];
  }

  const files = fs.readdirSync(config.inputDir);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return config.supportedFormats.includes(ext);
  });

  const analysis = imageFiles.map(file => {
    const filePath = path.join(config.inputDir, file);
    const stats = fs.statSync(filePath);
    const size = stats.size;

    return {
      name: file,
      path: filePath,
      size: size,
      formattedSize: formatFileSize(size),
      needsOptimization: size > config.maxFileSize,
      compressionRatio: size > config.targetFileSize ?
        ((size - config.targetFileSize) / size * 100).toFixed(1) : 0
    };
  });

  // 显示分析结果
  log('\n📊 VR图像分析结果:', 'blue');
  log('='.repeat(80), 'blue');

  analysis.forEach((file, index) => {
    const status = file.needsOptimization ?
      `${colors.red}需要优化${colors.reset}` :
      `${colors.green}已优化${colors.reset}`;

    log(`${index + 1}. ${file.name}`);
    log(`   大小: ${file.formattedSize} | 状态: ${status}`);

    if (file.needsOptimization) {
      log(`   建议压缩: ${file.compressionRatio}%`, 'yellow');
    }
    log('');
  });

  const totalSize = analysis.reduce((sum, file) => sum + file.size, 0);
  const needOptimization = analysis.filter(file => file.needsOptimization);

  log('📈 统计信息:', 'cyan');
  log(`   总文件数: ${analysis.length}`);
  log(`   总大小: ${formatFileSize(totalSize)}`);
  log(`   需要优化: ${needOptimization.length} 个文件`);

  if (needOptimization.length > 0) {
    const potentialSavings = needOptimization.reduce((sum, file) =>
      sum + (file.size - config.targetFileSize), 0);
    log(`   可节省空间: ${formatFileSize(potentialSavings)}`, 'green');
  }

  return analysis;
}

// 生成优化建议
function generateOptimizationSuggestions(analysis) {
  log('\n💡 优化建议:', 'yellow');
  log('='.repeat(80), 'yellow');

  const needOptimization = analysis.filter(file => file.needsOptimization);

  if (needOptimization.length === 0) {
    log('✅ 所有VR图像文件都已经过优化！', 'green');
    return;
  }

  log('🔧 推荐的优化步骤:', 'cyan');
  log('');

  // 1. 压缩工具推荐
  log('1️⃣ 使用图像压缩工具:', 'blue');
  log('   在线工具:');
  log('   • HDR Compressor: https://convertio.co/hdr-jpg/');
  log('   • Online HDR Converter: https://www.aconvert.com/image/');
  log('');
  log('   离线工具:');
  log('   • ImageMagick: magick convert input.hdr -quality 80 output.hdr');
  log('   • GIMP: 导入HDR → 调整质量 → 导出');
  log('   • Photoshop: HDR Toning → 保存为Web格式');
  log('');

  // 2. 具体文件建议
  log('2️⃣ 具体文件优化建议:', 'blue');
  needOptimization.forEach((file, index) => {
    log(`   ${file.name}:`);
    log(`   • 当前大小: ${file.formattedSize}`);
    log(`   • 目标大小: ${formatFileSize(config.targetFileSize)}`);
    log(`   • 建议压缩比: ${file.compressionRatio}%`);

    if (file.size > 20 * 1024 * 1024) { // > 20MB
      log(`   • ⚠️  文件过大，建议转换为JPG格式`, 'yellow');
    }
    log('');
  });

  // 3. 替代方案
  log('3️⃣ 性能优化替代方案:', 'blue');
  log('   • 使用JPG格式替代HDR（质量稍微降低，但大幅减小文件大小）');
  log('   • 实施渐进式加载（先加载低质量版本，再加载高质量版本）');
  log('   • 使用WebP格式（现代浏览器支持，压缩率更高）');
  log('   • 启用CDN加速（将图像托管到CDN服务）');
  log('');

  // 4. 代码优化建议
  log('4️⃣ 代码级别优化:', 'blue');
  log('   • 启用图像预加载缓存（已实现 ✅）');
  log('   • 添加加载进度显示（已实现 ✅）');
  log('   • 实现错误重试机制（已实现 ✅）');
  log('   • 使用备用图像降级（已实现 ✅）');
  log('');
}

// 创建优化配置文件
function createOptimizationConfig(analysis) {
  const optimizationConfig = {
    timestamp: new Date().toISOString(),
    totalFiles: analysis.length,
    needOptimization: analysis.filter(f => f.needsOptimization).length,
    recommendations: analysis.map(file => ({
      filename: file.name,
      currentSize: file.formattedSize,
      needsOptimization: file.needsOptimization,
      targetCompression: file.compressionRatio + '%',
      priority: file.size > 20 * 1024 * 1024 ? 'high' : file.size > 10 * 1024 * 1024 ? 'medium' : 'low'
    })),
    optimizationSteps: [
      '1. 使用ImageMagick或在线工具压缩HDR文件',
      '2. 考虑转换为JPG格式以获得更好的性能',
      '3. 测试压缩后的文件在VR查看器中的效果',
      '4. 更新vrConfig.js中的文件大小信息'
    ]
  };

  const configPath = path.join(config.inputDir, 'optimization-report.json');
  fs.writeFileSync(configPath, JSON.stringify(optimizationConfig, null, 2));

  log(`📄 优化报告已保存到: ${configPath}`, 'green');
}

// 生成优化后的图像路径映射
function generateImageMapping(analysis) {
  log('\n🗺️ 生成图像映射配置...', 'cyan');

  const mapping = {
    original: {},
    optimized: {},
    fallback: '/vr-images/2.hdr' // 使用最小的文件作为备用
  };

  analysis.forEach(file => {
    const baseName = path.basename(file.name, path.extname(file.name));
    mapping.original[baseName] = `/vr-images/${file.name}`;

    if (file.needsOptimization) {
      mapping.optimized[baseName] = `/vr-images/optimized/${file.name}`;
    } else {
      mapping.optimized[baseName] = `/vr-images/${file.name}`;
    }
  });

  const mappingPath = path.join(config.inputDir, 'image-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));

  log(`📄 图像映射已保存到: ${mappingPath}`, 'green');

  // 显示映射信息
  log('\n📋 当前图像映射:', 'blue');
  Object.keys(mapping.original).forEach(key => {
    log(`   ${key}: ${mapping.original[key]}`);
    if (mapping.optimized[key] !== mapping.original[key]) {
      log(`   → 优化版本: ${mapping.optimized[key]}`, 'green');
    }
  });
}

// 主函数
function main() {
  log('🚀 VR图像优化工具', 'cyan');
  log('='.repeat(80), 'cyan');

  try {
    // 分析现有图像
    const analysis = analyzeVRImages();

    if (analysis.length === 0) {
      log('❌ 未找到VR图像文件', 'red');
      return;
    }

    // 生成优化建议
    generateOptimizationSuggestions(analysis);

    // 创建优化报告
    createOptimizationConfig(analysis);

    // 生成图像映射
    generateImageMapping(analysis);

    log('\n✅ 分析完成！', 'green');
    log('💡 请根据上述建议优化您的VR图像文件', 'yellow');

  } catch (error) {
    log('❌ 发生错误: ' + error.message, 'red');
    console.error(error);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  analyzeVRImages,
  generateOptimizationSuggestions,
  config
};
