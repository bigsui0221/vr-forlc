<template>
  <div class="map-container">
    <div id="map" class="map"></div>

    <!-- VR查看器组件 -->
    <VRViewer
      :isVisible="showVRViewer"
      :reservoirName="selectedReservoirName"
      @close="closeVRViewer"
    />

    <!-- 左侧图表区域 -->
    <div v-if="showChartsViewer" class="charts-area">
      <div class="charts-container">
        <div class="charts-header">
          <h3>📊 {{ selectedReservoirName }} - 数据分析</h3>
        </div>

        <div class="charts-content">
          <!-- 图表网格 -->
          <div class="charts-grid">
            <!-- 水质趋势图 -->
            <div class="chart-item">
              <div ref="waterQualityChart" class="chart-container"></div>
            </div>

            <!-- 流量分析图 -->
            <div class="chart-item">
              <div ref="flowAnalysisChart" class="chart-container"></div>
            </div>

            <!-- 水位统计图 -->
            <div class="chart-item">
              <div ref="waterLevelChart" class="chart-container"></div>
            </div>

            <!-- 传感器对比图 -->
            <div class="chart-item">
              <div ref="sensorCompareChart" class="chart-container"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Three.js HDR VR查看器 -->
    <ThreeVRViewer
      :isVisible="showThreeVRViewer"
      :reservoirName="selectedReservoirName"
      @close="closeThreeVRViewer"
    />

    <!-- 右侧悬浮信息框 -->
    <div
      id="side-panel"
      class="side-panel"
      :class="{ 'side-panel-visible': showSidePanel }"
    >
      <div class="side-panel-header">
        <h3>🏞️ {{ reservoirData.name || "水库详情" }}</h3>
        <button class="close-btn" @click="closeSidePanel">✕</button>
      </div>
      <div class="side-panel-content">
        <!-- 空状态 -->
        <div v-if="!reservoirData.name" class="empty-state">
          <div class="empty-icon">🏞️</div>
          <p>点击地图上的水库图标</p>
          <p>查看详细信息</p>
        </div>

        <!-- 水库详情内容 -->
        <div v-else>
          <!-- 水质监测数据 -->
          <div class="sensor-section">
            <h4>🧪 水质监测数据</h4>
            <div class="sensor-grid">
              <div class="sensor-card ph-sensor">
                <div class="sensor-icon">pH</div>
                <div class="sensor-value">
                  {{ reservoirData.sensors.phValue }}
                </div>
                <div class="sensor-label">酸碱度</div>
                <div
                  class="sensor-status"
                  :class="
                    reservoirData.sensors.phValue >= 7.0 &&
                    reservoirData.sensors.phValue <= 8.5
                      ? 'status-good'
                      : 'status-warning'
                  "
                >
                  {{
                    reservoirData.sensors.phValue >= 7.0 &&
                    reservoirData.sensors.phValue <= 8.5
                      ? "正常"
                      : "需关注"
                  }}
                </div>
              </div>

              <div class="sensor-card oxygen-sensor">
                <div class="sensor-icon">O₂</div>
                <div class="sensor-value">
                  {{ reservoirData.sensors.dissolvedOxygen }}
                </div>
                <div class="sensor-label">溶解氧 mg/L</div>
                <div
                  class="sensor-status"
                  :class="
                    reservoirData.sensors.dissolvedOxygen >= 8.0
                      ? 'status-good'
                      : 'status-warning'
                  "
                >
                  {{
                    reservoirData.sensors.dissolvedOxygen >= 8.0
                      ? "优良"
                      : "一般"
                  }}
                </div>
              </div>

              <div class="sensor-card turbidity-sensor">
                <div class="sensor-icon">💧</div>
                <div class="sensor-value">
                  {{ reservoirData.sensors.turbidity }}
                </div>
                <div class="sensor-label">浊度 NTU</div>
                <div
                  class="sensor-status"
                  :class="
                    reservoirData.sensors.turbidity <= 4.0
                      ? 'status-good'
                      : 'status-warning'
                  "
                >
                  {{
                    reservoirData.sensors.turbidity <= 4.0 ? "清澈" : "轻微浑浊"
                  }}
                </div>
              </div>

              <div class="sensor-card temp-sensor">
                <div class="sensor-icon">🌡️</div>
                <div class="sensor-value">
                  {{ reservoirData.sensors.temperature }}
                </div>
                <div class="sensor-label">水温 °C</div>
                <div class="sensor-status status-good">正常</div>
              </div>
            </div>
          </div>

          <!-- 流量监测数据 -->
          <div class="sensor-section">
            <h4>🌊 流量监测数据</h4>
            <div class="flow-container">
              <div class="flow-item">
                <div class="flow-header">
                  <span class="flow-icon">📥</span>
                  <span class="flow-title">入库流量</span>
                </div>
                <div class="flow-value">
                  {{ reservoirData.flows.inletFlow }} m³/s
                </div>
                <div class="flow-bar">
                  <div
                    class="flow-progress"
                    :style="{
                      width:
                        calculateProgressWidth(
                          reservoirData.flows.inletFlow,
                          2
                        ) + '%',
                    }"
                  ></div>
                </div>
              </div>

              <div class="flow-item">
                <div class="flow-header">
                  <span class="flow-icon">📤</span>
                  <span class="flow-title">出库流量</span>
                </div>
                <div class="flow-value">
                  {{ reservoirData.flows.outletFlow }} m³/s
                </div>
                <div class="flow-bar">
                  <div
                    class="flow-progress outlet"
                    :style="{
                      width:
                        calculateProgressWidth(
                          reservoirData.flows.outletFlow,
                          2.5
                        ) + '%',
                    }"
                  ></div>
                </div>
              </div>

              <div class="flow-item">
                <div class="flow-header">
                  <span class="flow-icon">📊</span>
                  <span class="flow-title">水位高度</span>
                </div>
                <div class="flow-value">
                  {{ reservoirData.flows.waterLevelHeight }} m
                </div>
                <div class="flow-bar">
                  <div
                    class="flow-progress level"
                    :style="{
                      width:
                        calculateProgressWidth(
                          reservoirData.flows.waterLevelHeight,
                          1
                        ) + '%',
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 视图切换按钮 -->
          <div class="view-switch-section">
            <h4>🔄 视图切换</h4>
            <div class="switch-buttons">
              <button
                class="switch-btn"
                :class="{ active: showChartsViewer }"
                @click="showDataCharts"
              >
                📊 数据分析
              </button>
              <button
                class="switch-btn"
                :class="{ active: showThreeVRViewer }"
                @click="showVRView"
              >
                🥽 VR查看
              </button>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-section">
            <button class="refresh-btn action-btn" @click="refreshCharts">
              🔄 刷新数据
            </button>
            <button class="export-btn action-btn" @click="exportData">
              📁 导出报告
            </button>
            <button
              class="network-btn action-btn"
              @click="toggleNetworkInfo(reservoirData.name)"
            >
              🚰 管网详情
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 地图信息框 - 下层背景 -->
    <div class="map-info">
      <h3>🏞️ 湖北利川水库分布图</h3>
      <p><strong>坐标:</strong> 108.9375°E, 30.2958°N</p>
      <p><strong>水库数量:</strong> 10个</p>
      <p><strong>说明:</strong> 🔴 利川市中心 | 🏞️ 水库位置</p>
      <div class="legend">
        <small>📌 点击水库图标查看传感器数据</small>
        <br />
        <small>🧪 水质监测 • 🌊 流量分析 • 📈 实时数据</small>
        <br />
        <small>🥽 支持VR实地查看 • 🚰 管网辐射区域</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import VRViewer from "./VRViewer.vue";
