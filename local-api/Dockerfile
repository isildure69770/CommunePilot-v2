FROM node:22-alpine
WORKDIR /app
COPY server.mjs ./server.mjs
COPY mailAi.mjs ./mailAi.mjs
RUN mkdir -p /data && chown node:node /data
USER node
ENV PORT=3000 DATA_DIR=/data
ENV OLLAMA_URL=http://communepilot-ollama:11434 OLLAMA_MODEL=qwen2.5:0.5b
EXPOSE 3000
CMD ["node", "server.mjs"]
