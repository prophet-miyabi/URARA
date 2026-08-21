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
        <meta name="theme-color" content="#0B0B0C" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html, body, #root {
  background-color: #0B0B0C;
  height: 100%;
}
body {
  overscroll-behavior-y: none;
}
`;
