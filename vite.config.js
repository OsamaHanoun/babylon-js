export default {
  base: "/babylon-js/",
  optimizeDeps: {
    exclude: ["@babylonjs/havok"],
  },
  build: {
    outDir: "public",
  },
  publicDir: "assets",
};
