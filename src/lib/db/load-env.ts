import { config } from 'dotenv';

/**
 * Standalone scripts (migrate / seed) run outside Next.js, so they do not get
 * Next's automatic env loading. Load the same files, in the same precedence
 * order, so `npm run db:seed` and `npm run dev` always agree.
 */
config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });
