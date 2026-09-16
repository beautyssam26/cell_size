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

const { scoreMeasurement, scoreSubmission } = await vite.ssrLoadModule("/lib/scoring.ts");

test("awards 25 points for a fully accurate submission", () => {
  const scores = scoreSubmission({
    calibration: {
      "10": { ocular: 5, stage: 5, unit: 10 },
      "40": { ocular: 20, stage: 5, unit: 2.5 },
    },
    observationCompleted: true,
    measurements: {
      onion: { divisions: 22, size: 220 },
      cheek: { divisions: 22, size: 55 },
      yeast: { divisions: 3, size: 7.5 },
    },
  });
  assert.deepEqual(scores, {
    calibrationScore: 6,
    observationScore: 4,
    onionScore: 5,
    cheekScore: 5,
    yeastScore: 5,
    totalScore: 25,
  });
});

test("uses graduated size-error points without revealing them to the client", () => {
  assert.equal(scoreMeasurement("onion", { divisions: 22, size: 231 }), 5);
  assert.equal(scoreMeasurement("onion", { divisions: 22, size: 237 }), 4);
  assert.equal(scoreMeasurement("onion", { divisions: 22, size: 250 }), 3);
  assert.equal(scoreMeasurement("onion", { divisions: 20, size: 300 }), 0);
});
