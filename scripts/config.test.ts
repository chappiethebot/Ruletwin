import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

test("CLI paths load .env.local before initialization and preserve explicit environment", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ruletwin-config-"));
  try {
    fs.mkdirSync(path.join(dir, "scripts"));
    const config = path.join(dir, "scripts", "config.ts");
    fs.copyFileSync(path.join(import.meta.dirname, "config.ts"), config);
    fs.writeFileSync(path.join(dir, ".env.local"), 'STARTER_DIR="./input pack"\n');
    const env = { ...process.env };
    delete env.STARTER_DIR;
    const read = (environment: NodeJS.ProcessEnv) => JSON.parse(execFileSync(process.execPath,
      ["--input-type=module", "-e", "const c = await import(process.argv[1]); console.log(JSON.stringify(c.STARTER_DIR));", pathToFileURL(config).href],
      { cwd: dir, env: environment, encoding: "utf8" }));
    assert.equal(read(env), path.join(dir, "input pack"));
    assert.equal(read({ ...env, STARTER_DIR: "./explicit pack" }), path.join(dir, "explicit pack"));
  } finally {
    // Only remove the temporary directory created by this test.
    const target = fs.realpathSync(dir);
    assert.ok(target.startsWith(fs.realpathSync(os.tmpdir()) + path.sep));
    assert.ok(path.basename(target).startsWith("ruletwin-config-"));
    fs.rmSync(target, { recursive: true });
  }
});
