<script setup>
import MapView from './components/MapView.vue'
</script>

<template>
  <div class="app">
    <MapView />
  </div>
</template>

<style>
/* 引入 OpenLayers 样式 */
@import 'ol/ol.css';

/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

#app {
  height: 100vh;
}

.app {
  height: 100%;
}
</style>
