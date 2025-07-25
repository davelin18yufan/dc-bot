import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
        exclude: ["node_modules", "dist"],
        typecheck: {
            tsconfig: "./tsconfig.test.json",
        },
    },
    resolve: {
        alias: [
            { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
            { find: "~", replacement: fileURLToPath(new URL("./", import.meta.url)) },
        ],
    },
});
