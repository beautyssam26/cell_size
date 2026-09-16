import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true },
});

after(async () => vite.close());

const { validateCalibration } = await vite.ssrLoadModule("/lib/calibration.ts");

test("accepts any equivalent coincident interval at 10x", () => {
  assert.equal(validateCalibration(5, 5, 10, 10), "valid");
  assert.equal(validateCalibration(10, 10, 10, 10), "valid");
});

test("accepts equivalent coincident intervals at 40x", () => {
  assert.equal(validateCalibration(20, 5, 2.5, 2.5), "valid");
  assert.equal(validateCalibration(40, 10, 2.5, 2.5), "valid");
});

test("rejects a wrong ratio or calculation", () => {
  assert.equal(validateCalibration(5, 4, 8, 10), "wrong-ratio");
  assert.equal(validateCalibration(5, 5, 8, 10), "wrong-answer");
});
