import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  entry: {
    index: 'src/index.ts',
    vite: 'src/vite.ts',
    utils: 'src/utils.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  shims: true,
  treeshake: true,
  external: ['vite', 'esbuild'],
})
