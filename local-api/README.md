# Extension IA locale

Le module `mailAi.mjs` est destiné au conteneur `communepilot-local-api`.

Dans `server.mjs`, importer `analyzeMailWithOllama`, puis ajouter avant la réponse 404 :

```js
if (path === "/api/ai/analyze-mail" && request.method === "POST") {
  return sendJson(response, 200, await analyzeMailWithOllama(await body(request)));
}
```

Le conteneur doit utiliser `OLLAMA_URL=http://communepilot-ollama:11434` et partager le réseau Docker d’Ollama.
