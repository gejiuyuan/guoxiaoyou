import fs from "fs";
import { execa } from "execa";

const customTargetNames = process.argv.slice(2);

const pathFilter = customTargetNames.length
  ? (dir: string) => {
      return customTargetNames.some((name) => {
        return dir.match(new RegExp(`^${name}$`, "i"));
      });
    }
  : (dir: string) => true;

const targets = fs.readdirSync("packages").filter((dir) => {
  if (pathFilter(dir)) {
    return fs.statSync(`packages/${dir}`).isDirectory();
  }
});

async function build(dir: string) {
  const { stdout } = await execa(
    "rollup",
    ["--config", "rollup.config.mjs", "--environment", `PACKAGE_TARGET:${dir}`],
    {
      // 共享打包信息给父进程
      stdio: "inherit",
    },
  );
}

function runParallel(target: string[], buildFn: (dir: string) => Promise<any>) {
  const promises = targets.map((dir) => buildFn(dir));
  return Promise.all(promises);
}

runParallel(targets, build);
