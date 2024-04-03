/* eslint no-console: "off" */

import { exec, execSync } from 'child_process';
import process from 'process';
import fs from 'fs';
import path from 'path';

const gitChangedFiles = execSync('git diff HEAD --name-only --diff-filter=d')
  .toString()
  .split('\n')
  .filter((fileName) => fileName.match(/.ts$/));

if (!gitChangedFiles.length) {
  console.log('没有变化的ts文件');
} else {
  console.log('即将检查的文件有:\n');
  for (const fileName of gitChangedFiles) {
    console.log(fileName + '\n');
  }

  const tsConfigContent = fs
    .readFileSync(path.join(process.cwd(), 'tsconfig.json'))
    .toString()
    .replace(/\,[\s\n]*}/g, '}');

  const newConfig = JSON.parse(tsConfigContent);
  newConfig.include = [path.join(process.cwd(), 'types')];
  newConfig.compilerOptions.types.push('node');
  newConfig.files = gitChangedFiles;

  const temporaryFileName = 'tsconfig.temporary.json';
  const temporaryConfigPath = path.join(process.cwd(), temporaryFileName);
  fs.writeFileSync(temporaryConfigPath, JSON.stringify(newConfig));

  const child = exec(`tsc -p ${temporaryFileName} --noEmit`, (err, stdout, stderr) => {
    fs.unlinkSync(temporaryConfigPath);
    if (err) {
      console.log('\ntsc检查失败啦~~，原因如下：\n', stdout, '\n', stderr);
      child.kill();
      process.exit(-1);
    } else {
      console.log('\ntsc检查通过啦');
    }
  });
}
