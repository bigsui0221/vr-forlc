<template>
  <div v-if="isVisible" class="three-vr-overlay">
    <div class="three-vr-container">
      <div class="three-vr-header">
        <h3>🥽 {{ reservoirName }} - HDR VR漫游</h3>
        <button class="three-vr-close-btn" @click="closeViewer">✕</button>
      </div>

      <div class="three-vr-content">
        <div ref="threeContainer" class="three-vr-viewer">
          <!-- 加载遮罩层 -->
          <div v-if="isLoading" class="loading-overlay">
            <div class="loading-content">
              <div class="loading-spinner"></div>
              <div class="loading-text">{{ loadingText }}</div>
              <div v-if="loadingProgress > 0" class="loading-progress">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: loadingProgress + '%' }"
                  ></div>
                </div>
                <div class="progress-text">{{ loadingProgress }}%</div>
              </div>
              <div v-if="loadingError" class="loading-error">
                {{ loadingError }}
              </div>
            </div>
          </div>
        </div>

        <!-- 移动控制提示 -->
        <div class="movement-hint">
          <div class="hint-item">🖱️ 拖拽旋转视角</div>
          <div class="hint-item">⌨️ WASD/方向键移动(每次2%场景)</div>
          <div class="hint-item">🔵 点击蓝色热点快速传送</div>
          <div class="hint-item">👆 点击场景任意位置快速移动</div>
          <div class="hint-item">🎯 Shift+点击或右键添加标记点</div>
        </div>

        <div class="three-vr-controls">
          <div class="three-vr-info">
            <div class="info-item">
              <span class="info-label">当前场景:</span>
              <span class="info-value">{{ currentScene.name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">标记点:</span>
              <span class="info-value"
                >{{
                  markers.filter((m) => m.sceneId === currentSceneIndex).length
                }}个</span
              >
            </div>
            <div class="info-item">
              <span class="info-label">当前位置:</span>
              <span class="info-value">{{
                `${Math.round(cameraPos.x)}, ${Math.round(
                  cameraPos.y
                )}, ${Math.round(cameraPos.z)}`
              }}</span>
            </div>
          </div>

          <div class="three-vr-actions">
            <button class="three-action-btn" @click="switchHDRScene(0)">
              🏞️ 水库全景
            </button>
            <button class="three-action-btn" @click="switchHDRScene(1)">
              🏭 监测设施
            </button>
            <button
              class="three-action-btn fullscreen-btn"
              @click="toggleFullscreen"
            >
              {{ isFullscreen ? "🔳 退出全屏" : "⛶ 全屏查看" }}
            </button>
            <button class="three-action-btn" @click="resetView">
              🔄 重置位置
            </button>
            <button class="three-action-btn" @click="showMarkerList">
              📍 标记管理
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 标记点对话框 -->
    <div
      v-if="showMarkerDialog"
      class="marker-dialog-overlay"
      @click="closeMarkerDialog"
    >
      <div class="marker-dialog" @click.stop>
        <div class="marker-dialog-header">
          <h3>{{ editingMarker?.title ? "编辑标记点" : "新建标记点" }}</h3>
          <button class="dialog-close-btn" @click="closeMarkerDialog">✕</button>
        </div>
        <div class="marker-dialog-content">
          <div class="form-group">
            <label>标记名称</label>
            <input
              v-model="markerForm.title"
              type="text"
              placeholder="输入标记点名称..."
              maxlength="20"
            />
          </div>
          <div class="form-group">
            <label>描述信息</label>
            <textarea
              v-model="markerForm.description"
              placeholder="输入标记点描述..."
              maxlength="100"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label>标记颜色</label>
            <div class="color-picker">
              <input v-model="markerForm.color" type="color" />
              <div class="color-presets">
                <div
                  class="color-preset"
                  style="background: #ff4444"
                  @click="markerForm.color = '#ff4444'"
                ></div>
                <div
                  class="color-preset"
                  style="background: #44ff44"
                  @click="markerForm.color = '#44ff44'"
                ></div>
                <div
                  class="color-preset"
                  style="background: #4444ff"
                  @click="markerForm.color = '#4444ff'"
                ></div>
                <div
                  class="color-preset"
                  style="background: #ffff44"
                  @click="markerForm.color = '#ffff44'"
                ></div>
                <div
                  class="color-preset"
                  style="background: #ff44ff"
                  @click="markerForm.color = '#ff44ff'"
                ></div>
                <div
                  class="color-preset"
                  style="background: #44ffff"
                  @click="markerForm.color = '#44ffff'"
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div class="marker-dialog-actions">
          <button class="dialog-btn cancel-btn" @click="closeMarkerDialog">
            取消
          </button>
          <button
            v-if="editingMarker?.title"
            class="dialog-btn delete-btn"
            @click="deleteMarker"
          >
            删除
          </button>
          <button
            class="dialog-btn save-btn"
            @click="saveMarker"
            :disabled="!markerForm.title.trim()"
          >
            {{ editingMarker?.title ? "保存" : "创建" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import {
  getVRScenesForReservoir,
  getOptimizedImagePath,
  isOptimizationNeeded,
  getPreloadConfig,
} from "../config/vrConfig.js";

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
const isFullscreen = ref(false);
const threeContainer = ref(null);
const currentSceneIndex = ref(0);
const cameraPos = ref({ x: 0, y: 0, z: 0 }); // 用于显示位置
const markers = ref([]); // 标记点数组
const showMarkerDialog = ref(false);
const editingMarker = ref(null);
const markerForm = ref({
  title: "",
  description: "",
  color: "#ff4444",
});

// Three.js 相关变量
let scene = null;
let camera = null;
let renderer = null;
let sphere = null;
let loader = null;
let animationId = null;
let isMouseDown = false;
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;

// 场景和导航相关
let hotspotGroup = null;
let raycaster = null;
let mouse = null;
let hotspotMeshes = [];
let isTransitioning = false;

// 标记点相关
let markerGroup = null;
let markerMeshes = [];
let isCreatingMarker = false;

// 相机移动相关
let cameraPosition = { x: 0, y: 0, z: 0 };
let targetCameraPosition = { x: 0, y: 0, z: 0 };
const sceneRadius = 500; // 场景球体半径
const moveSpeedPercent = 0.02; // 每次移动场景的2%
const maxMovePercent = 0.6; // 最大移动距离为场景的60%
const moveSpeed = sceneRadius * moveSpeedPercent; // 10个单位
const maxMoveDistance = sceneRadius * maxMovePercent; // 300个单位

// 响应式数据 - 加载状态
const isLoading = ref(false);
const loadingProgress = ref(0);
const loadingText = ref("");
const loadingError = ref("");

// VR场景数据 - 动态加载
const hdrScenes = ref([]);

// HDR场景数据 - 使用百分比定位热点
const createHotspotPosition = (xPercent, yPercent, zPercent) => ({
  x: sceneRadius * xPercent,
  y: sceneRadius * yPercent,
  z: sceneRadius * zPercent,
});

// 根据水库名称初始化场景
const initializeScenes = () => {
  const scenes = getVRScenesForReservoir(props.reservoirName);

  hdrScenes.value = scenes.map((scene) => ({
    ...scene,
    hotspots: scene.hotspots.map((hotspot) => ({
      ...hotspot,
      position: createHotspotPosition(
        hotspot.position.x,
        hotspot.position.y,
        hotspot.position.z
      ),
    })),
  }));

  console.log(
    `为 ${props.reservoirName} 加载了 ${hdrScenes.value.length} 个VR场景`
  );

  // 检查是否需要优化
  hdrScenes.value.forEach((scene) => {
    if (isOptimizationNeeded(scene)) {
      console.warn(
        `场景 "${scene.name}" 需要优化，文件大小: ${scene.fileSize}`
      );
    }
  });
};

// 计算当前场景
const currentScene = computed(
  () =>
    hdrScenes.value[currentSceneIndex.value] ||
    hdrScenes.value[0] || { name: "加载中..." }
);

// 初始化Three.js场景
const initThreeScene = () => {
  if (!threeContainer.value) return;

  // 创建场景
  scene = new THREE.Scene();

  // 创建相机
  camera = new THREE.PerspectiveCamera(
    75,
    threeContainer.value.clientWidth / threeContainer.value.clientHeight,
    0.1,
    1000
  );

  // 初始化射线投射器（用于热点交互）
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 创建热点组
  hotspotGroup = new THREE.Group();
  scene.add(hotspotGroup);

  // 创建标记点组
  markerGroup = new THREE.Group();
  scene.add(markerGroup);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(
    threeContainer.value.clientWidth,
    threeContainer.value.clientHeight
  );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  threeContainer.value.appendChild(renderer.domElement);

  // 创建球体几何体（内表面）
  const geometry = new THREE.SphereGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1); // 翻转以便从内部查看

  // 创建材质
  const material = new THREE.MeshBasicMaterial();
  sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  // 初始化HDR加载器
  loader = new RGBELoader();
  loader.setDataType(THREE.HalfFloatType);

  // 加载默认场景
  loadScene(0);

  // 添加鼠标控制
  addMouseControls();

  // 开始渲染循环
  animate();
};

// 预加载缓存
const imageCache = new Map();
const preloadConfig = getPreloadConfig();

// 预加载图像
const preloadImage = async (imagePath) => {
  if (imageCache.has(imagePath)) {
    console.log(`使用缓存图像: ${imagePath}`);
    return imageCache.get(imagePath);
  }

  return new Promise((resolve, reject) => {
    const loader = new RGBELoader();
    loader.setDataType(THREE.HalfFloatType);

    const startTime = Date.now();

    loader.load(
      imagePath,
      (texture) => {
        const loadTime = Date.now() - startTime;
        console.log(`图像 ${imagePath} 加载完成，耗时: ${loadTime}ms`);

        texture.mapping = THREE.EquirectangularReflectionMapping;
        imageCache.set(imagePath, texture);
        resolve(texture);
      },
      (progress) => {
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          loadingProgress.value = percent;
          loadingText.value = `加载中... ${percent}%`;
        }
      },
      (error) => {
        console.error(`图像加载失败: ${imagePath}`, error);
        loadingError.value = `加载失败: ${error.message}`;
        reject(error);
      }
    );
  });
};

// 加载场景（包含HDR和热点）
const loadScene = async (sceneIndex) => {
  if (!hdrScenes.value[sceneIndex] || isTransitioning) return;

  isTransitioning = true;
  isLoading.value = true;
  loadingProgress.value = 0;
  loadingError.value = "";

  currentSceneIndex.value = sceneIndex;
  const targetScene = hdrScenes.value[sceneIndex];

  try {
    // 清除现有热点
    clearHotspots();

    // 显示加载信息
    loadingText.value = `正在加载 ${targetScene.name}...`;

    // 优化警告
    if (isOptimizationNeeded(targetScene)) {
      console.warn(
        `警告: ${targetScene.name} (${targetScene.fileSize}) 文件较大，可能影响加载速度`
      );
    }

    // 获取优化后的图像路径
    const optimizedPath = getOptimizedImagePath(targetScene.path);

    // 预加载图像
    const texture = await preloadImage(optimizedPath);

    // 应用纹理
    if (sphere && sphere.material) {
      sphere.material.map = texture;
      sphere.material.needsUpdate = true;
    }

    // 创建热点
    createHotspots(targetScene.hotspots);

    // 加载标记点
    loadMarkersForScene(sceneIndex);

    // 重置相机位置
    resetCameraPosition();

    loadingText.value = "加载完成";
    console.log(`场景 ${targetScene.name} 加载成功`);

    // 延迟隐藏加载界面
    setTimeout(() => {
      isLoading.value = false;
    }, 500);
  } catch (error) {
    console.error("场景加载失败:", error);
    loadingError.value = `加载失败: ${error.message}`;

    // 尝试加载备用图像
    try {
      loadingText.value = "正在加载备用图像...";
      const fallbackTexture = await preloadImage("/vr-images/2.hdr");
      if (sphere && sphere.material) {
        sphere.material.map = fallbackTexture;
        sphere.material.needsUpdate = true;
      }
      loadingText.value = "已加载备用图像";
    } catch (fallbackError) {
      loadingError.value = "所有图像加载失败";
      console.error("备用图像也加载失败:", fallbackError);
    }

    setTimeout(() => {
      isLoading.value = false;
    }, 1000);
  } finally {
    isTransitioning = false;
  }
};

// 创建热点
const createHotspots = (hotspots) => {
  hotspots.forEach((hotspot) => {
    // 创建热点几何体
    const geometry = new THREE.SphereGeometry(12, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4a90e2,
      transparent: true,
      opacity: 0.8,
      emissive: 0x2d5aa0,
      emissiveIntensity: 0.3,
    });
    const hotspotMesh = new THREE.Mesh(geometry, material);

    // 设置位置
    hotspotMesh.position.set(
      hotspot.position.x,
      hotspot.position.y,
      hotspot.position.z
    );

    // 添加热点数据
    hotspotMesh.userData = {
      id: hotspot.id,
      targetScene: hotspot.targetScene,
      title: hotspot.title,
      icon: hotspot.icon,
      teleportPosition: hotspot.teleportPosition, // 传送位置
    };

    // 添加到场景
    hotspotGroup.add(hotspotMesh);
    hotspotMeshes.push(hotspotMesh);

    // 创建文字标签
    createHotspotLabel(hotspot, hotspotMesh);
  });
};

// 创建热点文字标签
const createHotspotLabel = (hotspot, hotspotMesh) => {
  // 创建canvas用于文字纹理
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 64;

  // 绘制背景
  context.fillStyle = "rgba(74, 144, 226, 0.9)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制文字
  context.fillStyle = "white";
  context.font = "bold 18px Arial";
  context.textAlign = "center";
  context.fillText(hotspot.icon + " " + hotspot.title, canvas.width / 2, 40);

  // 创建纹理和材质
  const texture = new THREE.CanvasTexture(canvas);
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.1,
  });

  // 创建标签几何体
  const labelGeometry = new THREE.PlaneGeometry(50, 12);
  const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);

  // 位置稍微偏移
  labelMesh.position.copy(hotspotMesh.position);
  labelMesh.position.y += 20;

  hotspotGroup.add(labelMesh);
};

