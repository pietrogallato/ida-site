import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemas";
import { env } from "./lib/env";

export default defineConfig({
  name: "ida-sato-blog",
  title: "Ida Sato — Blog",
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  basePath: "/studio",
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
});
