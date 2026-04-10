import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import readline from 'node:readline';
import path from 'node:path';

const execAsync = promisify(exec);

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function checkStripeCLI() {
  console.log('Step 1: Checking Stripe CLI...');
  try {
    await execAsync('stripe --version');
    console.log('✅ Stripe CLI is installed.');

    try {
      await execAsync('stripe config --list');
      console.log('✅ Stripe CLI is authenticated.');
    } catch {
      console.log('⚠️  Stripe CLI is not authenticated.');
      console.log('Run: stripe login');
      const answer = await question('Have you completed authentication? (y/n): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Please authenticate and run this script again.');
        process.exit(1);
      }
    }
  } catch {
    console.error('❌ Stripe CLI is not installed.');
    console.log('Install it from: https://docs.stripe.com/stripe-cli');
    process.exit(1);
  }
}

async function startLocalServices() {
  console.log('Step 2: Starting local PostgreSQL + Redis via Docker...');
  try {
    await execAsync('docker --version');
  } catch {
    console.error('❌ Docker is not installed. Install from: https://docs.docker.com/get-docker/');
    process.exit(1);
  }

  try {
    await execAsync('docker compose -f docker-compose.dev.yml up -d');
    console.log('✅ PostgreSQL and Redis containers started.');
  } catch (error) {
    console.error('❌ Failed to start Docker containers.');
    throw error;
  }
}

async function getStripeSecretKey(): Promise<string> {
  console.log('Step 3: Stripe Secret Key');
  console.log('Find it at: https://dashboard.stripe.com/test/apikeys');
  return await question('Enter your Stripe Secret Key (sk_test_...): ');
}

async function createStripeWebhook(): Promise<string> {
  console.log('Step 4: Creating Stripe webhook...');
  try {
    const { stdout } = await execAsync('stripe listen --print-secret');
    const match = stdout.match(/whsec_[a-zA-Z0-9]+/);
    if (!match) throw new Error('Failed to extract webhook secret');
    console.log('✅ Stripe webhook created.');
    return match[0];
  } catch (error) {
    console.error('❌ Failed to create Stripe webhook.');
    throw error;
  }
}

async function getKindeCredentials(): Promise<{
  clientId: string;
  clientSecret: string;
  issuerUrl: string;
}> {
  console.log('Step 5: Kinde Authentication');
  console.log('Get your credentials from: https://app.kinde.com → Settings → Environment');
  console.log('');

  const issuerUrl = await question('Enter your Kinde Issuer URL (https://yourapp.kinde.com): ');
  const clientId = await question('Enter your Kinde Client ID: ');
  const clientSecret = await question('Enter your Kinde Client Secret: ');

  return { clientId, clientSecret, issuerUrl };
}

async function writeEnvFile(envVars: Record<string, string>) {
  console.log('Step 6: Writing .env.local...');
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  await fs.writeFile(path.join(process.cwd(), '.env.local'), envContent);
  console.log('✅ .env.local created.');
}

async function main() {
  console.log('🚀 Boilerplate Setup\n');

  await checkStripeCLI();
  await startLocalServices();

  const STRIPE_SECRET_KEY = await getStripeSecretKey();
  const STRIPE_WEBHOOK_SECRET = await createStripeWebhook();
  const kinde = await getKindeCredentials();

  const BASE_URL = 'http://localhost:3000';

  await writeEnvFile({
    // App
    BASE_URL,
    NODE_ENV: 'development',

    // Database
    POSTGRES_URL: 'postgresql://postgres:postgres@localhost:5432/boilerplate',

    // Redis
    REDIS_URL: 'redis://localhost:6379',

    // Kinde Auth
    KINDE_CLIENT_ID: kinde.clientId,
    KINDE_CLIENT_SECRET: kinde.clientSecret,
    KINDE_ISSUER_URL: kinde.issuerUrl,
    KINDE_SITE_URL: BASE_URL,
    KINDE_POST_CALLBACK_URL: `${BASE_URL}/api/auth/kinde/callback`,
    KINDE_POST_LOGOUT_REDIRECT_URL: BASE_URL,

    // Stripe
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
  });

  console.log('\n🎉 Setup complete! Next steps:');
  console.log('  1. pnpm db:migrate');
  console.log('  2. pnpm db:seed');
  console.log('  3. pnpm dev');
  console.log('  4. Open http://localhost:3000');
}

main().catch(console.error);