import ThreeVRViewer from "./ThreeVRViewer.vue";
import * as echarts from "echarts";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { fromLonLat, toLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import LineString from "ol/geom/LineString";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Icon, Fill, Stroke, Circle, Text } from "ol/style";
import {
  mapConfig,
  getServiceUrl,
  validateApiKey,
} from "../config/mapConfig.js";

let map = null;
let radiationLayer = null; // 辐射区域图层
let pipelineLayer = null; // 管网线路图层

// 响应式数据
const showSidePanel = ref(false);
const showVRViewer = ref(false);
const showThreeVRViewer = ref(false);
const showChartsViewer = ref(false);
const selectedReservoirName = ref("");

// 图表ref引用
const waterQualityChart = ref(null);
const flowAnalysisChart = ref(null);
const waterLevelChart = ref(null);
const sensorCompareChart = ref(null);

// ECharts实例
let chartInstances = {
  waterQuality: null,
  flowAnalysis: null,
  waterLevel: null,
  sensorCompare: null,
};

// 水库详情数据
const reservoirData = ref({
  name: "",
  coordinates: [],
  capacity: 0,
  depth: 0,
  buildYear: 0,
  waterLevel: 0,
  safetyLevel: "",
  lastInspection: "",
  sensors: {
    phValue: 0,
    dissolvedOxygen: 0,
    turbidity: 0,
    temperature: 0,
  },
  flows: {
    inletFlow: 0,
    outletFlow: 0,
    waterLevelHeight: 0,
  },
});

// 湖北利川的坐标 [经度, 纬度]
const liChuanCoordinates = [108.9375, 30.2958];

// 计算进度条宽度的工具函数
const calculateProgressWidth = (value, multiplier = 1) => {
  return Math.min(value * multiplier, 100);
};

onMounted(() => {
  // 确保DOM元素准备就绪后再初始化地图
  setTimeout(() => {
    initMap();
    addLiChuanMarker();
    addReservoirPoints();
    initInteractionLayers();
  }, 100);
});

onUnmounted(() => {
  // 清理地图实例，避免内存泄漏
  if (map) {
    // 移除所有事件监听器
    map.un("pointermove");
    map.un("click");
    // 清理地图
    map.setTarget(null);
    map = null;
  }
});

// 关闭侧边栏
const closeSidePanel = () => {
  showSidePanel.value = false;
  clearRadiationAndPipelines();
  closeAllViews(); // 同时关闭所有视图

  // 清空水库数据
  reservoirData.value = {
    name: "",
    coordinates: [],
    capacity: 0,
    depth: 0,
    buildYear: 0,
    waterLevel: 0,
    safetyLevel: "",
    lastInspection: "",
    sensors: {
      phValue: 0,
      dissolvedOxygen: 0,
      turbidity: 0,
      temperature: 0,
    },
    flows: {
      inletFlow: 0,
      outletFlow: 0,
      waterLevelHeight: 0,
    },
  };
};

// 关闭VR查看器
const closeVRViewer = () => {
  showVRViewer.value = false;
  selectedReservoirName.value = "";
};

// 关闭Three.js VR查看器
const closeThreeVRViewer = () => {
  showThreeVRViewer.value = false;
  // 如果有选中的水库，回到数据分析视图
  if (selectedReservoirName.value) {
    showDataCharts();
  } else {
    selectedReservoirName.value = "";
  }
};

// 全局函数：开始VR看房
window.startVRTour = (reservoirName) => {
  selectedReservoirName.value = reservoirName;
  showThreeVRViewer.value = true; // 使用Three.js HDR查看器
};

// 全局函数：切换管网信息显示
window.toggleNetworkInfo = (reservoirName) => {
  alert(
    `🚰 ${reservoirName}管网详情\n\n当前显示：\n• 供水管网：${
      Math.floor(Math.random() * 3) + 2
    }条主线\n• 排水管网：${
      Math.floor(Math.random() * 2) + 1
    }条支线\n• 应急管网：${
      Math.floor(Math.random() * 2) + 1
    }条备用线\n• 辐射半径：${(Math.random() * 10 + 5).toFixed(
      1
    )}公里\n• 服务人口：${(Math.random() * 5000 + 10000).toFixed(0)}人`
  );
};

// 组件内部函数：VR看房（显示数据分析视图）
const startVRTour = (reservoirName) => {
  selectedReservoirName.value = reservoirName;
  showDataCharts(); // 默认显示数据分析
};

// 显示数据图表
const showDataCharts = () => {
  showChartsViewer.value = true;
  showThreeVRViewer.value = false;
  // 延迟初始化图表，确保DOM已渲染
  setTimeout(() => {
    initCharts();
  }, 100);
};

// 显示VR视图
const showVRView = () => {
  showChartsViewer.value = false;
  showThreeVRViewer.value = true;

  // 🔧 确保有水库名称，如果没有则使用默认值
  if (
    !selectedReservoirName.value ||
    selectedReservoirName.value.trim() === ""
  ) {
    console.warn("⚠️ selectedReservoirName为空，使用默认水库名称");
    selectedReservoirName.value = reservoirData.value?.name || "测试水库1";
  }

  console.log("🥽 启动VR查看器，水库名称:", selectedReservoirName.value);

  // 清理图表实例以释放内存
  cleanupCharts();
};

// 关闭所有视图
const closeAllViews = () => {
  showChartsViewer.value = false;
  showThreeVRViewer.value = false;
  selectedReservoirName.value = "";
  cleanupCharts();
};

// 初始化ECharts图表
const initCharts = () => {
  if (!reservoirData.value.name) return;

  // 初始化水质趋势图
  if (waterQualityChart.value) {
    chartInstances.waterQuality = echarts.init(waterQualityChart.value);
    const waterQualityOption = createWaterQualityChartOption();
    chartInstances.waterQuality.setOption(waterQualityOption);
  }

  // 初始化流量分析图
  if (flowAnalysisChart.value) {
    chartInstances.flowAnalysis = echarts.init(flowAnalysisChart.value);
    const flowAnalysisOption = createFlowAnalysisChartOption();
    chartInstances.flowAnalysis.setOption(flowAnalysisOption);
  }

  // 初始化水位统计图
  if (waterLevelChart.value) {
    chartInstances.waterLevel = echarts.init(waterLevelChart.value);
    const waterLevelOption = createWaterLevelChartOption();
    chartInstances.waterLevel.setOption(waterLevelOption);
  }

  // 初始化传感器对比图
  if (sensorCompareChart.value) {
    chartInstances.sensorCompare = echarts.init(sensorCompareChart.value);
    const sensorCompareOption = createSensorCompareChartOption();
    chartInstances.sensorCompare.setOption(sensorCompareOption);
  }

  // 监听窗口大小变化
  window.addEventListener("resize", handleChartResize);
};

