// VR图像配置文件
// 用于管理不同水库的VR场景

export const vrConfig = {
  // 默认VR图像设置
  defaultSettings: {
    quality: 'medium', // low, medium, high
    preloadEnabled: true,
    compressionEnabled: true,
    progressVisible: true,
    fallbackImage: '/vr-images/2.hdr' // 备用图像
  },

  // 图像质量配置
  qualitySettings: {
    low: {
      maxFileSize: '3MB',
      resolution: '2048x1024',
      compression: 0.7
    },
    medium: {
      maxFileSize: '8MB',
      resolution: '4096x2048',
      compression: 0.8
    },
    high: {
      maxFileSize: '15MB',
      resolution: '8192x4096',
      compression: 0.9
    }
  },

  // 水库VR场景配置
  reservoirScenes: {
    // 测试水库1 - 使用您指定的1234图像
    "测试水库1": {
      scenes: [{
          id: 0,
          name: "水库HDR全景",
          path: "/vr-images/1.hdr", // 1对应您的1234命名需求
          fileSize: "27MB",
          optimized: false, // 标记为需要优化
          hotspots: [{
              id: 1,
              position: {
                x: 0.6,
                y: 0,
                z: -0.8
              },
              targetScene: 1,
              title: "前往监测设施",
              icon: "🏭",
              teleportPosition: {
                x: 0,
                y: 0,
                z: -150
              }
            },
            {
              id: 2,
              position: {
                x: -0.7,
                y: 0.1,
                z: 0.6
              },
              targetScene: 0,
              title: "观景点",
              icon: "🌊",
              teleportPosition: {
                x: -100,
                y: 20,
                z: 80
              }
            },
            {
              id: 3,
              position: {
                x: 0,
                y: 0.3,
                z: 0.9
              },
              targetScene: 0,
              title: "高空视角",
              icon: "🦅",
              teleportPosition: {
                x: 0,
                y: 120,
                z: 200
              }
            }
          ]
        },
        {
          id: 1,
          name: "监测设施HDR",
          path: "/vr-images/2.hdr", // 2对应您的1234命名需求
          fileSize: "5.8MB",
          optimized: true,
          hotspots: [{
              id: 4,
              position: {
                x: 0,
                y: 0,
                z: -0.6
              },
              targetScene: 0,
              title: "返回水库",
              icon: "🏞️",
              teleportPosition: {
                x: 0,
                y: 0,
                z: 0
              }
            },
            {
              id: 5,
              position: {
                x: 0.8,
                y: -0.1,
                z: 0.3
              },
              targetScene: 1,
              title: "设备近景",
              icon: "⚙️",
              teleportPosition: {
                x: 150,
                y: -20,
                z: 50
              }
            },
            {
              id: 6,
              position: {
                x: -0.6,
                y: 0.2,
                z: -0.4
              },
              targetScene: 1,
              title: "控制室",
              icon: "🖥️",
              teleportPosition: {
                x: -100,
                y: 40,
                z: -80
              }
            }
          ]
        }
      ]
    },

    // 测试水库2
    "测试水库2": {
      scenes: [{
          id: 0,
          name: "水库HDR全景",
          path: "/vr-images/3.hdr", // 3对应您的1234命名需求
          fileSize: "6.3MB",
          optimized: true,
          hotspots: [{
            id: 1,
            position: {
              x: 0.5,
              y: 0.1,
              z: -0.9
            },
            targetScene: 1,
            title: "监测中心",
            icon: "🏢",
            teleportPosition: {
              x: 50,
              y: 10,
              z: -180
            }
          }]
        },
        {
          id: 1,
          name: "监测中心",
          path: "/vr-images/4.hdr", // 4对应您的1234命名需求
          fileSize: "7.2MB",
          optimized: true,
          hotspots: [{
            id: 2,
            position: {
              x: 0,
              y: 0,
              z: 0.8
            },
            targetScene: 0,
            title: "返回水库",
            icon: "🌊",
            teleportPosition: {
              x: 0,
              y: 0,
              z: 0
            }
          }]
        }
      ]
    },

    // 默认配置 - 其他测试水库使用
    "default": {
      scenes: [{
          id: 0,
          name: "水库HDR全景",
          path: "/vr-images/2.hdr", // 使用较小的文件作为默认
          fileSize: "5.8MB",
          optimized: true,
          hotspots: [{
            id: 1,
            position: {
              x: 0.6,
              y: 0,
              z: -0.8
            },
            targetScene: 1,
            title: "前往监测设施",
            icon: "🏭",
            teleportPosition: {
              x: 0,
              y: 0,
              z: -150
            }
          }]
        },
        {
          id: 1,
          name: "监测设施HDR",
          path: "/vr-images/3.hdr",
          fileSize: "6.3MB",
          optimized: true,
          hotspots: [{
            id: 2,
            position: {
              x: 0,
              y: 0,
              z: -0.6
            },
            targetScene: 0,
            title: "返回水库",
            icon: "🏞️",
            teleportPosition: {
              x: 0,
              y: 0,
              z: 0
            }
          }]
        }
      ]
    }
  },

  // 图像预加载配置
  preloadConfig: {
    enabled: true,
    maxConcurrent: 2, // 最多同时加载2个图像
    timeout: 30000, // 30秒超时
    retryCount: 3, // 重试3次
    chunkSize: 1024 * 1024 // 1MB chunks for progress
  },

  // 缓存配置
  cacheConfig: {
    enabled: true,
    maxSize: 100 * 1024 * 1024, // 100MB缓存
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    compressionEnabled: true
  }
};

