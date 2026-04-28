import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.GITHUB_ACTIONS && repoName ? `/${repoName}/` : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [vue()],
  server: {
    port: 3000,
    strictPort: true,
  },
})
