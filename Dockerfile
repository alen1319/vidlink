# ---- Build stage ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    YT_DLP_PATH=/usr/local/bin/yt-dlp

# System deps: ffmpeg for merge/transcode, ca-certs + python3 for yt-dlp,
# curl to fetch the yt-dlp standalone binary.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl python3 \
 && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
 && mkdir -p /etc/yt-dlp/plugins \
 && curl -fL https://github.com/Brainicism/bgutil-ytdlp-pot-provider/releases/download/1.3.1/bgutil-ytdlp-pot-provider.zip -o /etc/yt-dlp/plugins/bgutil-ytdlp-pot-provider.zip \
 && echo "b8ceec7f76143da172aaf5ebeec0c2d218e5680c063b931586bca48567069b38  /etc/yt-dlp/plugins/bgutil-ytdlp-pot-provider.zip" | sha256sum -c - \
 && chmod a+rx /usr/local/bin/yt-dlp \
 && apt-get purge -y curl && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

# Next.js standalone output: minimal server + only required node_modules.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Run as the unprivileged node user.
USER node

EXPOSE 3000
CMD ["node", "server.js"]