// 清理图表实例
const cleanupCharts = () => {
  Object.values(chartInstances).forEach((chart) => {
    if (chart) {
      chart.dispose();
    }
  });
  chartInstances = {
    waterQuality: null,
    flowAnalysis: null,
    waterLevel: null,
    sensorCompare: null,
  };
  window.removeEventListener("resize", handleChartResize);
};

// 窗口大小变化处理
const handleChartResize = () => {
  Object.values(chartInstances).forEach((chart) => {
    if (chart) {
      chart.resize();
    }
  });
};

// 刷新图表数据
const refreshCharts = () => {
  cleanupCharts();
  setTimeout(() => {
    initCharts();
  }, 100);
};

// 导出数据
const exportData = () => {
  const data = {
    reservoir: reservoirData.value.name,
    timestamp: new Date().toISOString(),
    sensors: reservoirData.value.sensors,
    flows: reservoirData.value.flows,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${
    reservoirData.value.name
  }_数据报告_${new Date().toLocaleDateString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// 创建水质趋势图配置
const createWaterQualityChartOption = () => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    return date.toLocaleDateString();
  });

  return {
    title: {
      text: "🧪 水质监测趋势",
      textStyle: { color: "#ffffff", fontSize: 14 },
      left: 15,
      top: 8,
    },
    backgroundColor: "rgba(15, 35, 65, 0.8)",
    grid: { top: 45, right: 30, bottom: 50, left: 60 },
    xAxis: {
      type: "category",
      data: days,
      axisLabel: { color: "#ffffff", fontSize: 10 },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#ffffff", fontSize: 10 },
    },
    legend: {
      textStyle: { color: "#ffffff", fontSize: 10 },
      top: 25,
    },
    series: [
      {
        name: "pH值",
        type: "line",
        data: Array.from({ length: 7 }, () =>
          (7.0 + Math.random() * 1.8).toFixed(1)
        ),
        smooth: true,
        lineStyle: { color: "#4A90E2" },
      },
      {
        name: "溶解氧",
        type: "line",
        data: Array.from({ length: 7 }, () =>
          (8.0 + Math.random() * 3.5).toFixed(1)
        ),
        smooth: true,
        lineStyle: { color: "#00b894" },
      },
      {
        name: "浊度",
        type: "line",
        data: Array.from({ length: 7 }, () =>
          (1 + Math.random() * 4).toFixed(1)
        ),
        smooth: true,
        lineStyle: { color: "#e17055" },
      },
    ],
  };
};

// 创建流量分析图配置
const createFlowAnalysisChartOption = () => {
  return {
    title: {
      text: "🌊 流量变化分析",
      textStyle: { color: "#ffffff", fontSize: 14 },
      left: 15,
      top: 8,
    },
    backgroundColor: "rgba(15, 35, 65, 0.8)",
    grid: { top: 45, right: 30, bottom: 50, left: 60 },
    xAxis: {
      type: "category",
      data: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
      axisLabel: { color: "#ffffff", fontSize: 10 },
    },
    yAxis: {
      type: "value",
      name: "m³/s",
      nameLocation: "end",
      nameGap: 25,
      axisLabel: { color: "#ffffff", fontSize: 10 },
      nameTextStyle: {
        color: "#ffffff",
        verticalAlign: "bottom",
        padding: [0, 0, 10, 0],
      },
    },
    legend: {
      textStyle: { color: "#ffffff", fontSize: 10 },
      top: 25,
    },
    series: [
      {
        name: "入库流量",
        type: "bar",
        data: [32, 35, 28, 42, 38, 33],
        itemStyle: { color: "#4A90E2" },
      },
      {
        name: "出库流量",
        type: "bar",
        data: [28, 30, 25, 35, 32, 29],
        itemStyle: { color: "#00b894" },
      },
    ],
  };
};

// 创建水位统计图配置
const createWaterLevelChartOption = () => {
  return {
    title: {
      text: "📊 水位统计信息",
      textStyle: { color: "#ffffff", fontSize: 14 },
      left: 15,
      top: 8,
    },
    backgroundColor: "rgba(15, 35, 65, 0.8)",
    grid: { top: 45, right: 30, bottom: 50, left: 60 },
    xAxis: {
      type: "value",
      axisLabel: { color: "#ffffff", fontSize: 10 },
    },
    yAxis: {
      type: "category",
      data: ["警戒水位", "正常水位", "最优水位"],
      axisLabel: { color: "#ffffff", fontSize: 10 },
    },
    series: [
      {
        type: "bar",
        data: [85, 92, 98],
        itemStyle: {
          color: function (params) {
            const colors = ["#e17055", "#fdcb6e", "#00b894"];
            return colors[params.dataIndex];
          },
        },
      },
    ],
  };
};

