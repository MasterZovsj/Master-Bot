import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
	/*
	 * Specify what prefix the client-side variables must have.
	 * This is enforced both on type-level and at runtime.
	 */
	clientPrefix: 'PUBLIC_',
	server: {
		DISCORD_TOKEN: z.string(),
		TENOR_API: z.string(),
		RAWG_API: z.string().optional(),
		// Redis
		REDIS_HOST: z.string().optional(),
		REDIS_PORT: z.string().optional(),
		REDIS_PASSWORD: z.string().optional(),
		REDIS_DB: z.string().optional(),
		// Lavalink
		LAVA_HOST: z.string().optional(),
		LAVA_PORT: z.string().optional(),
		LAVA_PASS: z.string().optional(),
		LAVA_SECURE: z.string().optional(),
		SPOTIFY_CLIENT_ID: z.string().optional(),
		SPOTIFY_CLIENT_SECRET: z.string().optional()
	},
	client: {},
	/**
	 * What object holds the environment variables at runtime.
	 * Often `process.env` or `import.meta.env`
	 */
	runtimeEnv: process.env
});
