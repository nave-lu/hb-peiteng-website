// Wurzel-Pfade (href="/…", src="/…", url(/…)) auf einen Unterordner umstellen, z. B. GitHub Pages /hb-peiteng-website.
// Wird beim Hochladen (scripts/pages-base.mjs) und im Admin (neu gezeichnete Bausteine) benutzt.
export const rebase = (s, b) =>
  s
    .replace(/(=\s*["'])\/(?!\/)/g, `$1${b}/`) // Attribute
    .replace(/url\((["']?)\/(?!\/)/g, `url($1${b}/`); // CSS und style="…url(/…)"

// Vite lädt nachgeladene Teile (z. B. den Admin) über eine Hilfsfunktion `function(e){return`/`+e}`;
// auf GitHub Pages muss auch dort der Unterordner davor.
export const rebaseJs = (s, b) => s.replace(/function\((\w)\)\{return`\/`\+\1\}/g, (_m, v) => `function(${v}){return\`${b}/\`+${v}}`);