// 清除热点
const clearHotspots = () => {
  hotspotMeshes = [];
  while (hotspotGroup.children.length > 0) {
    const child = hotspotGroup.children[0];
    if (child.material) {
      if (child.material.map) child.material.map.dispose();
      child.material.dispose();
    }
    if (child.geometry) child.geometry.dispose();
    hotspotGroup.remove(child);
  }
};

// 添加鼠标控制
const addMouseControls = () => {
  const canvas = renderer.domElement;

  // 鼠标按下
  canvas.addEventListener("mousedown", (event) => {
    isMouseDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
  });

  // 鼠标移动
  canvas.addEventListener("mousemove", (event) => {
    if (!isMouseDown) return;

    const deltaX = event.clientX - mouseX;
    const deltaY = event.clientY - mouseY;

    targetRotationX += deltaY * 0.005;
    targetRotationY += deltaX * 0.005;

    // 限制垂直旋转角度
    targetRotationX = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, targetRotationX)
    );

    mouseX = event.clientX;
    mouseY = event.clientY;
  });

  // 鼠标抬起
  canvas.addEventListener("mouseup", () => {
    isMouseDown = false;
  });

  // 鼠标滚轮缩放
  canvas.addEventListener("wheel", (event) => {
    camera.fov += event.deltaY * 0.05;
    camera.fov = Math.max(10, Math.min(120, camera.fov));
    camera.updateProjectionMatrix();
    event.preventDefault();
  });

  // 鼠标点击事件（热点交互和标记创建）
  canvas.addEventListener("click", (event) => {
    if (event.shiftKey) {
      // Shift+点击创建标记点
      handleMarkerCreation(event);
    } else {
      // 普通点击处理热点和标记点
      handleSceneClick(event);
    }
  });

  // 右键菜单创建标记点
  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    handleMarkerCreation(event);
  });

  // 确保canvas可以接收键盘事件
  canvas.tabIndex = 0;
  canvas.focus();
};

