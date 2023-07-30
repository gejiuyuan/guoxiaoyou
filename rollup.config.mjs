import { createRequire } from "module";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import { readFile, readFileSync } from "fs";

if (!process.env.PACKAGE_TARGET) {
  throw new Error("请指定要打包的模块");
}

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import typescript from "rollup-plugin-typescript2";
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";
//rollup默认采用es module引用方式，该插件可支持编译使用commonjs的库
import commonjs from "@rollup/plugin-commonjs";
//rollup默认无法去处理import _ from 'lodash'这类的模块引入，因此需要此插件解析，从而打包进文件
import nodeResolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";

const packagesPath = path.join(__dirname, "packages");

const packageDir = path.join(packagesPath, process.env.PACKAGE_TARGET);

const parse = (dir) => path.join(packageDir, dir);

const libName = path.basename(packageDir);

const configs = {
  esm: {
    file: parse(`dist/${libName}.esm.js`),
    format: "esm", // cjs iife umd amd es system
    name: libName,
    exports: "named",
    inlineDynamicImports: true,
  },
  cjs: {
    file: parse(`dist/${libName}.cjs.js`),
    format: "cjs",
    name: libName,
    //options：default（只能export default）、named（支持export和export default共存）、none（不需要export、export default时）
    exports: "named",
  },
  umd: {
    file: parse(`dist/${libName}.min.js`),
    format: "umd",
    name: libName,
    exports: "named",
    plugins: [
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        format: {
          comments: false,
        },
      }),
    ],
    extend: true,
  },
};

const pkg = require(parse("package.json"));
const customOptions = pkg.buildOptions || {};

const createBundleconf = (type) => {
  const output = configs[type];

  Object.assign(output, customOptions);

  return {
    input: parse("index.ts"),
    output,
    plugins: [
      nodeResolve({
        extensions: [".ts", ".js"],
      }), // 查找和打包node_modules中的第三方模块
      commonjs(), //将 CommonJS 转换成 ES2015 模块供 Rollup 处理
      json(),
      typescript({
        // useTsconfigDeclarationDir: true
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      }),
    ],
    external: [],
  };
};

const typesConf = {
  input: parse("index.ts"),
  output: [
    {
      file: parse(`dist/${customOptions.name || libName}.d.ts`),
      format: "es",
    },
  ],
  plugins: [dts()],
};

export default [...Object.keys(configs).map(createBundleconf), typesConf];
