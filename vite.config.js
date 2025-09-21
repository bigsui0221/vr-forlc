import {
  fileURLToPath,
  URL
} from 'node:url'

import {
  defineConfig
} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src',
        import.meta.url))
    },
  },
  server: {
    open: true, // 启动时自动打开浏览器
    port: 5173, // 修改为5173避免与后端3000端口冲突
    host: true, // 可选：允许外部访问
    cors: true, // 启用跨域
    hmr: {
      overlay: true, // 热更新错误覆盖层
      port: 3001 // HMR 专用端口
    },
    watch: {
      // 文件监听配置
      usePolling: true,
      interval: 100,
      ignored: ['**/node_modules/**', '**/dist/**']
    },
    // 配置代理，转发API和瓦片请求到后端服务器
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/tiles': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // 构建配置
  build: {
    sourcemap: true, // 生成源码映射，便于调试
    watch: {
      // 构建时也支持文件监听
      include: 'src/**'
    }
  },
})