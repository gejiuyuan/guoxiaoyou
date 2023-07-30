//  feat
//  fix
//  docs
//  refactor
//  style
//  perf: 性能优化
//  release: 发行新版本
//  types
//  test
//  ci: 持续集成
//  build: 影响项目构建或依赖项修改
//  workflow: 工作流相关文件修改
//  chore: 其他修改（不在上述类型中的修改）
//  wip: work in process, 代码还在开发暂不能合入
//  rfr: ready for review, 代码开发完毕, 可code review合入

import fs, { writeFileSync } from "fs";

const config = {
  // PS: use path.resolve() load
  path: "cz-conventional-changelog",
  // disableScopeLowerCase: false,
  // disableSubjectLowerCase: false,
  // maxHeaderWidth: 100,
  // maxLineWidth: 100,
  // defaultType: "",
  // defaultScope: "",
  // defaultSubject: "",
  // defaultBody: "",
  // defaultIssues: "",
  types: {
    feat: {
      description: "A new feature",
      title: "Features",
      emoji: "✨",
    },
    fix: {
      description: "A bug fix",
      title: "Bug Fixes",
      emoji: "🐛",
    },
    docs: {
      description: "Documentation only changes",
      title: "Documentation",
      emoji: "📚",
    },
    types: {
      description: "Type declaration file addition",
      title: "Type",
      emoji: "📚",
    },
    style: {
      description:
        "Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)",
      title: "Styles",
      emoji: "💎",
    },
    refactor: {
      description: "A code change that neither fixes a bug nor adds a feature",
      title: "Code Refactoring",
      emoji: "📦",
    },
    perf: {
      description: "A code change that improves performance",
      title: "Performance Improvements",
      emoji: "🚀",
    },
    test: {
      description: "Adding missing tests or correcting existing tests",
      title: "Tests",
      emoji: "🚨",
    },
    build: {
      description:
        "Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)",
      title: "Builds",
      emoji: "🛠",
    },
    ci: {
      description:
        "Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)",
      title: "Continuous Integrations",
      emoji: "⚙️",
    },
    chore: {
      description: "Other changes that don't modify src or test files",
      title: "Chores",
      emoji: "♻️",
    },
    release: {
      description: "Release a version",
      title: "Release",
      emoji: "🎉",
    },
    workflow: {
      description: "Workflow relatives",
      title: "Workflow",
      emoji: "✅",
    },
    wip: {
      description: "Work in process",
      title: "Wip",
      emoji: "🎈",
    },
    rfr: {
      description: "Ready for code review",
      title: "Rfr",
      emoji: "👀",
    },
  },
};

writeFileSync(".czrc", JSON.stringify(config));