// 处理场景点击（热点和标记点）
const handleSceneClick = (event) => {
  if (isTransitioning) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // 先检查标记点
  const markerIntersects = raycaster.intersectObjects(markerMeshes);
  if (markerIntersects.length > 0) {
    const marker = markerIntersects[0].object;
    handleMarkerClick(marker);
    return;
  }

  // 再检查热点
  const hotspotIntersects = raycaster.intersectObjects(hotspotMeshes);
  if (hotspotIntersects.length > 0) {
    const hotspot = hotspotIntersects[0].object;
    const targetScene = hotspot.userData.targetScene;
    const teleportPosition = hotspot.userData.teleportPosition;

    console.log(`点击热点: ${hotspot.userData.title}`);

    // 如果有传送位置，直接移动相机到该位置
    if (teleportPosition) {
      targetCameraPosition.x = teleportPosition.x;
      targetCameraPosition.y = teleportPosition.y;
      targetCameraPosition.z = teleportPosition.z;
      console.log(`传送到位置: ${JSON.stringify(teleportPosition)}`);
    }

    // 切换到目标场景
    if (targetScene !== undefined && targetScene !== currentSceneIndex.value) {
      loadScene(targetScene);
    }
    return;
  }

  // 最后处理空白区域点击移动
  handleClickToMove(event);
};