// VR图像文件信息配置
const vrImageFiles = [{
    path: "/vr-images/1.hdr",
    fileSize: "27MB",
    optimized: false
  },
  {
    path: "/vr-images/2.hdr",
    fileSize: "5.8MB",
    optimized: true
  },
  {
    path: "/vr-images/3.hdr",
    fileSize: "6.3MB",
    optimized: true
  },
  {
    path: "/vr-images/4.hdr",
    fileSize: "7.2MB",
    optimized: true
  }
];

// 根据水库名称获取VR场景配置
export function getVRScenesForReservoir(reservoirName) {
  // 处理空字符串或未定义的情况
  if (!reservoirName || reservoirName.trim() === '') {
    console.warn('水库名称为空，使用默认配置');
    const config = vrConfig.reservoirScenes.default;
    return config.scenes;
  }

  // 如果是测试水库，按照1-2-3-4循环调用
  if (reservoirName.startsWith('测试水库')) {
    // 提取测试水库编号
    const numberMatch = reservoirName.match(/测试水库(\d+)/);
    const reservoirNumber = numberMatch ? parseInt(numberMatch[1]) : 1;

    // 如果没有数字（如"测试水库"），给一个随机编号避免都使用同一个
    const finalNumber = numberMatch ? reservoirNumber : Math.floor(Math.random() * 4) + 1;

    // 计算VR图像索引：1-2-3-4循环
    const imageIndex = (finalNumber - 1) % 4;
    const vrImage = vrImageFiles[imageIndex];

    console.log(`${reservoirName} (编号: ${finalNumber}) 使用VR图像: ${vrImage.path} (循环位置: ${imageIndex + 1})`);

    // 生成场景配置
    return [{
        id: 0,
        name: `${reservoirName} - HDR全景`,
        path: vrImage.path,
        fileSize: vrImage.fileSize,
        optimized: vrImage.optimized,
        hotspots: [{
            id: 1,
            position: {
              x: 0.6,
              y: 0,
              z: -0.8
            },
            targetScene: 1,
            title: "前往监测设施",
            icon: "🏭",
            teleportPosition: {
              x: 0,
              y: 0,
              z: -150
            }
          },
          {
            id: 2,
            position: {
              x: -0.7,
              y: 0.1,
              z: 0.6
            },
            targetScene: 0,
            title: "观景点",
            icon: "🌊",
            teleportPosition: {
              x: -100,
              y: 20,
              z: 80
            }
          },
          {
            id: 3,
            position: {
              x: 0,
              y: 0.3,
              z: 0.9
            },
            targetScene: 0,
            title: "高空视角",
            icon: "🦅",
            teleportPosition: {
              x: 0,
              y: 120,
              z: 200
            }
          }
        ]
      },
      {
        id: 1,
        name: `${reservoirName} - 监测设施`,
        path: vrImage.path, // 同一个水库使用相同的VR图像
        fileSize: vrImage.fileSize,
        optimized: vrImage.optimized,
        hotspots: [{
            id: 4,
            position: {
              x: 0,
              y: 0,
              z: -0.6
            },
            targetScene: 0,
            title: "返回水库",
            icon: "🏞️",
            teleportPosition: {
              x: 0,
              y: 0,
              z: 0
            }
          },
          {
            id: 5,
            position: {
              x: 0.8,
              y: -0.1,
              z: 0.3
            },
            targetScene: 1,
            title: "设备近景",
            icon: "⚙️",
            teleportPosition: {
              x: 150,
              y: -20,
              z: 50
            }
          },
          {
            id: 6,
            position: {
              x: -0.6,
              y: 0.2,
              z: -0.4
            },
            targetScene: 1,
            title: "控制室",
            icon: "🖥️",
            teleportPosition: {
              x: -100,
              y: 40,
              z: -80
            }
          }
        ]
      }
    ];
  }

  // 其他水库使用默认配置
  const config = vrConfig.reservoirScenes[reservoirName] || vrConfig.reservoirScenes.default;
  return config.scenes;
}

// 获取优化后的图像路径
export function getOptimizedImagePath(originalPath, quality = 'medium') {
  const qualitySettings = vrConfig.qualitySettings[quality];

  // 如果是大文件且未优化，建议压缩
  if (originalPath.includes('1.hdr')) {
    console.warn('检测到大文件1.hdr (27MB)，建议进行压缩优化');
  }

  return originalPath;
}

// 检查文件是否需要优化
export function isOptimizationNeeded(scene) {
  const fileSizeInMB = parseFloat(scene.fileSize);
  return fileSizeInMB > 10 || !scene.optimized;
}

// 获取预加载配置
export function getPreloadConfig() {
  return vrConfig.preloadConfig;
}

// 获取缓存配置
export function getCacheConfig() {
  return vrConfig.cacheConfig;
}

// 调试函数：测试VR资源循环分配
export function testVRResourceAllocation() {
  console.log('\n🔍 VR资源循环分配测试:');
  console.log('='.repeat(50));

  for (let i = 1; i <= 10; i++) {
    const reservoirName = `测试水库${i}`;
    const scenes = getVRScenesForReservoir(reservoirName);
    const vrImage = scenes[0].path;
    const imageNumber = vrImage.match(/\/vr-images\/(\d+)\.hdr/)[1];
    console.log(`${reservoirName} → ${vrImage} (VR图像${imageNumber})`);
  }

  console.log('\n📊 预期结果:');
  console.log('测试水库1,5,9... → 1.hdr');
  console.log('测试水库2,6,10... → 2.hdr');
  console.log('测试水库3,7,11... → 3.hdr');
  console.log('测试水库4,8,12... → 4.hdr');
  console.log('='.repeat(50));
}

// 在开发环境下提供全局调试函数
if (typeof window !== 'undefined') {
  window.testVRAllocation = testVRResourceAllocation;
}
