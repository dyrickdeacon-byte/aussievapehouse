import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default config: SSR/API routes run in the Worker, static assets are served
// by Cloudflare's CDN (unmetered bandwidth, which is the reason for the move).
export default defineCloudflareConfig();