// 创建传感器对比图配置
const createSensorCompareChartOption = () => {
  return {
    title: {
      text: "⚡ 传感器数据对比",
      textStyle: { color: "#ffffff", fontSize: 14 },
      left: 15,
      top: 8,
    },
    backgroundColor: "rgba(15, 35, 65, 0.8)",
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(0,0,0,0.8)",
      textStyle: { color: "#ffffff" },
    },
    legend: {
      orient: "vertical",
      left: "left",
      textStyle: { color: "#ffffff", fontSize: 10 },
    },
    series: [
      {
        type: "pie",
        radius: "60%",
        center: ["60%", "50%"],
        data: [
          {
            value: reservoirData.value.sensors.phValue,
            name: "pH值",
            itemStyle: { color: "#4A90E2" },
          },
          {
            value: reservoirData.value.sensors.dissolvedOxygen,
            name: "溶解氧",
            itemStyle: { color: "#00b894" },
          },
          {
            value: reservoirData.value.sensors.turbidity,
            name: "浊度",
            itemStyle: { color: "#e17055" },
          },
          {
            value: reservoirData.value.sensors.temperature,
            name: "水温",
            itemStyle: { color: "#fdcb6e" },
          },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };
};

// 组件内部函数：管网信息
const toggleNetworkInfo = (reservoirName) => {
  alert(
    `🚰 ${reservoirName}管网详情\n\n当前显示：\n• 供水管网：${
      Math.floor(Math.random() * 3) + 2
    }条主线\n• 排水管网：${
      Math.floor(Math.random() * 2) + 1
    }条支线\n• 应急管网：${
      Math.floor(Math.random() * 2) + 1
    }条备用线\n• 辐射半径：${(Math.random() * 10 + 5).toFixed(
      1
    )}公里\n• 服务人口：${(Math.random() * 5000 + 10000).toFixed(0)}人`
  );
};

// 全局函数：显示历史数据图表
window.showDataChart = (reservoirName) => {
  alert(
    `📈 显示${reservoirName}的历史数据图表！\n\n包含：\n• 水质变化趋势\n• 流量历史记录\n• 水位波动分析\n• 传感器数据对比\n• 月度/年度报告`
  );
  // TODO: 这里可以集成图表库显示数据可视化
};

// 初始化地图
function initMap() {
  const layers = [];

  // 检查天地图API密钥是否配置
  if (validateApiKey()) {
    console.log("使用天地图卫星地图");

    // 天地图卫星影像底图
    const satelliteUrl = getServiceUrl("satellite");
    if (satelliteUrl) {
      layers.push(
        new TileLayer({
          source: new XYZ({
            url: satelliteUrl,
            crossOrigin: "anonymous",
          }),
          opacity: mapConfig.services.satellite.opacity,
        })
      );
    }

    // 天地图卫星影像注记（地名标注）
    const annotationUrl = getServiceUrl("satelliteAnnotation");
    if (annotationUrl) {
      layers.push(
        new TileLayer({
          source: new XYZ({
            url: annotationUrl,
            crossOrigin: "anonymous",
          }),
          opacity: mapConfig.services.satelliteAnnotation.opacity,
        })
      );
    }
  } else {
    // 备用方案：使用高德地图
    console.warn("天地图API密钥未配置，使用高德地图作为备用底图");
    console.info("请在 src/config/mapConfig.js 中配置您的天地图API密钥");

    layers.push(
      new TileLayer({
        source: new XYZ({
          url: mapConfig.fallbackMaps.gaode,
          crossOrigin: "anonymous",
        }),
        opacity: 1.0,
      })
    );
  }

  // 如果没有有效的图层，使用OpenStreetMap作为最后备用
  if (layers.length === 0) {
    console.warn("所有地图服务不可用，使用OpenStreetMap作为备用底图");
    layers.push(
      new TileLayer({
        source: new XYZ({
          url: mapConfig.fallbackMaps.osm,
          crossOrigin: "anonymous",
        }),
        opacity: 1.0,
      })
    );
  }

  map = new Map({
    target: "map",
    layers: layers,
    view: new View({
      center: fromLonLat(mapConfig.defaultView.center), // 使用配置的利川坐标
      zoom: mapConfig.defaultView.zoom,
      minZoom: mapConfig.defaultView.minZoom,
      maxZoom: mapConfig.defaultView.maxZoom,
    }),
  });
}

// 添加利川标记点
function addLiChuanMarker() {
  // 创建标记点
  const markerFeature = new Feature({
    geometry: new Point(fromLonLat(liChuanCoordinates)),
    name: "湖北利川",
  });

  // 设置标记样式
  markerFeature.setStyle(
    new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({
          color: "#ff4444",
        }),
        stroke: new Stroke({
          color: "#ffffff",
          width: 2,
        }),
      }),
    })
  );

  // 创建矢量数据源和图层
  const vectorSource = new VectorSource({
    features: [markerFeature],
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
  });

  // 添加到地图
  map.addLayer(vectorLayer);
}

// 添加水库点位
function addReservoirPoints() {
  const reservoirFeatures = [];

  // 生成10个随机水库点位
  for (let i = 0; i < 10; i++) {
    // 在利川周围生成更分散的随机坐标（大约±0.4度范围内）
    const randomLon = liChuanCoordinates[0] + (Math.random() - 0.5) * 0.8;
    const randomLat = liChuanCoordinates[1] + (Math.random() - 0.5) * 0.8;

    const reservoirFeature = new Feature({
      geometry: new Point(fromLonLat([randomLon, randomLat])),
      name: `测试水库${i + 1}`,
      type: "reservoir",
      coordinates: [randomLon, randomLat],
    });

    // 设置水库样式 - 图标 + 常显标签
    reservoirFeature.setStyle([
      // 背景圆形
      new Style({
        image: new Circle({
          radius: 14,
          fill: new Fill({
            color: "rgba(74, 144, 226, 0.2)", // 半透明蓝色背景
          }),
          stroke: new Stroke({
            color: "#4A90E2",
            width: 3,
          }),
        }),
      }),
      // 水库图标（使用emoji）
      new Style({
        text: new Text({
          text: "🏞️", // 水库/湖泊emoji
          font: "18px Arial",
          offsetY: -2,
        }),
      }),
      // 常显标签
      new Style({
        text: new Text({
          text: `测试水库${i + 1}`,
          font: "bold 12px Arial",
          offsetY: 30,
          fill: new Fill({
            color: "#2c3e50",
          }),
          stroke: new Stroke({
            color: "#ffffff",
            width: 3,
          }),
        }),
      }),
    ]);

    reservoirFeatures.push(reservoirFeature);
  }

  // 创建水库图层
  const reservoirSource = new VectorSource({
    features: reservoirFeatures,
  });

  const reservoirLayer = new VectorLayer({
    source: reservoirSource,
  });

  // 添加到地图
  map.addLayer(reservoirLayer);

  // 添加鼠标移动事件（悬停效果）
  map.on("pointermove", (event) => {
    const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => {
      if (feature.get("type") === "reservoir") {
        return feature;
      }
    });

    // 检查地图目标元素是否存在，避免cursor设置错误
    const mapTarget = map.getTarget();
    if (mapTarget && mapTarget.style) {
      if (feature) {
        // 改变鼠标样式
        mapTarget.style.cursor = "pointer";
      } else {
        // 恢复鼠标样式
        mapTarget.style.cursor = "";
      }
    }
  });

  // 添加点击事件
  map.on("click", (event) => {
    const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => {
      if (feature.get("type") === "reservoir") {
        return feature;
      }
    });

    if (feature) {
      const name = feature.get("name");
      const coordinates = feature.get("coordinates");

      // 清除之前的辐射区域和管网
      clearRadiationAndPipelines();

      // 地图拉近并更换中心点
      animateToReservoir(coordinates, name);

      // 显示新的辐射区域和管网
      const radiationRadius = showRadiationArea(coordinates, name);
      generatePipelineNetwork(coordinates, name, radiationRadius);

      showReservoirDetails(name, coordinates);
    } else {
      // 点击空白处关闭侧边栏并清除辐射区域
      showSidePanel.value = false;
      clearRadiationAndPipelines();

      // 恢复到原始视图
      restoreOriginalView();
    }
  });
}

