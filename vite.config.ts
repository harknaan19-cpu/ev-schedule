
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Replace 'repo-name' with your actual repository name if deploying to username.github.io/repo-name/
  base: './', 
  build: {
    outDir: 'dist',
  }
});
