import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Code splitting 優化
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 將 React 相關庫分離到單獨 chunk
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'react-vendor'
          }
          // 將 Supabase 分離到單獨 chunk
          if (id.includes('node_modules/@supabase')) {
            return 'supabase'
          }
        }
      }
    },
    // 降低 chunk 大小警告閾值
    chunkSizeWarningLimit: 500,
    // 啟用 sourcemap 以便除錯
    sourcemap: false
  }
})