// 地图拉近并更换中心点
function animateToReservoir(coordinates, name) {
  const view = map.getView();

  // 平滑动画到水库位置
  view.animate({
    center: fromLonLat(coordinates),
    zoom: 15, // 拉近到15级缩放
    duration: 1200, // 动画持续1.2秒
    easing: (t) => {
      // 使用缓动函数，开始快结束慢
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
  });

  console.log(`地图中心切换到: ${name} (${coordinates[0]}, ${coordinates[1]})`);
}

// 恢复到原始视图
function restoreOriginalView() {
  const view = map.getView();

  // 平滑动画回到利川中心
  view.animate({
    center: fromLonLat(liChuanCoordinates), // 回到利川坐标
    zoom: 10, // 恢复到原始缩放级别
    duration: 1000, // 动画持续1秒
    easing: (t) => {
      // 使用平滑的缓动函数
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
  });

  console.log(
    `地图恢复到原始视图: 利川中心 (${liChuanCoordinates[0]}, ${liChuanCoordinates[1]})`
  );
}

// 显示右侧面板
function showReservoirDetails(name, coordinates) {
  // 显示侧边栏
  showSidePanel.value = true;

  // 🔧 修复：设置选中的水库名称，供VR查看器使用
  selectedReservoirName.value = name;
  console.log("🎯 设置selectedReservoirName:", name);

  // 生成随机水库数据
  const capacity = (Math.random() * 1000 + 100).toFixed(0);
  const depth = (Math.random() * 50 + 10).toFixed(1);
  const buildYear = Math.floor(Math.random() * 30) + 1995;
  const waterLevel = (Math.random() * 20 + 80).toFixed(1);
  const safetyLevel = Math.random() > 0.8 ? "优秀" : "良好";
  const lastInspection = `2024年${Math.floor(Math.random() * 12) + 1}月`;

  // 生成更多传感器数据
  const phValue = (7.2 + Math.random() * 1.6).toFixed(1); // pH: 7.2-8.8
  const dissolvedOxygen = (8.5 + Math.random() * 3).toFixed(1); // 溶解氧: 8.5-11.5 mg/L
  const turbidity = (Math.random() * 5 + 1).toFixed(1); // 浊度: 1-6 NTU
  const temperature = (15 + Math.random() * 10).toFixed(1); // 水温: 15-25°C
  const flowRate = (Math.random() * 50 + 10).toFixed(1); // 流量: 10-60 m³/s
  const inletFlow = (Math.random() * 30 + 20).toFixed(1); // 入库流量: 20-50 m³/s
  const outletFlow = (Math.random() * 25 + 15).toFixed(1); // 出库流量: 15-40 m³/s
  const electricConductivity = (Math.random() * 200 + 300).toFixed(0); // 电导率: 300-500 μS/cm
  const waterLevelHeight = (
    buildYear < 2000 ? 85 + Math.random() * 10 : 90 + Math.random() * 8
  ).toFixed(1);

  // 更新响应式数据
  reservoirData.value = {
    name,
    coordinates,
    capacity: Number(capacity),
    depth: Number(depth),
    buildYear,
    waterLevel: Number(waterLevel),
    safetyLevel,
    lastInspection,
    sensors: {
      phValue: Number(phValue),
      dissolvedOxygen: Number(dissolvedOxygen),
      turbidity: Number(turbidity),
      temperature: Number(temperature),
    },
    flows: {
      inletFlow: Number(inletFlow),
      outletFlow: Number(outletFlow),
      waterLevelHeight: Number(waterLevelHeight),
    },
  };

  console.log(`显示水库详情: ${name}`, reservoirData.value);

  // 保留原有的HTML结构作为备份（将被模板替换）
  /*
    <div class="sensor-section">
      <h4>🧪 水质监测数据</h4>
      <div class="sensor-grid">
        <div class="sensor-card ph-sensor">
          <div class="sensor-icon">pH</div>
          <div class="sensor-value">${phValue}</div>
          <div class="sensor-label">酸碱度</div>
          <div class="sensor-status ${
            phValue >= 7.0 && phValue <= 8.5 ? "status-good" : "status-warning"
          }">
            ${phValue >= 7.0 && phValue <= 8.5 ? "正常" : "需关注"}
          </div>
        </div>
        
        <div class="sensor-card oxygen-sensor">
          <div class="sensor-icon">O₂</div>
          <div class="sensor-value">${dissolvedOxygen}</div>
          <div class="sensor-label">溶解氧 mg/L</div>
          <div class="sensor-status ${
            dissolvedOxygen >= 8.0 ? "status-good" : "status-warning"
          }">
            ${dissolvedOxygen >= 8.0 ? "优良" : "一般"}
          </div>
        </div>
        
        <div class="sensor-card turbidity-sensor">
          <div class="sensor-icon">💧</div>
          <div class="sensor-value">${turbidity}</div>
          <div class="sensor-label">浊度 NTU</div>
          <div class="sensor-status ${
            turbidity <= 4.0 ? "status-good" : "status-warning"
          }">
            ${turbidity <= 4.0 ? "清澈" : "轻微浑浊"}
          </div>
        </div>
        
        <div class="sensor-card temp-sensor">
          <div class="sensor-icon">🌡️</div>
          <div class="sensor-value">${temperature}</div>
          <div class="sensor-label">水温 °C</div>
          <div class="sensor-status status-good">正常</div>
        </div>
      </div>
    </div>
    
    <div class="sensor-section">
      <h4>🌊 流量监测数据</h4>
      <div class="flow-container">
        <div class="flow-item">
          <div class="flow-header">
            <span class="flow-icon">📥</span>
            <span class="flow-title">入库流量</span>
          </div>
          <div class="flow-value">${inletFlow} m³/s</div>
          <div class="flow-bar">
            <div class="flow-progress" style="width: ${Math.min(
              inletFlow * 2,
              100
            )}%"></div>
          </div>
        </div>
        
        <div class="flow-item">
          <div class="flow-header">
            <span class="flow-icon">📤</span>
            <span class="flow-title">出库流量</span>
          </div>
          <div class="flow-value">${outletFlow} m³/s</div>
          <div class="flow-bar">
            <div class="flow-progress outlet" style="width: ${Math.min(
              outletFlow * 2.5,
              100
            )}%"></div>
          </div>
        </div>
        
        <div class="flow-item">
          <div class="flow-header">
            <span class="flow-icon">📊</span>
            <span class="flow-title">水位高度</span>
          </div>
          <div class="flow-value">${waterLevelHeight} m</div>
          <div class="flow-bar">
            <div class="flow-progress level" style="width: ${waterLevelHeight}%"></div>
          </div>
        </div>
      </div>
    </div>
    
     

     
   */
}

// 初始化交互图层
function initInteractionLayers() {
  // 创建辐射区域图层
  radiationLayer = new VectorLayer({
    source: new VectorSource(),
    style: new Style({
      fill: new Fill({
        color: "rgba(74, 144, 226, 0.15)",
      }),
      stroke: new Stroke({
        color: "#4A90E2",
        width: 2,
        lineDash: [10, 5],
      }),
    }),
  });

  // 创建管网线路图层
  pipelineLayer = new VectorLayer({
    source: new VectorSource(),
    style: new Style({
      stroke: new Stroke({
        color: "#00b894",
        width: 3,
        lineDash: [15, 8],
      }),
    }),
  });

  // 添加到地图
  map.addLayer(radiationLayer);
  map.addLayer(pipelineLayer);
}

// 显示辐射区域
function showRadiationArea(centerCoordinates, reservoirName) {
  const center = fromLonLat(centerCoordinates);

  // 生成不规则辐射区域
  const baseRadius = (Math.random() * 0.1 + 0.05) * 0.5; // 基础半径 0.025-0.075度
  const irregularPoints = [];
  const numPoints = 24; // 减少点数让形状更自然

  // 生成随机种子，为每个水库创建一致的不规则形状
  let seed = centerCoordinates[0] * 1000 + centerCoordinates[1] * 1000;
  const seededRandom = () => {
    seed = seed * 9301 + 49297;
    return (seed / 233280.0) % 1.0;
  };

  // 预生成一些随机扰动值（使用种子随机数）
  const radiusVariations = [];
  const angleOffsets = [];
  for (let i = 0; i < numPoints; i++) {
    radiusVariations.push(0.6 + seededRandom() * 0.8); // 半径变化 60%-140%
    angleOffsets.push((seededRandom() - 0.5) * 0.3); // 角度偏移
  }

  // 生成不规则边界点
  for (let i = 0; i < numPoints; i++) {
    const baseAngle = (i / numPoints) * 2 * Math.PI;
    const angleOffset = angleOffsets[i];
    const angle = baseAngle + angleOffset;

    // 使用变化的半径创建不规则形状
    let radiusMultiplier = radiusVariations[i];

    // 添加一些平滑的噪声
    const noiseAngle1 = baseAngle * 3;
    const noiseAngle2 = baseAngle * 5;
    const noise = Math.sin(noiseAngle1) * 0.15 + Math.cos(noiseAngle2) * 0.1;
    radiusMultiplier += noise;

    // 确保不会太小或太大
    radiusMultiplier = Math.max(0.4, Math.min(1.6, radiusMultiplier));

    const actualRadius = baseRadius * radiusMultiplier;
    const x = centerCoordinates[0] + actualRadius * Math.cos(angle);
    const y = centerCoordinates[1] + actualRadius * Math.sin(angle);

    irregularPoints.push([x, y]);
  }

  // 添加一些额外的细节点来增加不规则感
  const detailPoints = [];
  for (let i = 0; i < irregularPoints.length; i++) {
    const current = irregularPoints[i];
    const next = irregularPoints[(i + 1) % irregularPoints.length];

    detailPoints.push(current);

    // 在每两个点之间添加一个随机偏移的中间点
    if (seededRandom() > 0.6) {
      // 60%的概率添加细节点
      const midX = (current[0] + next[0]) / 2;
      const midY = (current[1] + next[1]) / 2;

      // 添加随机偏移
      const offsetDistance = baseRadius * 0.1 * (seededRandom() - 0.5);
      const perpAngle =
        Math.atan2(next[1] - current[1], next[0] - current[0]) + Math.PI / 2;

      const detailX = midX + offsetDistance * Math.cos(perpAngle);
      const detailY = midY + offsetDistance * Math.sin(perpAngle);

      detailPoints.push([detailX, detailY]);
    }
  }

  detailPoints.push(detailPoints[0]); // 闭合形状

  const radiationFeature = new Feature({
    geometry: new Polygon([detailPoints.map((coord) => fromLonLat(coord))]),
    name: `${reservoirName}辐射区域`,
  });

  radiationLayer.getSource().addFeature(radiationFeature);

  // 返回平均半径供管网生成使用
  return baseRadius;
}

// 生成管网线路
function generatePipelineNetwork(
  centerCoordinates,
  reservoirName,
  radiationRadius
) {
  // 生成3-6条管网线路
  const numPipelines = Math.floor(Math.random() * 4) + 3;

  for (let i = 0; i < numPipelines; i++) {
    // 随机生成终点，确保在辐射区域内
    const angle = Math.random() * 2 * Math.PI;
    // 终点距离不超过辐射半径的80-95%，确保在区域内
    const distance = radiationRadius * (Math.random() * 0.15 + 0.8); // 80%-95%辐射半径

    const endLon = centerCoordinates[0] + distance * Math.cos(angle);
    const endLat = centerCoordinates[1] + distance * Math.sin(angle);

    // 创建弯曲的管网线路（添加中间控制点），确保中间点也在合理范围内
    const midDistance = distance * 0.6; // 中间点距离为60%
    const midAngleOffset = (Math.random() - 0.5) * 0.5; // 角度偏移
    const midLon =
      centerCoordinates[0] + midDistance * Math.cos(angle + midAngleOffset);
    const midLat =
      centerCoordinates[1] + midDistance * Math.sin(angle + midAngleOffset);

    const lineCoordinates = [
      fromLonLat(centerCoordinates),
      fromLonLat([midLon, midLat]),
      fromLonLat([endLon, endLat]),
    ];

    const pipelineFeature = new Feature({
      geometry: new LineString(lineCoordinates),
      name: `${reservoirName}管网线路${i + 1}`,
      type: "pipeline",
    });

    // 根据管网类型设置不同样式和图标
    const pipelineTypes = ["supply", "drainage", "emergency"];
    const pipelineType = pipelineTypes[i % 3];

    let strokeColor = "#00b894"; // 供水管网
    let shadowColor = "rgba(0, 184, 148, 0.3)";
    let pipeEmoji = "💧"; // 供水管网图标

    if (pipelineType === "drainage") {
      strokeColor = "#e17055"; // 排水管网
      shadowColor = "rgba(225, 112, 85, 0.3)";
      pipeEmoji = "🚰"; // 排水管网图标
    }
    if (pipelineType === "emergency") {
      strokeColor = "#fdcb6e"; // 应急管网
      shadowColor = "rgba(253, 203, 110, 0.3)";
      pipeEmoji = "⚡"; // 应急管网图标
    }

    // 创建管道的多层样式效果
    const pipelineStyles = [
      // 底层阴影效果
      new Style({
        stroke: new Stroke({
          color: shadowColor,
          width: 7,
          lineDash: [20, 10],
        }),
      }),
      // 主管道
      new Style({
        stroke: new Stroke({
          color: strokeColor,
          width: 4,
          lineCap: "round",
          lineJoin: "round",
        }),
      }),
      // 管道内部高光
      new Style({
        stroke: new Stroke({
          color: `${strokeColor}CC`, // 添加透明度
          width: 2,
          lineDash: [25, 15],
        }),
      }),
    ];

    pipelineFeature.setStyle(pipelineStyles);
    pipelineLayer.getSource().addFeature(pipelineFeature);

    // 在管道中点添加流向箭头
    const midPoint = fromLonLat([midLon, midLat]);
    const arrowFeature = new Feature({
      geometry: new Point(midPoint),
      name: `${reservoirName}流向指示${i + 1}`,
      type: "flow-arrow",
    });

    const arrowAngle = Math.atan2(endLat - midLat, endLon - midLon);
    arrowFeature.setStyle(
      new Style({
        text: new Text({
          text: "▶", // 箭头符号
          font: "bold 12px Arial",
          fill: new Fill({ color: strokeColor }),
          stroke: new Stroke({ color: "#ffffff", width: 2 }),
          rotation: arrowAngle,
          offsetY: 0,
        }),
      })
    );

    pipelineLayer.getSource().addFeature(arrowFeature);

    // 在管道起点添加管道类型图标
    const startIconFeature = new Feature({
      geometry: new Point(fromLonLat(centerCoordinates)),
      name: `${reservoirName}管道起点${i + 1}`,
      type: "pipe-start",
    });

    startIconFeature.setStyle(
      new Style({
        text: new Text({
          text: pipeEmoji,
          font: "16px Arial",
          offsetX: Math.cos(angle) * 15, // 根据方向偏移
          offsetY: Math.sin(angle) * -15,
          fill: new Fill({ color: strokeColor }),
          stroke: new Stroke({ color: "#ffffff", width: 2 }),
        }),
      })
    );

    pipelineLayer.getSource().addFeature(startIconFeature);

    // 在终点添加专业设施标记
    const facilityFeature = new Feature({
      geometry: new Point(fromLonLat([endLon, endLat])),
      name: `${reservoirName}设施点${i + 1}`,
      type: "facility",
    });

    // 根据管网类型选择不同的设施图标
    let facilityIcon = "🏭"; // 默认工厂图标
    let facilitySize = "14px";

    if (pipelineType === "supply") {
      facilityIcon = "🏗️"; // 供水设施
    } else if (pipelineType === "drainage") {
      facilityIcon = "🏭"; // 处理厂
    } else if (pipelineType === "emergency") {
      facilityIcon = "🚨"; // 应急设施
    }

    facilityFeature.setStyle([
      // 设施背景圆形
      new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({
            color: strokeColor,
          }),
          stroke: new Stroke({
            color: "#ffffff",
            width: 2,
          }),
        }),
      }),
      // 设施图标
      new Style({
        text: new Text({
          text: facilityIcon,
          font: `${facilitySize} Arial`,
          fill: new Fill({ color: "#ffffff" }),
          offsetY: -1,
        }),
      }),
    ]);

    pipelineLayer.getSource().addFeature(facilityFeature);

    // 添加阀门标记（在管道中间段）
    if (Math.random() > 0.6) {
      // 60% 概率添加阀门
      const valveDistance = distance * 0.3; // 在30%位置
      const valveLon =
        centerCoordinates[0] + valveDistance * Math.cos(angle + midAngleOffset);
      const valveLat =
        centerCoordinates[1] + valveDistance * Math.sin(angle + midAngleOffset);

      const valveFeature = new Feature({
        geometry: new Point(fromLonLat([valveLon, valveLat])),
        name: `${reservoirName}阀门${i + 1}`,
        type: "valve",
      });

      valveFeature.setStyle(
        new Style({
          text: new Text({
            text: "⚪", // 阀门符号
            font: "10px Arial",
            fill: new Fill({ color: strokeColor }),
            stroke: new Stroke({ color: "#ffffff", width: 1.5 }),
          }),
        })
      );

      pipelineLayer.getSource().addFeature(valveFeature);
    }
  }
}

