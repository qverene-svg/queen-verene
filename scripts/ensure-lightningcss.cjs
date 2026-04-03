/**
 * Tailwind v4 / @tailwindcss/postcss loads lightningcss with a platform-specific
 * native addon. If node_modules was installed on another OS (e.g. Windows) and
 * you run Node on WSL/Linux, the Linux binary is missing. Install the matching
 * optional package and continue.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function lightningcssPlatformPackageName() {
  const parts = [process.platform, process.arch];
  if (process.platform === "linux") {
    const { MUSL, familySync } = require("detect-libc");
    const family = familySync();
    if (family === MUSL) {
      parts.push("musl");
    } else if (process.arch === "arm") {
      parts.push("gnueabihf");
    } else {
      parts.push("gnu");
    }
  } else if (process.platform === "win32") {
    parts.push("msvc");
  }
  return `lightningcss-${parts.join("-")}`;
}

function verifyInSubprocess() {
  try {
    execSync('node -e "require(\'lightningcss\')"', { cwd: root, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

if (verifyInSubprocess()) {
  process.exit(0);
}

const lightningPkgPath = path.join(root, "node_modules", "lightningcss", "package.json");
if (!fs.existsSync(lightningPkgPath)) {
  console.error(
    "[verene] lightningcss is not installed. Run npm install in this directory (from the same OS you use to run Node)."
  );
  process.exit(1);
}

const { version } = JSON.parse(fs.readFileSync(lightningPkgPath, "utf8"));
const platformPkg = lightningcssPlatformPackageName();

console.warn(
  `[verene] Missing ${platformPkg} (common when node_modules was installed on another OS). Installing@${version} …`
);

try {
  execSync(`npm install --no-save ${platformPkg}@${version}`, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, npm_config_ignore_scripts: "true" },
  });
} catch {
  console.error(
    `[verene] Could not install ${platformPkg}@${version}. Try: rm -rf node_modules && npm install (using Node from this OS only).`
  );
  process.exit(1);
}

if (!verifyInSubprocess()) {
  console.error("[verene] lightningcss still fails to load after installing the platform package.");
  process.exit(1);
}
