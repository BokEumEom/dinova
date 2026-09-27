import { defineConfig } from 'vite';
export default defineConfig({
  build: { rollupOptions: { output: { manualChunks: { three: ['three', 'three/addons/loaders/GLTFLoader.js', 'three/addons/controls/OrbitControls.js', 'three/addons/geometries/ConvexGeometry.js'] } } }, chunkSizeWarningLimit: 650 },
  server: { host: '127.0.0.1' },
});
