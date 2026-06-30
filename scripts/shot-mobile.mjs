// Accurate mobile screenshot via CDP device emulation (true innerWidth=390).
// Usage: node scripts/shot-mobile.mjs <url> <outPath>
import { writeFileSync } from "node:fs";

const [url, out] = process.argv.slice(2);
const r = await fetch("http://127.0.0.1:9222/json/new?" + encodeURIComponent("about:blank"), { method: "PUT" })
  .catch(() => fetch("http://127.0.0.1:9222/json/new", { method: "PUT" }));
const tab = await r.json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
let id = 0;
const pend = {};
const evt = {};
const send = (m, p = {}) => new Promise((res) => { const i = ++id; pend[i] = res; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const once = (m) => new Promise((res) => { evt[m] = res; });
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pend[msg.id]) pend[msg.id](msg.result);
  if (msg.method && evt[msg.method]) { evt[msg.method](msg.params); delete evt[msg.method]; }
};
await new Promise((res) => (ws.onopen = res));
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
const loaded = once("Page.loadEventFired");
await send("Page.navigate", { url });
await loaded;
await new Promise((r) => setTimeout(r, 2500));
const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log("wrote", out);
ws.close();
process.exit(0);