// 处理点击移动
const handleClickToMove = (event) => {
  if (isTransitioning) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // 将鼠标位置投射到场景球面
  raycaster.setFromCamera(mouse, camera);

  // 创建一个大球体来接收射线
  const tempGeometry = new THREE.SphereGeometry(sceneRadius * 0.99, 32, 32);
  tempGeometry.scale(-1, 1, 1);
  const tempMesh = new THREE.Mesh(tempGeometry, new THREE.MeshBasicMaterial());

  const intersects = raycaster.intersectObject(tempMesh);
  tempGeometry.dispose();

  if (intersects.length > 0) {
    const intersectionPoint = intersects[0].point;

    // 计算移动方向向量（从当前相机位置到点击点）
    const direction = new THREE.Vector3();
    direction.subVectors(
      intersectionPoint,
      new THREE.Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z)
    );
    direction.normalize();

    // 移动距离为场景的5%
    const moveDistance = sceneRadius * 0.05;

    // 计算新的目标位置
    const newX = Math.max(
      -maxMoveDistance,
      Math.min(
        maxMoveDistance,
        targetCameraPosition.x + direction.x * moveDistance
      )
    );
    const newY = Math.max(
      -maxMoveDistance,
      Math.min(
        maxMoveDistance,
        targetCameraPosition.y + direction.y * moveDistance
      )
    );
    const newZ = Math.max(
      -maxMoveDistance,
      Math.min(
        maxMoveDistance,
        targetCameraPosition.z + direction.z * moveDistance
      )
    );

    targetCameraPosition.x = newX;
    targetCameraPosition.y = newY;
    targetCameraPosition.z = newZ;

    console.log("点击移动到位置:", { x: newX, y: newY, z: newZ });
  }
};

