// アプリの装飾写真をAIで生成する（AWP = Actualize-World-Peace の backend/src/ai/design.ts と
// 同じ仕組み。Cloudflare Workers AI の FLUX.1 [schnell] を優先し、無ければ Gemini の画像モデル）。
//
// 鍵は apps/mobile/.env.imagegen.local（git管理外）に置く。チャットに貼らないこと。
//   CLOUDFLARE_ACCOUNT_ID=...
//   CLOUDFLARE_API_TOKEN=...
//   （または）GEMINI_API_KEY=...
//
// 使い方:
//   node scripts/gen-image.mjs --prompt "..." --out assets/scene-gen/x.jpg
//   node scripts/gen-image.mjs --batch scripts/urara-shots.json     # 一覧をまとめて生成
// 生成物は JPEG。縦横比の調整は別途 Pillow 側で切り出す。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadLocalEnv() {
  const file = resolve(ROOT, '.env.imagegen.local');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

async function imageFromWorkersAI(prompt) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt.slice(0, 2048), steps: 8 }),
    }
  );
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success || !body?.result?.image) {
    throw new Error(`Workers AI returned no image: ${JSON.stringify(body?.errors || res.statusText)}`);
  }
  return { data: Buffer.from(body.result.image, 'base64'), mimeType: 'image/jpeg' };
}

async function imageFromGemini(prompt, aspectRatio) {
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio } },
      }),
    }
  );
  const body = await res.json().catch(() => null);
  const part = body?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!res.ok || !part) {
    throw new Error(`Gemini returned no image: ${JSON.stringify(body?.error || res.statusText).slice(0, 300)}`);
  }
  return { data: Buffer.from(part.inlineData.data, 'base64'), mimeType: part.inlineData.mimeType || 'image/jpeg' };
}

async function generate(prompt, aspectRatio = '1:1') {
  if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) return imageFromWorkersAI(prompt);
  if (process.env.GEMINI_API_KEY) return imageFromGemini(prompt, aspectRatio);
  throw new Error('鍵が未設定です。apps/mobile/.env.imagegen.local に CLOUDFLARE_ACCOUNT_ID と CLOUDFLARE_API_TOKEN（または GEMINI_API_KEY）を書いてください。');
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  loadLocalEnv();
  const batchFile = arg('batch');
  const jobs = batchFile
    ? JSON.parse(readFileSync(resolve(ROOT, batchFile), 'utf8'))
    : [{ out: arg('out'), prompt: arg('prompt'), aspect: arg('aspect') || '1:1' }];

  for (const job of jobs) {
    if (!job.out || !job.prompt) throw new Error('--out と --prompt の両方が必要です');
    const outPath = resolve(ROOT, job.out);
    if (existsSync(outPath) && !process.argv.includes('--force')) {
      console.log(`skip (exists): ${job.out}`);
      continue;
    }
    process.stdout.write(`generating ${job.out} ... `);
    const image = await generate(job.prompt, job.aspect || '1:1');
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, image.data);
    console.log(`${image.mimeType} ${image.data.length} bytes`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
