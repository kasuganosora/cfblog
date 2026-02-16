/**
 * Generate wrangler.toml from environment variables
 *
 * Used by Cloudflare Workers Builds (set as build command):
 *   node scripts/generate-config.js
 *
 * Required environment variables:
 *   CF_D1_DATABASE_ID  - D1 database UUID
 *
 * Optional environment variables:
 *   CF_WORKER_NAME     - Worker name (default: cfblog)
 *   CF_D1_DB_NAME      - D1 database name (default: cfblog-database)
 *   CF_R2_BUCKET_NAME  - R2 bucket name (default: cfblog-uploads)
 *   CF_CUSTOM_DOMAIN   - Custom domain (omit to skip routes config)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

const TOML_PATH = new URL('../wrangler.toml', import.meta.url);
const EXAMPLE_PATH = new URL('../wrangler.toml.example', import.meta.url);

// If wrangler.toml already exists (local dev), skip generation
if (existsSync(TOML_PATH)) {
  console.log('wrangler.toml already exists, skipping generation.');
  process.exit(0);
}

const databaseId = process.env.CF_D1_DATABASE_ID;
if (!databaseId) {
  console.error('Error: CF_D1_DATABASE_ID environment variable is required.');
  console.error('Set it in Cloudflare Dashboard > Workers > Settings > Environment variables');
  process.exit(1);
}

const workerName = process.env.CF_WORKER_NAME || 'cfblog';
const dbName = process.env.CF_D1_DB_NAME || 'cfblog-database';
const bucketName = process.env.CF_R2_BUCKET_NAME || 'cfblog-uploads';
const customDomain = process.env.CF_CUSTOM_DOMAIN || '';

let toml = readFileSync(EXAMPLE_PATH, 'utf-8');

toml = toml.replace(/^name = ".*"/m, `name = "${workerName}"`);
toml = toml.replace(/database_name = ".*"/, `database_name = "${dbName}"`);
toml = toml.replace(/database_id = ".*"/, `database_id = "${databaseId}"`);
toml = toml.replace(/bucket_name = ".*"/, `bucket_name = "${bucketName}"`);

// Handle custom domain
if (customDomain) {
  // Replace the commented-out routes section with an active one
  toml = toml.replace(
    /# Optional: custom domain\n# \[\[routes\]\]\n# pattern = ".*"\n# custom_domain = true/,
    `[[routes]]\npattern = "${customDomain}"\ncustom_domain = true`
  );
}

writeFileSync(TOML_PATH, toml);
console.log(`Generated wrangler.toml (worker: ${workerName}, db: ${databaseId.slice(0, 8)}...)`);
