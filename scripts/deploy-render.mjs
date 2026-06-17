#!/usr/bin/env node
/**
 * Deploy fifa-predictor to Render via API.
 * Usage: RENDER_API_KEY=rnd_xxx node scripts/deploy-render.mjs
 */

const API_KEY = process.env.RENDER_API_KEY;
if (!API_KEY) {
  console.error("Set RENDER_API_KEY (from Render → Account Settings → API Keys)");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

async function api(path, options = {}) {
  const res = await fetch(`https://api.render.com/v1${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${res.status} ${path}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function main() {
  const owners = await api("/owners?limit=20");
  const owner = owners[0]?.owner;
  if (!owner) throw new Error("No Render workspace found for this API key");

  console.log(`Using workspace: ${owner.name} (${owner.id})`);

  const existing = await api("/services?limit=100");
  const found = existing.find((s) => s.service?.name === "fifa-predictor");
  if (found) {
    console.log(`Service already exists: ${found.service.serviceDetails?.url}`);
    return;
  }

  const body = {
    type: "web_service",
    name: "fifa-predictor",
    ownerId: owner.id,
    repo: "https://github.com/SHREYASTIWARY1107/Fifa-predictor",
    branch: "main",
    autoDeploy: "yes",
    serviceDetails: {
      env: "node",
      plan: "free",
      region: "oregon",
      envSpecificDetails: {
        buildCommand: "npm install && npm run build",
        startCommand: "npm start",
      },
    },
    envVars: [
      { key: "NODE_ENV", value: "production" },
      {
        key: "NEXT_PUBLIC_SUPABASE_URL",
        value: "https://vnusxxzhcwtfbsfkuiro.supabase.co",
      },
      {
        key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        value:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudXN4eHpoY3d0ZmJzZmt1aXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NzM5MjIsImV4cCI6MjA5NDE0OTkyMn0.9T0quX3NqlIMBPtyQbT8LlV7AwgzAnscS429Hr4Mix8",
      },
      { key: "LEAGUE_PIN", value: "1234" },
      { key: "CRON_SECRET", value: "fifa-predictor-cron-secret-change-me" },
      { key: "SUPABASE_SERVICE_ROLE_KEY", value: "REPLACE_ME" },
    ],
  };

  const created = await api("/services", {
    method: "POST",
    body: JSON.stringify(body),
  });

  console.log("Created:", created.service?.serviceDetails?.url ?? created);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
