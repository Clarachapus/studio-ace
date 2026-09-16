// Removes the build folder before a build. Turbopack's persistent cache breaks on
// this exFAT disk (macOS "._*" metadata files), so every build starts clean.
import { rmSync } from "node:fs";
import path from "node:path";

rmSync(path.resolve(process.env.NEXT_DIST_DIR ?? ".next"), { recursive: true, force: true });
