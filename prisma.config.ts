// prisma.config.ts
import { defineConfig } from "prisma/config";
import path from "node:path";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // SQLite local en archivo dev.db en la raíz del proyecto
    url: `file:${path.join(process.cwd(), "dev.db")}`,
  },
});