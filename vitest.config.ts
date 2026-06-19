import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      // Mirror the tsconfig "@/*" -> project root mapping so tests can import
      // application modules with the same paths the app uses.
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
