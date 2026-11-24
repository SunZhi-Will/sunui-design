// Test harness only: lets a ported demo follow ?l=<locale> without editing the port.
// Vue demos: locale="en" -> :locale="$l"; const locale = "en" -> reads the URL.
// Svelte demos: locale="en" -> locale={globalThis.__sunuiLocale}.
export default function localeFromUrl() {
  return {
    name: "sunui-locale-from-url",
    enforce: "pre",
    transform(code, id) {
      if (!/\/demos\/[^/]+Demo\.(vue|svelte)$/.test(id)) return null;
      let out = code;
      if (id.endsWith(".vue")) {
        out = out.replace(/(\s)locale="en"/g, '$1:locale="$l"');
        out = out.replace(/const locale = "en";/g, 'const locale = (globalThis as any).__sunuiLocale ?? "en";');
      } else {
        out = out.replace(/(\s)locale="en"/g, "$1locale={globalThis.__sunuiLocale}");
        out = out.replace(/const locale = "en";/g, 'const locale = globalThis.__sunuiLocale ?? "en";');
      }
      return out === code ? null : { code: out, map: null };
    },
  };
}