// 处理标记点创建
const handleMarkerCreation = (event) => {
  if (isTransitioning) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // 将鼠标位置投射到场景球面
  raycaster.setFromCamera(mouse, camera);

  // 创建一个大球体来接收射线
  const tempGeometry = new THREE.SphereGeometry(sceneRadius * 0.99, 32, 32);
  tempGeometry.scale(-1, 1, 1);
  const tempMesh = new THREE.Mesh(tempGeometry, new THREE.MeshBasicMaterial());

  const intersects = raycaster.intersectObject(tempMesh);
  tempGeometry.dispose();

  if (intersects.length > 0) {
    const intersectionPoint = intersects[0].point;
    // 稍微向内移动，避免与球面重叠
    intersectionPoint.multiplyScalar(0.95);

    // 准备创建标记点
    editingMarker.value = {
      id: Date.now().toString(),
      sceneId: currentSceneIndex.value,
      position: {
        x: intersectionPoint.x,
        y: intersectionPoint.y,
        z: intersectionPoint.z,
      },
      title: "",
      description: "",
      color: "#ff4444",
      createTime: new Date().toISOString(),
    };

    // 重置表单
    markerForm.value = {
      title: "",
      description: "",
      color: "#ff4444",
    };

    showMarkerDialog.value = true;
    console.log("创建标记点位置:", intersectionPoint);
  }
};

// 处理标记点点击
const handleMarkerClick = (markerMesh) => {
  const markerData = markerMesh.userData;
  editingMarker.value = { ...markerData };
  markerForm.value = {
    title: markerData.title,
    description: markerData.description,
    color: markerData.color,
  };
  showMarkerDialog.value = true;
  console.log("点击标记点:", markerData.title);
};

// 键盘移动控制
const handleKeyboardMovement = (event) => {
  if (isTransitioning) return;

  const moveDistance = moveSpeed;
  let moved = false;

  switch (event.code) {
    case "KeyW": // 前进
    case "ArrowUp":
      targetCameraPosition.z = Math.max(
        targetCameraPosition.z - moveDistance,
        -maxMoveDistance
      );
      moved = true;
      break;
    case "KeyS": // 后退
    case "ArrowDown":
      targetCameraPosition.z = Math.min(
        targetCameraPosition.z + moveDistance,
        maxMoveDistance
      );
      moved = true;
      break;
    case "KeyA": // 左移
    case "ArrowLeft":
      targetCameraPosition.x = Math.max(
        targetCameraPosition.x - moveDistance,
        -maxMoveDistance
      );
      moved = true;
      break;
    case "KeyD": // 右移
    case "ArrowRight":
      targetCameraPosition.x = Math.min(
        targetCameraPosition.x + moveDistance,
        maxMoveDistance
      );
      moved = true;
      break;
    case "KeyQ": // 上升
      targetCameraPosition.y = Math.min(
        targetCameraPosition.y + moveDistance,
        maxMoveDistance
      );
      moved = true;
      break;
    case "KeyE": // 下降
      targetCameraPosition.y = Math.max(
        targetCameraPosition.y - moveDistance,
        -maxMoveDistance
      );
      moved = true;
      break;
  }

  if (moved) {
    console.log("键盘移动:", {
      key: event.code,
      position: targetCameraPosition,
    });
    event.preventDefault();
  }
};

// 动画循环
const animate = () => {
  animationId = requestAnimationFrame(animate);

  // 平滑移动相机位置
  cameraPosition.x += (targetCameraPosition.x - cameraPosition.x) * 0.1;
  cameraPosition.y += (targetCameraPosition.y - cameraPosition.y) * 0.1;
  cameraPosition.z += (targetCameraPosition.z - cameraPosition.z) * 0.1;

  // 更新显示位置
  cameraPos.value = {
    x: cameraPosition.x,
    y: cameraPosition.y,
    z: cameraPosition.z,
  };

  // 平滑旋转
  currentRotationX += (targetRotationX - currentRotationX) * 0.05;
  currentRotationY += (targetRotationY - currentRotationY) * 0.05;

  // 应用旋转和位置
  const radius = 0.1;
  camera.position.x =
    cameraPosition.x +
    Math.cos(currentRotationY) * Math.cos(currentRotationX) * radius;
  camera.position.y = cameraPosition.y + Math.sin(currentRotationX) * radius;
  camera.position.z =
    cameraPosition.z +
    Math.sin(currentRotationY) * Math.cos(currentRotationX) * radius;
  camera.lookAt(cameraPosition.x, cameraPosition.y, cameraPosition.z);

  // 更新热点标签朝向
  updateHotspotLabels();

  // 热点动画效果
  animateHotspots();

  renderer.render(scene, camera);
};

// 更新热点标签朝向
const updateHotspotLabels = () => {
  hotspotGroup.children.forEach((child) => {
    if (child.material && child.material.map) {
      child.lookAt(camera.position);
    }
  });
};

