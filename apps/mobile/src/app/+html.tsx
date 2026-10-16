import { ScrollViewStyleReset } from 'expo-router/html';

// Customizes the root HTML for every web page in this app (see
// https://docs.expo.dev/router/reference/static-rendering/#root-html).
// Without this, html/body have no background set, so mobile browsers show
// their default white page background during overscroll/bounce at the top
// or bottom edge of the screen — this pins it to the app's dark background
// and disables the bounce itself so it can never show through at all.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
        <meta name="theme-color" content="#050505" />
        {/* タブ／ホーム画面用のアイコン。Expo が出す favicon.ico より大きい
            PNG を併記し、対応ブラウザにはそちらを選ばせる。ファイルは public/ 。 */}
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html, body, #root {
  background-color: #050505;
  height: 100%;
}
body {
  overscroll-behavior-y: none;
}
`;
