import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./sanity/schemas";
import { env } from "./lib/env";

// Security audit F-14: the GROQ playground (visionTool) is removed
// intentionally. It lets any authenticated editor run arbitrary GROQ
// queries against the entire dataset, which is a data-exfiltration
// amplifier if an editor account is ever compromised. No editorial
// workflow requires it — posts and testimonials are managed through
// the structure tool. If you ever need ad-hoc GROQ queries, prefer
// running them from the Sanity CLI on your own machine.
export default defineConfig({
  name: "ida-sato-blog",
  title: "Ida Sato — Blog",
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  basePath: "/studio",
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