// 清除辐射区域和管网线路
function clearRadiationAndPipelines() {
  if (radiationLayer) {
    radiationLayer.getSource().clear();
  }
  if (pipelineLayer) {
    pipelineLayer.getSource().clear();
  }
}
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.map {
  width: 100%;
  height: 100%;
  border-radius: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.map:hover {
  filter: brightness(1.05) contrast(1.05);
}

/* 移除地图偏移效果，使用固定定位 */

/* 地图信息框样式 - 下层背景，不占据空间 */
.map-info {
  position: fixed;
  top: 20px;
  left: 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(240, 248, 255, 0.85) 100%
  );
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(74, 144, 226, 0.2);
  box-shadow: 0 10px 30px rgba(74, 144, 226, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 1000; /* 低于VR悬浮框的1500 */
  width: 280px;
  backdrop-filter: blur(15px);
  transition: all 0.3s ease;
  overflow: hidden;
  pointer-events: auto;
}

.map-info::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #4a90e2, #74b9ff, #00b894);
  border-radius: 16px 16px 0 0;
}

.map-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px rgba(74, 144, 226, 0.15),
    0 6px 16px rgba(0, 0, 0, 0.1);
}

.map-info h3 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.map-info p {
  margin: 8px 0;
  color: #5a6c7d;
  font-size: 13px;
  line-height: 1.5;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(74, 144, 226, 0.08);
  transition: all 0.2s ease;
}

