import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

export const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_BASE_URL || import.meta.env.NEON_AUTH_BASE_URL, {
  adapter: BetterAuthReactAdapter(),
});
