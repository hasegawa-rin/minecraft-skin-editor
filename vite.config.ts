import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Three.js を独立チャンクに隔離済み（下記 manualChunks）。
    // その three チャンクは元々大きいので、サイズ警告の閾値を 1000kB に引き上げる。
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Three.js 関連を別チャンクに分離する。
        // 初期メインチャンクが軽くなり、3Dライブラリは独立ファイルとして
        // 並列ロード・長期キャッシュできる（アプリ更新時に再ダウンロード不要）。
        manualChunks(id: string) {
          if (
            id.includes('node_modules/three') ||
            id.includes('node_modules/@react-three')
          ) {
            return 'three'
          }
        },
      },
    },
  },
})
