import { copyFile, readFile, writeFile } from "node:fs/promises";

const target = process.argv[2] || "./server.mjs";
const source = await readFile(target, "utf8");
const importLine = 'import { analyzeMailWithOllama } from "./mailAi.mjs";';
const route = `    if (path === "/api/ai/analyze-mail" && request.method === "POST") {
      return sendJson(response, 200, await analyzeMailWithOllama(await body(request)));
    }

`;

if (source.includes(importLine) && source.includes('/api/ai/analyze-mail')) {
  console.log("L’intégration IA est déjà installée.");
  process.exit(0);
}

const importAnchor = 'import { randomUUID } from "node:crypto";';
const routeAnchor = '    sendJson(response, 404, { error: "Route locale introuvable." });';
if (!source.includes(importAnchor) || !source.includes(routeAnchor)) {
  throw new Error("Version de server.mjs non reconnue : aucune modification effectuée.");
}

await copyFile(target, `${target}.avant-ia`);
const updated = source
  .replace(importAnchor, `${importAnchor}\n${importLine}`)
  .replace(routeAnchor, `${route}${routeAnchor}`);
await writeFile(target, updated, { mode: 0o600 });
console.log("Intégration IA installée. Sauvegarde créée : server.mjs.avant-ia");