// 热点动画效果
const animateHotspots = () => {
  const time = Date.now() * 0.001;
  hotspotMeshes.forEach((hotspot, index) => {
    // 轻微的浮动动画
    const originalY = hotspot.userData.originalY || hotspot.position.y;
    if (!hotspot.userData.originalY) {
      hotspot.userData.originalY = hotspot.position.y;
    }
    hotspot.position.y = originalY + Math.sin(time * 2 + index) * 3;

    // 轻微的旋转和缩放
    hotspot.rotation.y = time + index;
    const scale = 1 + Math.sin(time * 3 + index) * 0.1;
    hotspot.scale.setScalar(scale);
  });
};

// 切换HDR场景
const switchHDRScene = (index) => {
  if (hdrScenes.value[index] && !isTransitioning) {
    loadScene(index);
  }
};

// 全屏功能
const toggleFullscreen = () => {
  const vrContainer = document.querySelector(".three-vr-overlay");

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

  // 全屏时调整渲染器大小
  if (renderer && isCurrentlyFullscreen) {
    setTimeout(() => {
      handleResize();
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

// 重置视角和位置
const resetView = () => {
  targetRotationX = 0;
  targetRotationY = 0;
  camera.fov = 75;
  camera.updateProjectionMatrix();
  resetCameraPosition();
};

// 重置相机位置
const resetCameraPosition = () => {
  cameraPosition = { x: 0, y: 0, z: 0 };
  targetCameraPosition = { x: 0, y: 0, z: 0 };
};

// 关闭查看器
const closeViewer = () => {
  emit("close");
};

// 清理Three.js资源
const cleanup = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  if (renderer) {
    renderer.dispose();
    if (threeContainer.value && renderer.domElement) {
      threeContainer.value.removeChild(renderer.domElement);
    }
  }

  if (sphere && sphere.material) {
    if (sphere.material.map) {
      sphere.material.map.dispose();
    }
    sphere.material.dispose();
  }

  // 清理热点
  clearHotspots();

  // 清理标记点
  clearMarkers();

  // 移除键盘事件监听
  window.removeEventListener("keydown", handleKeyboardMovement);
  if (renderer?.domElement) {
    renderer.domElement.removeEventListener("keydown", handleKeyboardMovement);
  }

  // 移除全屏监听器
  removeFullscreenListeners();

  scene = null;
  camera = null;
  renderer = null;
  sphere = null;
  loader = null;
  hotspotGroup = null;
  markerGroup = null;
  raycaster = null;
  mouse = null;
};

// 窗口大小调整
const handleResize = () => {
  if (!camera || !renderer || !threeContainer.value) return;

  camera.aspect =
    threeContainer.value.clientWidth / threeContainer.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(
    threeContainer.value.clientWidth,
    threeContainer.value.clientHeight
  );
};

// 标记点管理函数
const createMarkerMesh = (marker) => {
  // 创建标记点几何体
  const geometry = new THREE.SphereGeometry(8, 16, 16);
  const material = new THREE.MeshBasicMaterial({
    color: marker.color,
    transparent: true,
    opacity: 0.9,
    emissive: marker.color,
    emissiveIntensity: 0.3,
  });
  const markerMesh = new THREE.Mesh(geometry, material);

  // 设置位置
  markerMesh.position.set(
    marker.position.x,
    marker.position.y,
    marker.position.z
  );

  // 添加标记数据
  markerMesh.userData = { ...marker };

  // 添加到场景
  markerGroup.add(markerMesh);
  markerMeshes.push(markerMesh);

  // 创建文字标签
  createMarkerLabel(marker, markerMesh);

  return markerMesh;
};

const createMarkerLabel = (marker, markerMesh) => {
  // 创建canvas用于文字纹理
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 64;

  // 绘制背景
  context.fillStyle = marker.color;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制文字
  context.fillStyle = "white";
  context.font = "bold 16px Arial";
  context.textAlign = "center";
  context.fillText(
    "📍 " + (marker.title || "未命名标记"),
    canvas.width / 2,
    40
  );

  // 创建纹理和材质
  const texture = new THREE.CanvasTexture(canvas);
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.1,
  });

  // 创建标签几何体
  const labelGeometry = new THREE.PlaneGeometry(40, 10);
  const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);

  // 位置稍微偏移
  labelMesh.position.copy(markerMesh.position);
  labelMesh.position.y += 15;

  markerGroup.add(labelMesh);
};

const clearMarkers = () => {
  markerMeshes = [];
  while (markerGroup.children.length > 0) {
    const child = markerGroup.children[0];
    if (child.material) {
      if (child.material.map) child.material.map.dispose();
      child.material.dispose();
    }
    if (child.geometry) child.geometry.dispose();
    markerGroup.remove(child);
  }
};

const loadMarkersForScene = (sceneIndex) => {
  clearMarkers();
  const sceneMarkers = markers.value.filter((m) => m.sceneId === sceneIndex);
  sceneMarkers.forEach((marker) => createMarkerMesh(marker));
};

