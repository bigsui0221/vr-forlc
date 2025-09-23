// 地图配置文件
// 天地图API密钥配置

export const mapConfig = {
  // 天地图API密钥
  // 请在天地图官网申请：https://www.tianditu.gov.cn/
  // 注册 -> 控制台 -> 应用管理 -> 创建新应用
  tiandituKey: "f33589d6070e9f17ff8459e927235d3d", // 请替换为您申请的实际密钥

  // 备用密钥（可选）
  backupKeys: [
    // "备用密钥1",
    // "备用密钥2"
  ],

  // 地图服务配置
  services: {
    // 卫星影像底图
    satellite: {
      url: "https://t{0-7}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=",
      opacity: 1.0
    },

    // 卫星影像注记（地名标注）
    satelliteAnnotation: {
      url: "https://t{0-7}.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=",
      opacity: 0.8
    },

    // 矢量地图（备选）
    vector: {
      url: "https://t{0-7}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=",
      opacity: 1.0
    },

    // 矢量注记（备选）
    vectorAnnotation: {
      url: "https://t{0-7}.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=",
      opacity: 1.0
    }
  },

  // 地图初始配置
  defaultView: {
    center: [108.9375, 30.2958], // 利川坐标
    zoom: 10,
    minZoom: 5,
    maxZoom: 18
  },

  // 备用地图服务（无需API密钥）
  fallbackMaps: {
    // OpenStreetMap
    osm: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",

    // 高德地图卫星（原配置）
    gaode: "https://webst0{1-4}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}"
  }
};

// 获取完整的服务URL
export function getServiceUrl(serviceType, apiKey = null) {
  const key = apiKey || mapConfig.tiandituKey;
  const service = mapConfig.services[serviceType];

  if (!service) {
    console.error(`未找到服务类型: ${serviceType}`);
    return null;
  }

  if (!key || key === "您的天地图API密钥") {
    console.warn("天地图API密钥未配置，请在mapConfig.js中设置您的密钥");
    return null;
  }

  return service.url + key;
}

// 检查API密钥是否有效
export function validateApiKey(key = null) {
  const testKey = key || mapConfig.tiandituKey;
  return testKey && testKey !== "您的天地图API密钥" && testKey.length > 10;
}