.map-info p:hover {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(74, 144, 226, 0.15);
  transform: translateX(2px);
}

.legend {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(74, 144, 226, 0.1);
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 12px;
}

.legend small {
  color: #5a6c7d;
  font-size: 11px;
  line-height: 1.4;
  display: block;
  margin: 4px 0;
  padding: 2px 0;
}

/* 右侧面板样式 - 简化版本 */
.side-panel {
  position: fixed;
  top: 20px;
  right: 2vw; /* 使用视窗宽度 */
  bottom: 20px;
  width: 23vw; /* 使用视窗宽度，1/4空间，3:1比例 */
  background: rgba(15, 35, 65, 0.95);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  z-index: 2000;
  overflow: hidden;
  display: none;
}

.side-panel-visible {
  display: block;
}

.side-panel-header {
  padding: 20px;
  background: rgba(74, 144, 226, 0.15);
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 移除装饰性元素 */

.side-panel-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
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

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.side-panel-content {
  color: white;
  padding: 20px;
  height: calc(100vh - 140px);
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60%;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
  opacity: 0.7;
}

.empty-state p {
  margin: 12px 0;
  font-size: 16px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.sensor-section {
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(74, 144, 226, 0.2);
}

/* 简化传感器区域样式 */

.sensor-section h4 {
  margin: 0 0 16px 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
}

/* 传感器网格布局 */
.sensor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.sensor-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 1px solid rgba(74, 144, 226, 0.2);
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

/* 移除复杂的卡片动画 */

.sensor-icon {
  font-size: 20px;
  font-weight: bold;
  color: #74b9ff;
  margin-bottom: 6px;
  display: block;
}

.sensor-value {
  font-size: 24px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 8px;
  line-height: 1;
}

.sensor-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
  font-weight: 400;
}

.sensor-status {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
  display: inline-block;
}

/* 流量监测容器 */
.flow-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 18px;
}

.flow-item {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(74, 144, 226, 0.2);
}

.flow-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(74, 144, 226, 0.15);
}

.flow-icon {
  font-size: 18px;
}

.flow-title {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin-bottom: 6px;
}

.flow-value {
  font-size: 20px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 12px;
}

