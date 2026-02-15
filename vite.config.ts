import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = path.dirname(fileURLToPath(import.meta.url));

  return {
    plugins: [react({
      // 明确指定使用新的 JSX 转换
      jsxImportSource: 'react',
      // 如果使用 TypeScript
      tsDecorators: true,
    })],
    // 部署路径，注释掉后页面空白
    base: '/coaAdmin/',
    server: {
      host: "::",
      port: 8082,
    },
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "./src"),
      },
    },
    define: {
      "process.env.isApp": JSON.stringify(false),
    },
    esbuild: {
      jsx: 'automatic',
    },
  };
});
