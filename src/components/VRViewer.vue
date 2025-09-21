<template>
  <div v-if="isVisible" class="vr-viewer-overlay">
    <div class="vr-container">
      <div class="vr-header">
        <h3>🥽 {{ reservoirName }} - VR实地查看</h3>
        <button class="vr-close-btn" @click="closeViewer">✕</button>
      </div>

      <div class="vr-content">
        <div id="vr-viewer" class="vr-viewer"></div>

        <div class="vr-controls">
          <div class="vr-info">
            <div class="info-item">
              <span class="info-label">视角模式:</span>
              <span class="info-value">360°全景</span>
            </div>
            <div class="info-item">
              <span class="info-label">拍摄时间:</span>
              <span class="info-value">{{ captureTime }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">分辨率:</span>
              <span class="info-value">4K高清</span>
            </div>
          </div>

          <!-- 箭头键控制说明 -->
          <div class="vr-keyboard-hints">
            <div class="keyboard-title">🎮 键盘控制</div>
            <div class="keyboard-controls">
              <div class="key-hint">
                <span class="key-icon">↑</span>
                <span class="key-desc">向上看</span>
              </div>
              <div class="key-hint">
                <span class="key-icon">↓</span>
                <span class="key-desc">向下看</span>
              </div>
              <div class="key-hint">
                <span class="key-icon">←</span>
                <span class="key-desc">向左转</span>
              </div>
              <div class="key-hint">
                <span class="key-icon">→</span>
                <span class="key-desc">向右转</span>
              </div>
            </div>
          </div>

          <!-- 点击移动交互说明 -->
          <div class="vr-interaction-hints">
            <div class="interaction-title">👆 鼠标交互</div>
            <div class="interaction-item">
              <span class="interaction-icon">🖱️</span>
              <span class="interaction-desc">点击场景任意位置移动视角</span>
            </div>
          </div>

          <div class="vr-actions">
            <button class="vr-action-btn" @click="switchScene(0)">
              🏞️ 水库全景
            </button>
            <button class="vr-action-btn" @click="switchScene(1)">
              🏭 监测设施
            </button>
            <button class="vr-action-btn" @click="switchScene(2)">
              🚰 管网枢纽
            </button>
            <button
              class="vr-action-btn fullscreen-btn"
              @click="toggleFullscreen"
            >
              {{ isFullscreen ? "🔳 退出全屏" : "⛶ 全屏查看" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { Viewer } from "photo-sphere-viewer";

// Props
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  reservoirName: {
    type: String,
    default: "测试水库",
  },
});

// Emits
const emit = defineEmits(["close"]);

// 响应式数据
const captureTime = ref("2024年9月20日 14:30");
const isFullscreen = ref(false);
let viewer = null;

// 键盘控制参数
const ROTATION_SPEED = 0.1; // 旋转速度（弧度）
const PITCH_SPEED = 0.08; // 上下看速度（弧度）

// VR场景数据
const scenes = [
  {
    name: "水库全景",
    panorama: "https://photo-sphere-viewer.js.org/assets/demo.jpg",
  },
  {
    name: "监测设施",
    panorama: "https://photo-sphere-viewer.js.org/assets/demo.jpg",
  },
  {
    name: "管网枢纽",
    panorama: "https://photo-sphere-viewer.js.org/assets/demo.jpg",
  },
];

// 初始化VR查看器
const initViewer = () => {
  try {
    viewer = new Viewer({
      container: document.getElementById("vr-viewer"),
      panorama: scenes[0].panorama,
      navbar: ["zoom", "fullscreen", "caption"],
      caption: `${props.reservoirName} - ${scenes[0].name}`,
      loadingImg: null,
      size: {
        width: "100%",
        height: 400,
      },
    });

    // 添加事件监听
    viewer.on("ready", () => {
      console.log("VR查看器初始化完成");
      // 初始化完成后添加键盘控制
      addKeyboardControls();
      // 添加点击移动功能
      addClickToMoveControls();
    });

    viewer.on("panorama-loaded", () => {
      console.log("全景图片加载完成");
    });
  } catch (error) {
    console.error("VR查看器初始化失败:", error);
  }
};

// 键盘控制函数
const handleKeyDown = (event) => {
  if (!viewer) return;

  // 获取当前视角
  const position = viewer.getPosition();

  switch (event.key) {
    case "ArrowUp":
      event.preventDefault();
      // 向上看（减少pitch，但不超过上限）
      viewer.rotate({
        longitude: position.longitude,
        latitude: Math.min(position.latitude + PITCH_SPEED, Math.PI / 2 - 0.1),
      });
      break;

    case "ArrowDown":
      event.preventDefault();
      // 向下看（增加pitch，但不超过下限）
      viewer.rotate({
        longitude: position.longitude,
        latitude: Math.max(position.latitude - PITCH_SPEED, -Math.PI / 2 + 0.1),
      });
      break;

    case "ArrowLeft":
      event.preventDefault();
      // 向左转
      viewer.rotate({
        longitude: position.longitude - ROTATION_SPEED,
        latitude: position.latitude,
      });
      break;

    case "ArrowRight":
      event.preventDefault();
      // 向右转
      viewer.rotate({
        longitude: position.longitude + ROTATION_SPEED,
        latitude: position.latitude,
      });
      break;
  }
};

// 添加键盘控制
const addKeyboardControls = () => {
  document.addEventListener("keydown", handleKeyDown);
};

// 移除键盘控制
const removeKeyboardControls = () => {
  document.removeEventListener("keydown", handleKeyDown);
};

// 点击移动功能
const handleViewerClick = (event) => {
  if (!viewer) return;

  // 获取点击位置相对于canvas的坐标
  const canvas = viewer.renderer.canvas;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // 将屏幕坐标转换为球面坐标
  const sphericalCoords = viewer.dataHelper.viewerCoordsToSphericalCoords({
    x: x,
    y: y,
  });

  // 平滑移动到目标位置
  viewer.animate(
    {
      longitude: sphericalCoords.longitude,
      latitude: sphericalCoords.latitude,
    },
    {
      duration: 800,
      easing: "outQuart",
    }
  );
};

// 添加点击移动控制
const addClickToMoveControls = () => {
  const canvas = viewer.renderer.canvas;
  if (canvas) {
    canvas.addEventListener("click", handleViewerClick);
    // 添加鼠标指针样式
    canvas.style.cursor = "crosshair";
  }
};

// 移除点击移动控制
const removeClickToMoveControls = () => {
  const canvas = viewer?.renderer?.canvas;
  if (canvas) {
    canvas.removeEventListener("click", handleViewerClick);
    canvas.style.cursor = "";
  }
};

// 全屏功能
const toggleFullscreen = () => {
  const vrContainer = document.querySelector(".vr-viewer-overlay");

  if (!isFullscreen.value) {
    // 进入全屏
    if (vrContainer.requestFullscreen) {
      vrContainer.requestFullscreen();
    } else if (vrContainer.webkitRequestFullscreen) {
      vrContainer.webkitRequestFullscreen();
    } else if (vrContainer.mozRequestFullScreen) {
      vrContainer.mozRequestFullScreen();
    } else if (vrContainer.msRequestFullscreen) {
      vrContainer.msRequestFullscreen();
    }
  } else {
    // 退出全屏
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
};

// 监听全屏状态变化
const handleFullscreenChange = () => {
  const isCurrentlyFullscreen = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );

  isFullscreen.value = isCurrentlyFullscreen;

  // 全屏时调整viewer大小
  if (viewer && isCurrentlyFullscreen) {
    setTimeout(() => {
      viewer.resize();
    }, 100);
  }
};

// 添加全屏事件监听
const addFullscreenListeners = () => {
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.addEventListener("mozfullscreenchange", handleFullscreenChange);
  document.addEventListener("MSFullscreenChange", handleFullscreenChange);
};

// 移除全屏事件监听
const removeFullscreenListeners = () => {
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  document.removeEventListener(
    "webkitfullscreenchange",
    handleFullscreenChange
  );
  document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
  document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
};

// 销毁VR查看器
const destroyViewer = () => {
  if (viewer) {
    removeKeyboardControls(); // 移除键盘监听器
    removeClickToMoveControls(); // 移除点击移动监听器
    removeFullscreenListeners(); // 移除全屏监听器
    viewer.destroy();
    viewer = null;
  }
};

// 切换场景
const switchScene = (sceneIndex) => {
  if (viewer && scenes[sceneIndex]) {
    viewer.setPanorama(scenes[sceneIndex].panorama, {
      caption: `${props.reservoirName} - ${scenes[sceneIndex].name}`,
    });
  }
};

// 关闭查看器
const closeViewer = () => {
  emit("close");
};

// 监听可见性变化
watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue) {
      // 延迟初始化确保DOM已渲染
      setTimeout(() => {
        initViewer();
      }, 100);
    } else {
      destroyViewer();
    }
  }
);

