import fs, { readFileSync } from "fs";
import path from "path";

const commitMsgPath = path.resolve(".git/COMMIT_EDITMSG");
const commitMsg = readFileSync(commitMsgPath, "utf8").trim();

const prefixs = [
  "feat",
  "fix",
  "docs",
  "refactor",
  "style",
  // 性能优化
  "perf",
  // 发行新版本
  "release",
  "types",
  "test",
  // 持续集成
  "ci",
  // 影响项目构建或依赖项修改
  "build",
  // 工作流相关文件修改
  "workflow",
  // 其他修改（不在上述类型中的修改）
  "chore",
  // work in process, 代码还在开发暂不能合入
  "wip",
  // ready for review, 代码开发完毕, 可code review合入
  "rfr",
] as const;

const commitMsgReg = new RegExp(
  `^(revert: )?(${prefixs.join("|")})(\(.{1,10}\))?: .{2,70}`,
);

if (!commitMsg.match(commitMsgReg)) {
  console.error(
    `please input valid commit message format! e.g. '(revert) type(scope): message' `,
  );
  process.exit(1);
} else {
  console.log("correct commit message format！");
}
