
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig({
    plugins: [react({ parserOptions: { sourceType: 'module', allowImportExportEverywhere: true } })],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
      minify: 'terser',
      reportCompressedSize: false,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          passes: 3,
          pure_funcs: ['console.log', 'console.info', 'console.warn'],
          toplevel: true,
          unsafe: true,
          unsafe_methods: true,
          inline: 3,
          dead_code: true,
          sequences: true,
          reduce_vars: true,
        },
        mangle: {
          toplevel: true,
          properties: {
            regex: /^_/,
          },
          keep_fnames: false,
        },
        output: {
          comments: false,
          beautify: false,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-motion': ['motion'],
            'vendor-icons': ['lucide-react'],
            'vendor-ui': [
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-aspect-ratio',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-collapsible',
              '@radix-ui/react-context-menu',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-hover-card',
              '@radix-ui/react-label',
              '@radix-ui/react-menubar',
              '@radix-ui/react-navigation-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-progress',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slider',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toggle',
              '@radix-ui/react-toggle-group',
              '@radix-ui/react-tooltip',
            ],
            'vendor-utils': [
              'class-variance-authority',
              'clsx',
              'tailwind-merge',
            ],
            'vendor-forms': [
              'cmdk',
              'embla-carousel-react',
              'input-otp',
              'next-themes',
              'react-day-picker',
              'react-hook-form',
              'react-resizable-panels',
              'recharts',
              'sonner',
              'vaul',
            ],
          },
          compact: true,
          generatedCode: {
            constBindings: true,
            arrowFunctions: true,
          },
          entryFileNames: 'js/[name].[hash].js',
          chunkFileNames: 'js/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
      chunkSizeWarningLimit: 600,
      sourcemap: false,
      emptyOutDir: true,
      manifest: false,
      ssrManifest: false,
    },
    server: {
      port: 3000,
      middlewareMode: false,
      hmr: {
        protocol: 'ws',
        timeout: 60000,
      },
    },
    preview: {
      port: 3000,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'motion',
        'lucide-react',
        '@radix-ui/react-dialog',
        '@radix-ui/react-popover',
      ],
      exclude: ['build'],
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
  });