// 生命周期
onMounted(() => {
  // 添加全屏监听器
  addFullscreenListeners();

  // 如果初始可见，立即初始化
  if (props.isVisible) {
    setTimeout(() => {
      initViewer();
    }, 100);
  }
});

onUnmounted(() => {
  removeKeyboardControls(); // 确保移除键盘监听器
  destroyViewer();
});
</script>

<style scoped>
.vr-viewer-overlay {
  position: fixed;
  top: 20px;
  right: 27vw; /* 位于右侧面板左侧，3:1比例 */
  bottom: 20px;
  width: 72vw; /* 使用视窗宽度，占据3/4空间 */
  z-index: 1500; /* 低于右侧面板的z-index */
  animation: slideInLeft 0.4s ease;
  pointer-events: auto;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.vr-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(15, 35, 65, 0.95) 0%,
    rgba(20, 45, 85, 0.95) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(74, 144, 226, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(15px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 移除slideUp动画 */

.vr-header {
  padding: 20px;
  background: rgba(74, 144, 226, 0.15);
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vr-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
}

.vr-close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.vr-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.vr-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.vr-viewer {
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  min-height: 300px;
}

.vr-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: auto;
  max-height: 280px;
  overflow-y: auto;
}

.vr-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(74, 144, 226, 0.2);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.info-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.info-value {
  color: rgba(255, 255, 255, 0.95);
  font-size: 12px;
  font-weight: 600;
}

.vr-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.vr-action-btn {
  background: rgba(74, 144, 226, 0.8);
  border: 1px solid rgba(74, 144, 226, 0.5);
  border-radius: 6px;
  color: white;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 6px;
}

.vr-action-btn:hover {
  background: rgba(74, 144, 226, 1);
  border-color: rgba(74, 144, 226, 0.8);
  transform: translateY(-1px);
}

/* 键盘控制样式 */
.vr-keyboard-hints {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(74, 144, 226, 0.2);
}

.keyboard-title {
  color: rgba(255, 255, 255, 0.95);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 10px;
  text-align: center;
}

.keyboard-controls {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.key-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  border: 1px solid rgba(74, 144, 226, 0.1);
}

.key-icon {
  background: linear-gradient(135deg, #4a90e2 0%, #74b9ff 100%);
  color: white;
  font-size: 12px;
  font-weight: bold;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.key-desc {
  color: rgba(255, 255, 255, 0.8);
  font-size: 10px;
  font-weight: 500;
}

/* 交互提示样式 */
.vr-interaction-hints {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(74, 144, 226, 0.2);
}

.interaction-title {
  color: rgba(255, 255, 255, 0.95);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
}

.interaction-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(74, 144, 226, 0.1);
}

.interaction-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.interaction-desc {
  color: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.3;
}

/* 全屏按钮特殊样式 */
.fullscreen-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 1px solid rgba(118, 75, 162, 0.5);
  box-shadow: 0 2px 8px rgba(118, 75, 162, 0.3);
}

.fullscreen-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 4px 12px rgba(118, 75, 162, 0.4);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .vr-viewer-overlay {
    right: 30vw;
    width: 68vw;
  }
}

@media (max-width: 768px) {
  .vr-viewer-overlay {
    top: 10px;
    right: 10px;
    bottom: 40vh;
    width: calc(100vw - 20px);
  }

  .vr-actions {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .vr-viewer {
    min-height: 200px;
  }

  .vr-content {
    padding: 15px;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .vr-header {
    padding: 12px;
  }

  .vr-header h3 {
    font-size: 14px;
  }

  .vr-content {
    padding: 12px;
    gap: 10px;
  }

  .vr-action-btn {
    font-size: 10px;
    padding: 6px 4px;
  }

  .vr-controls {
    max-height: 200px;
  }

  .keyboard-controls {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .key-hint {
    padding: 3px 6px;
  }

  .key-icon {
    width: 16px;
    height: 16px;
    font-size: 10px;
  }

  .key-desc {
    font-size: 9px;
  }
}
</style> 