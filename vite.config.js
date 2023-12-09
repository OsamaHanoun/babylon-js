export default {
  base: "/babylon-js/",
  optimizeDeps: {
    exclude: ["@babylonjs/havok", "@babylonjs/loaders", "@babylonjs/core"],
  },
  build: {
    outDir: "public",
  },
  publicDir: "assets",
};
