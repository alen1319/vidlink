# Vidlink — 视频下载网站（Next.js + yt-dlp）

一个纯净、隐私优先的在线视频下载工具。粘贴链接 → 解析出多清晰度 → 一键下载。
中英双语、明暗主题、Google SEO / AdSense 合规（真实法律路由页、Cookie 同意、结构化数据）。

真实下载能力由业界最强开源方案 **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** 提供，支持
YouTube、TikTok、Instagram、X、Facebook、Bilibili 等上千个站点。

## 技术栈

- **Next.js 14（App Router）** — 真实路由（利于 SEO / AdSense 审核）+ 服务端 API
- **yt-dlp** — 解析与下载后端（通过子进程调用）
- **ffmpeg** — 视频/音频合流、MP3 提取
- React 18，零 UI 依赖（内联样式 + CSS 变量，精确还原设计稿）

## 运行前置

系统需安装 `yt-dlp` 与 `ffmpeg`：

```bash
# macOS
brew install yt-dlp ffmpeg
# 或 pip
pip install -U yt-dlp
```

## 本地开发

```bash
npm install
npm run dev        # 默认 http://localhost:3000
```

生产：

```bash
npm run build && npm start
```

## 目录结构

```
app/
  layout.jsx            根布局：字体、SEO 元数据、JSON-LD、AdSense 载入点
  page.jsx              首页
  globals.css           设计 token（CSS 变量，明暗主题）
  robots.js / sitemap.js  SEO
  privacy|terms|dmca|about|contact/page.jsx   真实法律路由页（含 per-route metadata）
  components/
    AppProvider.jsx     主题 / 语言 / Cookie 同意 Context（localStorage 持久化）
    Nav.jsx Footer.jsx CookieBanner.jsx AdSlot.jsx Article.jsx
    Home.jsx            下载器主界面（接入真实 API）
    icons.jsx           内联 SVG 图标
  lib/
    i18n.js             中英文案
    legal.js            双语法律条文
    ytdlp.js            yt-dlp 封装：解析、格式映射、体积/时长格式化、文件名安全化
  api/
    parse/route.js      POST 解析：yt-dlp -J → 多清晰度 + 缩略图 + 元数据
    download/route.js   GET 下载：yt-dlp 下载到临时文件 → 流式返回 → 清理
```

## API

**POST `/api/parse`**  `{ url, lang }` → `{ source, title, author, views, duration, thumbnail, webpageUrl, formats:[{quality, ext, note, size, kind, selector}] }`

**GET `/api/download?url=&quality=&title=`** → 附件流（`quality` 为 `1080|720|480|360|mp3`）
- 视频：`bv*[height<=N]+ba/b` 选流 + `--merge-output-format mp4`
- 音频：`-x --audio-format mp3 --audio-quality 0`

## 上线前替换项

1. **域名** — 全局搜索 `vidlink.app` 替换为真实域名（`layout.jsx` / `robots.js` / `sitemap.js` / `legal.js`）
2. **邮箱** — `hello@ / legal@ / partners@vidlink.app`（`lib/legal.js`）
3. **AdSense** —（已改为纯环境变量驱动，无需改代码）在 `.env` 设置：
   - `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxx` → 自动注入 AdSense 载入脚本
   - `NEXT_PUBLIC_ADSENSE_SLOT_TOP` / `NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM` → 两个广告位自动渲染真实 `<ins class="adsbygoogle">` 并请求广告
   - 未配置时显示带「广告」标注的占位框，布局不变
   - 广告位已带 `data-npa`：用户未「全部接受」Cookie 前请求非个性化广告；如需完整 Consent Mode v2，在 `AppProvider.jsx` 的 `chooseConsent` 里对接 `gtag('consent','update', ...)`
4. **浏览器插件按钮** — Extension 区块的「Add to Chrome / Firefox」当前为占位链接

## 防滥用（已内置，`.env` 可调）

- **限流**：按 IP 滑动窗口，parse 20 次/分、download 8 次/分，超限返回 `429 + Retry-After`
- **并发队列**：全进程最多 3 个下载同时进行，排队上限 12，满则 `503 + Retry-After`
- **体积/时长上限**：yt-dlp `--max-filesize 2G` + `--match-filter duration<10800`；parse 阶段即拒绝超长视频（`413`）
- **下载超时**：单任务硬超时 10 分钟；临时文件流结束后自动清理
- 前端下载走隐藏 iframe，`429/503/413` 等错误不会顶掉页面
- 多实例部署时把 `lib/ratelimit.js` / `lib/queue.js` 换成 Redis 版即可（接口不变）

## Docker 部署（推荐，二进制已内置）

镜像内已装好 `ffmpeg` 与 `yt-dlp`，开箱即用：

```bash
docker compose up -d --build     # 监听 127.0.0.1:3000
```

前面再挂 nginx/caddy 做 TLS 与域名即可（见下）。`docker-compose.yml` 里可填 AdSense 与限流环境变量。

## 部署注意

- API 路由为 Node.js runtime，会 spawn `yt-dlp`/`ffmpeg` 子进程 → **需要能执行二进制的服务器环境**
  （自有 VPS / Docker / Railway / Render 等），**不适用** Vercel/Netlify 纯 Serverless（无这些二进制）。
  - Docker 部署时在镜像内 `apt-get install -y ffmpeg && pip install yt-dlp`（或下载 yt-dlp 二进制）。
  - 可用 `YT_DLP_PATH` 环境变量指定二进制路径。
- 下载采用「先落临时文件再流式返回」，请确保临时目录有足够磁盘；已在流结束后自动清理。
- 生产建议加：请求限流、URL 白名单/黑名单、下载体积/时长上限、并发队列，防止滥用。

## 合规与免责

本工具仅作为技术手段，供用户下载其**拥有、处于公有领域或已获授权**的内容。请遵守来源平台条款与版权法。
详见站内隐私政策 / 服务条款 / DMCA 页面。
