import { execFileSync, spawnSync } from "node:child_process";

const args = process.argv.slice(2);

function print(message) {
  process.stdout.write(`[tauri:build] ${message}\n`);
}

function printError(message) {
  process.stderr.write(`[tauri:build] ${message}\n`);
}

function findSigningIdentity() {
  const override = process.env.APPLE_SIGNING_IDENTITY?.trim();
  if (override) {
    print(`using APPLE_SIGNING_IDENTITY from environment: ${override}`);
    return override;
  }

  try {
    const output = execFileSync(
      "security",
      ["find-identity", "-v", "-p", "codesigning"],
      {
        encoding: "utf8",
      },
    );
    const identities = Array.from(output.matchAll(/"([^"]+)"/g), (match) =>
      match[1]?.trim(),
    ).filter(Boolean);

    const priorities = [
      /^Developer ID Application:/,
      /^Apple Distribution:/,
      /^Apple Development:/,
    ];

    for (const pattern of priorities) {
      const matched = identities.find((identity) => pattern.test(identity));
      if (matched) {
        print(`detected signing identity: ${matched}`);
        return matched;
      }
    }
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "failed to inspect keychain";
    printError(`unable to inspect signing identities: ${reason}`);
  }

  print(
    "no Apple signing certificate found; falling back to explicit ad-hoc signing (-)",
  );
  return "-";
}

const env = { ...process.env };

if (process.platform === "darwin") {
  env.APPLE_SIGNING_IDENTITY = findSigningIdentity();
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["tauri", "build", ...args], {
  stdio: "inherit",
  env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
