import { build } from "esbuild";

const common = {
  bundle: true,
  format: "esm",
  target: "es2020",
  legalComments: "none",
  logLevel: "info",
};

await build({
  ...common,
  entryPoints: ["src/chamber-card.js"],
  outfile: "chamber-card.js",
});

await build({
  ...common,
  entryPoints: ["src/chamber-card-editor.js"],
  outfile: "chamber-card-editor.js",
});
