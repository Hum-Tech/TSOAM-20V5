// vite.config.ts
import { defineConfig } from "file:///app/code/client/node_modules/vite/dist/node/index.js";
import react from "file:///app/code/client/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/app/code/client";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./")
    }
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      clientPort: 5173
    },
    proxy: {
      "/api": {
        target: "http://localhost:3004",
        changeOrigin: true,
        timeout: 6e4,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          query: ["@tanstack/react-query"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select"
          ],
          charts: ["recharts"],
          utils: ["xlsx", "jspdf", "jspdf-autotable", "html2canvas", "dompurify"],
          "print-utils": ["./utils/printUtils"]
        }
      }
    },
    chunkSizeWarningLimit: 1500
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2NvZGUvY2xpZW50XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvYXBwL2NvZGUvY2xpZW50L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9hcHAvY29kZS9jbGllbnQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL1wiKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgaG1yOiB7XG4gICAgICBjbGllbnRQb3J0OiA1MTczLFxuICAgIH0sXG4gICAgcHJveHk6IHtcbiAgICAgIFwiL2FwaVwiOiB7XG4gICAgICAgIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjMwMDRcIixcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICB0aW1lb3V0OiA2MDAwMCxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgd3M6IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiBcImRpc3RcIixcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogW10sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgdmVuZG9yOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcbiAgICAgICAgICByb3V0ZXI6IFtcInJlYWN0LXJvdXRlci1kb21cIl0sXG4gICAgICAgICAgcXVlcnk6IFtcIkB0YW5zdGFjay9yZWFjdC1xdWVyeVwiXSxcbiAgICAgICAgICB1aTogW1xuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtZGlhbG9nXCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51XCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1zZWxlY3RcIixcbiAgICAgICAgICBdLFxuICAgICAgICAgIGNoYXJ0czogW1wicmVjaGFydHNcIl0sXG4gICAgICAgICAgdXRpbHM6IFtcInhsc3hcIiwgXCJqc3BkZlwiLCBcImpzcGRmLWF1dG90YWJsZVwiLCBcImh0bWwyY2FudmFzXCIsIFwiZG9tcHVyaWZ5XCJdLFxuICAgICAgICAgIFwicHJpbnQtdXRpbHNcIjogW1wiLi91dGlscy9wcmludFV0aWxzXCJdLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTUwMCxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrTyxTQUFTLG9CQUFvQjtBQUMvUCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxJQUFJO0FBQUEsSUFDbkM7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDSCxZQUFZO0FBQUEsSUFDZDtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUztBQUFBLFFBQ1QsUUFBUTtBQUFBLFFBQ1IsSUFBSTtBQUFBLE1BQ047QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLElBQ2IsZUFBZTtBQUFBLE1BQ2IsVUFBVSxDQUFDO0FBQUEsTUFDWCxRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsVUFDN0IsUUFBUSxDQUFDLGtCQUFrQjtBQUFBLFVBQzNCLE9BQU8sQ0FBQyx1QkFBdUI7QUFBQSxVQUMvQixJQUFJO0FBQUEsWUFDRjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsUUFBUSxDQUFDLFVBQVU7QUFBQSxVQUNuQixPQUFPLENBQUMsUUFBUSxTQUFTLG1CQUFtQixlQUFlLFdBQVc7QUFBQSxVQUN0RSxlQUFlLENBQUMsb0JBQW9CO0FBQUEsUUFDdEM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsdUJBQXVCO0FBQUEsRUFDekI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
