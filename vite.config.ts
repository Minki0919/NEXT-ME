import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // .env의 BACKEND_ORIGIN을 읽습니다.
  // 로컬·운영 Gateway 주소는 소스 대신 환경 변수로 전환합니다.
  const env = loadEnv(mode, ".", "");
  const backendOrigin =
    env.BACKEND_ORIGIN || "http://1.201.116.40/api";

  return {
    plugins: [react()],
    server: {
      proxy: {
        // 최신 명세의 게이트웨이(:8080) 경로를 한 주소로 전달합니다.
        "/api": {
          target: backendOrigin,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