const loadAllMarkers = async () => {
  try {
    // 从localStorage加载（模拟后端API）
    const savedMarkers = localStorage.getItem("vr_markers");
    if (savedMarkers) {
      markers.value = JSON.parse(savedMarkers);
      console.log("已加载标记点:", markers.value.length, "个");
    }
  } catch (error) {
    console.error("加载标记点失败:", error);
  }
};

const saveMarkerToStorage = async (marker) => {
  try {
    // 保存到localStorage（模拟后端API）
    const existingIndex = markers.value.findIndex((m) => m.id === marker.id);
    if (existingIndex >= 0) {
      markers.value[existingIndex] = marker;
    } else {
      markers.value.push(marker);
    }

    localStorage.setItem("vr_markers", JSON.stringify(markers.value));
    console.log("标记点已保存:", marker.title);
    return true;
  } catch (error) {
    console.error("保存标记点失败:", error);
    return false;
  }
};

const deleteMarkerFromStorage = async (markerId) => {
  try {
    markers.value = markers.value.filter((m) => m.id !== markerId);
    localStorage.setItem("vr_markers", JSON.stringify(markers.value));
    console.log("标记点已删除:", markerId);
    return true;
  } catch (error) {
    console.error("删除标记点失败:", error);
    return false;
  }
};

// 对话框相关函数
const saveMarker = async () => {
  if (!markerForm.value.title.trim()) return;

  const markerData = {
    ...editingMarker.value,
    title: markerForm.value.title.trim(),
    description: markerForm.value.description.trim(),
    color: markerForm.value.color,
    updateTime: new Date().toISOString(),
  };

  const success = await saveMarkerToStorage(markerData);
  if (success) {
    // 刷新当前场景的标记点显示
    loadMarkersForScene(currentSceneIndex.value);
    closeMarkerDialog();
  }
};

const deleteMarker = async () => {
  if (!editingMarker.value?.id) return;

  const success = await deleteMarkerFromStorage(editingMarker.value.id);
  if (success) {
    // 刷新当前场景的标记点显示
    loadMarkersForScene(currentSceneIndex.value);
    closeMarkerDialog();
  }
};

const closeMarkerDialog = () => {
  showMarkerDialog.value = false;
  editingMarker.value = null;
  markerForm.value = {
    title: "",
    description: "",
    color: "#ff4444",
  };
};

const showMarkerList = () => {
  // 显示当前场景的所有标记点
  const sceneMarkers = markers.value.filter(
    (m) => m.sceneId === currentSceneIndex.value
  );
  console.log("当前场景标记点:", sceneMarkers);
  alert(
    `当前场景共有 ${sceneMarkers.length} 个标记点\n\n${sceneMarkers
      .map((m) => `📍 ${m.title}: ${m.description || "无描述"}`)
      .join("\n")}`
  );
};

// 监听可见性变化
watch(
  () => props.isVisible,
  async (newValue) => {
    if (newValue) {
      await nextTick();

      // 初始化VR场景配置
      initializeScenes();

      setTimeout(() => {
        initThreeScene();
        // 添加键盘事件监听到canvas和window
        const canvas = renderer?.domElement;
        if (canvas) {
          canvas.addEventListener("keydown", handleKeyboardMovement);
        }
        window.addEventListener("keydown", handleKeyboardMovement);

        // 添加全屏监听器
        addFullscreenListeners();

        // 加载所有标记点
        loadAllMarkers();

        console.log(`VR查看器已启动 - ${props.reservoirName}`);
        console.log("键盘控制和全屏功能已激活");

        // 预加载下一个场景（可选）
        if (hdrScenes.value.length > 1 && preloadConfig.enabled) {
          setTimeout(() => {
            preloadNextScene();
          }, 2000);
        }
      }, 100);
    } else {
      cleanup();
    }
  }
);

// 预加载下一个场景
const preloadNextScene = async () => {
  if (hdrScenes.value.length > 1) {
    const nextIndex = (currentSceneIndex.value + 1) % hdrScenes.value.length;
    const nextScene = hdrScenes.value[nextIndex];

    try {
      console.log(`预加载下一个场景: ${nextScene.name}`);
      await preloadImage(getOptimizedImagePath(nextScene.path));
      console.log(`预加载完成: ${nextScene.name}`);
    } catch (error) {
      console.warn(`预加载失败: ${nextScene.name}`, error);
    }
  }
};

