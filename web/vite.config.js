const isVercel = process.env.VERCEL === "1";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
  },
  base: isVercel ? "/" : "/AtongAni_frontend/",
});
