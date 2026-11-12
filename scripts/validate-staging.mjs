import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");
const version = JSON.parse(read("version.json"));
const manifest = JSON.parse(read("manifest.webmanifest"));

assert.match(version.version, /^\d+\.\d+\.\d+$/);
assert.ok(["staging-preview", "production"].includes(version.release), "Release must be staging-preview or production");
if (process.env.GITHUB_REF_NAME === "main") {
  assert.equal(version.release, "production", "The main branch must contain a production release");
}
const normalizedHtml = html.replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit));
assert.ok(normalizedHtml.includes("نسخه " + version.version), "Visible footer version must match version.json");
assert.equal(manifest.name, "UPLAND");
assert.ok(manifest.icons?.some((icon) => icon.src.includes("upland-logo-original.svg")), "Official logo must be present in the app manifest");

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
assert.deepEqual([...new Set(duplicates)], [], "HTML must not contain duplicate IDs");

for (const [, attr] of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) {
  if (/^(?:https?:|data:|mailto:|tel:|#|javascript:)/i.test(attr)) continue;
  const local = decodeURIComponent(attr.split(/[?#]/)[0]).replace(/^\.\//, "");
  if (!local || local.endsWith("/")) continue;
  assert.ok(fs.existsSync(path.join(root, local)), `Missing local asset referenced by index.html: ${attr}`);
}

for (const file of ["app.js", "experience.js", "service-worker.js", "planner-edit.js", "stickers.js"]) {
  assert.ok(fs.existsSync(path.join(root, file)), `Missing runtime file: ${file}`);
}

const app = read("app.js");
assert.match(app, /const jalali=raw\.match\(/, "Hamkelasi import must recognize Persian-calendar dates");
assert.match(app, /function jalaliInputToDate\(/, "Persian date conversion helper must be available");
const unreadHandler = app.slice(app.indexOf("async function notifyUnreadMessagesOnEntry"), app.indexOf("function stopChatRealtime"));
assert.ok(unreadHandler.includes("setChatUnreadBadge(0)"), "Unread chat badge must clear before refreshing its count");
assert.ok(unreadHandler.includes("setChatUnreadBadge(count)"), "Unread chat badge must reflect the latest count");

console.log(`UPLAND ${version.version}: static checks passed (${ids.length} unique HTML IDs).`);