// 生命周期
onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  cleanup();
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.three-vr-overlay {
  position: fixed;
  top: 20px;
  right: 27vw;
  bottom: 20px;
  width: 72vw;
  z-index: 1500;
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

.three-vr-container {
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

.three-vr-header {
  padding: 20px;
  background: rgba(74, 144, 226, 0.15);
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.three-vr-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
}

.three-vr-close-btn {
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

.three-vr-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.three-vr-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.three-vr-viewer {
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  min-height: 300px;
  position: relative;
}

/* 加载遮罩层样式 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.loading-content {
  text-align: center;
  color: white;
  padding: 40px;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(74, 144, 226, 0.3);
  border-top: 4px solid #4a90e2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
  color: rgba(255, 255, 255, 0.9);
}

.loading-progress {
  margin-top: 20px;
}

.progress-bar {
  width: 200px;
  height: 8px;
  background: rgba(74, 144, 226, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin: 0 auto 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a90e2, #74b9ff);
  border-radius: 4px;
  transition: width 0.3s ease;
  animation: progress-glow 2s ease-in-out infinite alternate;
}

@keyframes progress-glow {
  0% {
    box-shadow: 0 0 5px rgba(74, 144, 226, 0.5);
  }
  100% {
    box-shadow: 0 0 20px rgba(74, 144, 226, 0.8);
  }
}

.progress-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

.loading-error {
  margin-top: 15px;
  padding: 10px 15px;
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.4);
  border-radius: 6px;
  color: #ff6b6b;
  font-size: 14px;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.movement-hint {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 10px;
  border: 1px solid rgba(74, 144, 226, 0.15);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 5px;
}

.movement-hint .hint-item:last-child {
  grid-column: span 2;
  text-align: center;
}

.hint-item {
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  text-align: center;
  padding: 2px;
}

.three-vr-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: auto;
  max-height: 140px;
}

.three-vr-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 10px;
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
  font-size: 11px;
}

.info-value {
  color: rgba(255, 255, 255, 0.95);
  font-size: 11px;
  font-weight: 600;
}

.three-vr-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.three-action-btn {
  background: rgba(74, 144, 226, 0.8);
  border: 1px solid rgba(74, 144, 226, 0.5);
  border-radius: 6px;
  color: white;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 4px;
}

.three-action-btn:hover {
  background: rgba(74, 144, 226, 1);
  border-color: rgba(74, 144, 226, 0.8);
  transform: translateY(-1px);
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
  .three-vr-overlay {
    right: 30vw;
    width: 68vw;
  }
}

@media (max-width: 768px) {
  .three-vr-overlay {
    top: 10px;
    right: 10px;
    bottom: 40vh;
    width: calc(100vw - 20px);
  }

  .three-vr-actions {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .three-vr-viewer {
    min-height: 200px;
  }

  .three-vr-content {
    padding: 12px;
    gap: 10px;
  }

  .movement-hint {
    grid-template-columns: 1fr;
    gap: 3px;
  }
}

@media (max-width: 480px) {
  .three-vr-header {
    padding: 10px;
  }

  .three-vr-header h3 {
    font-size: 14px;
  }

  .three-vr-content {
    padding: 10px;
    gap: 8px;
  }

  .three-action-btn {
    font-size: 9px;
    padding: 4px 3px;
  }

  .three-vr-controls {
    max-height: 120px;
  }
}

/* 标记点对话框样式 */
.marker-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.marker-dialog {
  background: linear-gradient(
    135deg,
    rgba(15, 35, 65, 0.98) 0%,
    rgba(20, 45, 85, 0.98) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(74, 144, 226, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  overflow: hidden;
}

.marker-dialog-header {
  padding: 20px;
  background: rgba(74, 144, 226, 0.15);
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.marker-dialog-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
}

.dialog-close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  transition: all 0.2s ease;
}

.dialog-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.marker-dialog-content {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.form-group input[type="text"],
.form-group textarea {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(74, 144, 226, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  resize: vertical;
  min-height: 44px;
  box-sizing: border-box;
}

.form-group input[type="text"]:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(74, 144, 226, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.form-group input[type="text"]::placeholder,
.form-group textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-picker input[type="color"] {
  width: 44px;
  height: 44px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}

.color-presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-preset {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-preset:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.marker-dialog-actions {
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(74, 144, 226, 0.1);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.dialog-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  min-width: 80px;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.delete-btn {
  background: rgba(220, 53, 69, 0.8);
  border-color: rgba(220, 53, 69, 0.5);
  color: white;
}

.delete-btn:hover {
  background: rgba(220, 53, 69, 1);
  border-color: rgba(220, 53, 69, 0.8);
}

.save-btn {
  background: rgba(74, 144, 226, 0.8);
  border-color: rgba(74, 144, 226, 0.5);
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: rgba(74, 144, 226, 1);
  border-color: rgba(74, 144, 226, 0.8);
}

.save-btn:disabled {
  background: rgba(74, 144, 226, 0.3);
  border-color: rgba(74, 144, 226, 0.2);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .marker-dialog {
    width: 95%;
    max-width: none;
    margin: 10px;
  }

  .marker-dialog-header,
  .marker-dialog-content,
  .marker-dialog-actions {
    padding: 15px;
  }

  .marker-dialog-actions {
    flex-direction: column;
    gap: 8px;
  }

  .dialog-btn {
    width: 100%;
  }

  .color-presets {
    justify-content: center;
  }
}
</style> 