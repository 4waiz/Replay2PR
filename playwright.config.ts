import { defineConfig } from "@playwright/test";

export default defineConfig({
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  reporter: "line"
});
