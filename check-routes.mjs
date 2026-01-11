import { fetch } from 'undici';

const API_BASE = 'http://localhost:8787';

async function checkRoutes() {
  console.log('Checking routes...\n');

  const routes = [
    '/',
    '/categories',
    '/tags',
    '/feedback',
    '/login',
  ];

  for (const route of routes) {
    try {
      const response = await fetch(`${API_BASE}${route}`);
      console.log(`${route.padEnd(20)} - Status: ${response.status}`);
    } catch (error) {
      console.log(`${route.padEnd(20)} - Error: ${error.message}`);
    }
  }
}

checkRoutes().catch(console.error);
