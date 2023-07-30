import { execa } from "execa";

try {
  await execa("pnpm exec lint-staged", ["--concurrent", "false"]);
} catch (err) {}
