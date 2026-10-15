// お客様向けアプリを本番用の設定でビルドし、ConoHa WINGにそのまま置ける形
// （フォルダとzip）にまとめる。
//
// 使い方（apps/mobile で実行）:
//   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=<Googleマップのキー> npm run package:conoha
// 出力先を変えたいときは OUT_DIR=<フォルダ> を付ける。
//
// SupabaseのURL・キーは apps/mobile/.env から読み込まれる。管理APIの接続先は、
// ローカル開発用の.envがlocalhostを指していることが多いため、ここで本番の値に上書きする。
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(process.env.OUT_DIR ?? join(appDir, 'conoha-release'));
const siteDir = join(outDir, 'conoha-site');
const zipPath = join(outDir, 'urara-site-conoha.zip');

if (!process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY) {
  console.error('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY が未設定です。地図が動かなくなるため中止します。');
  process.exit(1);
}

const env = {
  ...process.env,
  EXPO_PUBLIC_ADMIN_API_BASE_URL: process.env.PRODUCTION_ADMIN_API_BASE_URL ?? 'https://urara-admin.onrender.com',
};

// npxはWindowsでは.cmdなのでshell経由が要る。それ以外はshellを通さず、
// 引数に括弧や記号が含まれていても（例: "(tabs)"）そのまま渡す。
function run(command, args, options = {}) {
  const { shell = false, ...rest } = options;
  const result = spawnSync(command, args, { stdio: 'inherit', shell, ...rest });
  if (result.status !== 0) {
    console.error(`失敗: ${command} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

// 古い書き出しが混ざらないよう、毎回作り直す。
rmSync(join(appDir, 'dist'), { recursive: true, force: true });
// --clear が必須。EXPO_PUBLIC_* の値はビルド時に埋め込まれるが、Metroのキャッシュは
// 環境変数の変更を検知しないため、付けないと過去のビルド（例: ローカル開発用の
// localhost向けの値）がそのまま使われてしまう。
run('npx', ['expo', 'export', '--platform', 'web', '--clear'], { cwd: appDir, env, shell: process.platform === 'win32' });

// 出力先には他のファイル（QRコード画像など）が置かれていることがあるため、
// フォルダごとは消さず、このスクリプトが作る2つだけを作り直す。
mkdirSync(outDir, { recursive: true });
rmSync(siteDir, { recursive: true, force: true });
rmSync(zipPath, { force: true });
cpSync(join(appDir, 'dist'), siteDir, { recursive: true });
cpSync(join(appDir, 'deploy', 'conohawing', '.htaccess'), join(siteDir, '.htaccess'));

// 予約詳細の動的ルート。角括弧のファイル名をrewriteで扱いやすくするための複製。
const dynamicRoute = join(siteDir, 'reservation', '[id].html');
if (!existsSync(dynamicRoute)) {
  console.error('reservation/[id].html が見つかりません。ルート構成が変わった可能性があります。');
  process.exit(1);
}
cpSync(dynamicRoute, join(siteDir, 'reservation', 'detail.html'));

// Windows標準のtar.exe（bsdtar）は、.zipをスラッシュ区切りの正しい形式で作る。
// PATH上のtarはGit同梱のGNU tarであることが多く、それだと「.zipという名前の
// 別形式のファイル」ができて開けないため、WindowsではSystem32のものを直接指定する。
// PowerShellのCompress-Archiveも環境によりパス区切りが壊れるため使わない。
const tarBin = process.platform === 'win32' ? join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
// 「.」でまとめると項目名が「./index.html」になるため、直下の項目を個別に渡す
// （.htaccess などのドット始まりも含める）。
run(tarBin, ['-a', '-c', '-f', zipPath, '-C', siteDir, ...readdirSync(siteDir)]);

console.log(`\n完了\n  フォルダ: ${siteDir}\n  zip     : ${zipPath}`);