.flow-bar {
  width: 100%;
  height: 8px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.flow-progress {
  height: 100%;
  background: #4a90e2;
  border-radius: 4px;
}

.flow-progress.outlet {
  background: #00b894;
}

.flow-progress.level {
  background: #6c5ce7;
}

/* 简化信息网格 */

/* 状态颜色 */
.status-good {
  background: linear-gradient(135deg, #00b894, #00cec9);
  color: white !important;
}

.status-warning {
  background: linear-gradient(135deg, #fdcb6e, #e17055);
  color: white !important;
}

.status-online {
  color: #00b894 !important;
}

.update-time {
  color: #4a90e2 !important;
}

/* 滚动条样式 */
.side-panel-content::-webkit-scrollbar {
  width: 6px;
}

.side-panel-content::-webkit-scrollbar-track {
  background: rgba(74, 144, 226, 0.1);
  border-radius: 3px;
}

.side-panel-content::-webkit-scrollbar-thumb {
  background: rgba(74, 144, 226, 0.3);
  border-radius: 3px;
}

.side-panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 144, 226, 0.5);
}

/* 视图切换区域 */
.view-switch-section {
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(74, 144, 226, 0.2);
}

.view-switch-section h4 {
  margin: 0 0 16px 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
}

.switch-buttons {
  display: flex;
  gap: 8px;
}

.switch-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.switch-btn:hover {
  background: rgba(74, 144, 226, 0.2);
  border-color: rgba(74, 144, 226, 0.5);
  color: white;
}

.switch-btn.active {
  background: linear-gradient(135deg, #4a90e2 0%, #74b9ff 100%);
  border-color: rgba(116, 185, 255, 0.8);
  color: white;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
}

/* 操作按钮区域 */
.action-section {
  margin-top: 20px;
  padding: 20px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(74, 144, 226, 0.2);
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.action-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn:hover {
  background: rgba(74, 144, 226, 0.2);
  border-color: rgba(74, 144, 226, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.2);
}

.refresh-btn {
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  border-color: rgba(0, 206, 201, 0.5);
}

.refresh-btn:hover {
  background: linear-gradient(135deg, #00a085 0%, #00b7b7 100%);
  box-shadow: 0 4px 12px rgba(0, 184, 148, 0.3);
}

.export-btn {
  background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%);
  border-color: rgba(225, 112, 85, 0.5);
}

.export-btn:hover {
  background: linear-gradient(135deg, #f39c12 0%, #d63031 100%);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
}

/* 移除装饰元素 */

.network-section {
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(74, 144, 226, 0.2);
}

.network-section h4 {
  margin: 0 0 16px 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
}

.network-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.network-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(74, 144, 226, 0.1);
}

.network-icon {
  font-size: 14px;
  font-weight: bold;
  min-width: 16px;
}

.network-btn {
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(0, 184, 148, 0.25);
  border: 2px solid rgba(0, 206, 201, 0.3);
}

.network-btn:hover {
  background: linear-gradient(135deg, #00a085 0%, #00b7b7 100%);
}

.vr-btn {
  background: linear-gradient(135deg, #4a90e2 0%, #74b9ff 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.25);
  border: 2px solid rgba(116, 185, 255, 0.3);
}

.vr-btn:hover {
  background: linear-gradient(135deg, #3a7bd5 0%, #6bb6ff 100%);
}

.details-btn {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(74, 144, 226, 0.1) 50%,
    rgba(255, 255, 255, 0.12) 100%
  );
  color: #ffffff;
  border: 2px solid rgba(74, 144, 226, 0.4);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.details-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(74, 144, 226, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .side-panel {
    top: 60vh;
    bottom: 10px;
    left: 10px;
    right: 10px;
    width: auto;
  }

  .side-panel-header {
    padding: 15px;
  }

  .side-panel-content {
    padding: 15px;
    height: calc(100vh - 120px);
  }

  .map-info {
    position: fixed;
    top: 10px;
    left: 10px;
    width: 250px;
    opacity: 0.9;
  }

  .action-section {
    flex-direction: row;
    gap: 8px;
  }

  .vr-btn,
  .details-btn,
  .network-btn {
    flex: 1;
    padding: 10px 12px;
    font-size: 12px;
  }

  .sensor-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .sensor-card {
    padding: 12px;
  }

  .sensor-value {
    font-size: 20px;
  }

  .flow-value {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .map-info {
    width: 220px;
    padding: 15px;
    top: 5px;
    left: 5px;
  }

  .map-info h3 {
    font-size: 14px;
  }

  .map-info p {
    font-size: 11px;
    padding: 4px 8px;
    margin: 6px 0;
  }

  .legend {
    padding: 8px;
  }

  .legend small {
    font-size: 10px;
  }
  .action-section {
    flex-direction: column;
    gap: 10px;
    padding: 15px;
  }

  .sensor-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .sensor-card {
    padding: 12px;
  }

  .sensor-value {
    font-size: 22px;
  }

  .sensor-section {
    padding: 15px;
    margin-bottom: 15px;
  }

  .flow-container {
    gap: 12px;
  }

  .flow-item {
    padding: 12px;
  }
}

/* ECharts图表查看器样式 */
.charts-area {
  position: fixed;
  top: 20px;
  left: 20px;
  bottom: 20px;
  right: 26vw; /* 为右侧栏留出空间 */
  z-index: 1200; /* 高于map-info的1000 */
  animation: slideInLeft 0.4s ease;
  pointer-events: auto;
}

.charts-container {
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

.charts-header {
  padding: 20px;
  background: rgba(74, 144, 226, 0.15);
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.charts-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
}

.charts-close-btn {
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
  transition: all 0.2s ease;
}

.charts-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.charts-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 20px;
  flex: 1;
  min-height: 0;
}

.chart-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(74, 144, 226, 0.2);
  padding: 15px;
  display: flex;
  flex-direction: column;
  min-height: 250px;
}

.chart-container {
  flex: 1;
  min-height: 200px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .charts-area {
    right: 28vw;
  }
}

@media (max-width: 768px) {
  .charts-area {
    top: 10px;
    left: 10px;
    right: 10px;
    bottom: 40vh; /* 为下方的侧边栏留出空间 */
  }

  .side-panel {
    top: 62vh;
    bottom: 10px;
    left: 10px;
    right: 10px;
    width: auto;
  }

  .charts-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 10px;
  }

  .chart-item {
    min-height: 160px;
    padding: 10px;
  }

  .charts-content {
    padding: 15px;
    gap: 15px;
  }

  .switch-buttons {
    flex-direction: row;
    gap: 6px;
  }

  .switch-btn {
    padding: 8px 10px;
    font-size: 12px;
  }

  .action-btn {
    padding: 10px 12px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .charts-area {
    bottom: 45vh;
  }

  .side-panel {
    top: 57vh;
  }

  .charts-header {
    padding: 12px;
  }

  .charts-header h3 {
    font-size: 15px;
  }

  .charts-grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
    gap: 8px;
  }

  .chart-item {
    min-height: 140px;
    padding: 8px;
  }

  .charts-content {
    padding: 10px;
    gap: 10px;
  }

  .view-switch-section {
    padding: 15px;
    margin-bottom: 15px;
  }

  .action-section {
    padding: 15px;
  }

  .switch-btn {
    padding: 8px;
    font-size: 11px;
  }

  .action-btn {
    padding: 10px;
    font-size: 11px;
  }
}
</style> 