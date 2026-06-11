import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globalSetup: ["./vitest.global-setup.ts"],
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    hookTimeout: 120_000,
    coverage: {
      provider: "v8",
      include: [
        "src/lib/authors/**/*.ts",
        "src/lib/users/**/*.ts",
        "src/lib/roles/**/*.ts",
        "src/lib/auth/**/*.ts",
        "src/lib/chain/**/*.ts",
        "src/lib/config/**/*.ts",
        "src/lib/db/**/*.ts",
        "src/lib/navigation/**/*.ts",
        "src/lib/notifications/**/*.ts",
        "src/lib/loading/**/*.ts",
        "src/components/loading/**/*.tsx",
        "src/components/author/**/*.ts",
        "src/components/author/**/*.tsx",
        "src/components/auth/**/*.ts",
        "src/components/auth/**/*.tsx",
        "src/components/admin/**/*.ts",
        "src/components/admin/**/*.tsx",
        "src/components/WalletButton.tsx",
        "src/components/notifications/**/*.tsx",
        "src/lib/users/UserSnapshotProvider.tsx",
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/lib/authors/types.ts",
        "src/lib/users/types.ts",
        "src/lib/users/server.ts",
        "src/lib/roles/server.ts",
        "src/components/author/constants.ts",
        "src/components/author/AuthorProfileEditor.tsx",
        "src/components/author/AuthorPageContent.tsx",
        "src/components/author/AuthorPageClient.tsx",
        "src/components/author/AuthorIndexPage.tsx",
        "src/components/admin/UsersAdminPage.tsx",
        "src/components/admin/RolesAdminPage.tsx",
        "src/components/auth/AuthorOnboarding.tsx",
        "src/components/auth/AuthorOnboardingDialog.tsx",
        "src/components/navigation/**/*.tsx",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
