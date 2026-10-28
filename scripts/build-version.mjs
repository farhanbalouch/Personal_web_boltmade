import { writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
let sha = process.env.VERCEL_GIT_COMMIT_SHA;
if (!sha) {
  try {
    sha = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    sha = "local";
  }
}
await writeFile("public/version.json", JSON.stringify({ sha }) + "\n");
