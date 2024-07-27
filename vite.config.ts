import path from 'path';
import process from 'process';
import image from '@rollup/plugin-image';
import { VitePWA } from 'vite-plugin-pwa';
import { PluginOption, defineConfig } from 'vite';
import fs from 'fs';

const pathResolve = (rest: string) => path.join(process.cwd(), rest);

const tsconfig = JSON.parse(
  fs
    .readFileSync(pathResolve('tsconfig.json'))
    .toString()
    .replace(/\,[\s\n]*}/g, '}'),
);

export default defineConfig((env) => {
  const isDev = env.mode === 'development';

  const plugins: PluginOption[] = [
    image() as any,
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      manifest: {
        short_name: 'guoxiaoyou',
        name: 'guoxiaoyou',
        description: 'guoxiaoyou editor',
        icons: [
          {
            src: 'vite.svg',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
        start_url: '/',
        display: 'standalone',
        theme_color: 'cornflowerblue',
        background_color: '#fff',
      },
    }),
  ];

  if (isDev) {
  }

  return {
    plugins,
    resolve: {
      alias: Object.keys(tsconfig.compilerOptions.paths).map((alias) => {
        alias = alias.split('/')[0];
        return {
          find: alias,
          replacement: pathResolve(alias.replace('@', '')),
        };
      }),
      extensions: ['.ts', '.js', '.json'],
    },
    esbuild: {
      minifyWhitespace: true,
      minifyIdentifiers: true,
      minifySyntax: true,
      charset: 'utf8',
      treeShaking: true,
      target: tsconfig.compilerOptions.target,
    },
    optimizeDeps: {
      esbuildOptions: {
        keepNames: true,
      },
      force: true,
    },
    assetsInclude: [
      /\.(png|jpeg|gif|jpg|svg|webp|avif)$/,
      /\.(mp4|webm|m3u8|avi)$/,
      /\.(ttf|woff|woff2|eot|otf)$/,
    ],
    server: {
      open: false,
      cors: true,
      hmr: {
        overlay: true, //是否覆盖报错，若为false，则不会显示错误提示界面
      },
    },
    build: {
      target: 'chrome108',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      // css代码分离，默认会在不同异步chunk块加载时插入（css懒加载），否则所有css会抽取到一个css文件中
      cssCodeSplit: true,
      // 开发插件库时所能用到
      // lib: {}
    },
  };
});
