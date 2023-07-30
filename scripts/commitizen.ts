import path from "path";
import { execa } from "execa";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

try {
  const createCommitizenConfigInfo = await (async () => {
    const { stdout } = await execa("git status", ["-s"]);

    let filePath = "";
    const didModified = stdout.split("\n").some((lineContent) => {
      const matched = lineContent.match(/.+\s+(.+)/);
      if (matched && matched[1].match(/createCommitizenConfig\.ts$/i)) {
        filePath = matched[1];
        return true;
      }
    });
    return {
      path: filePath,
      didModified,
    };
  })();

  if (createCommitizenConfigInfo.didModified) {
    await execa(
      "ts-node",
      ["--esm", path.join(process.cwd(), "scripts/createCommitizenConfig.ts")],
      {},
    );
  }
} catch (err) {
  process.exit(1);
}
