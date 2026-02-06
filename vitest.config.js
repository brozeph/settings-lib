import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		include: ['test/src/**/*.js'],
		coverage: {
			reporter: ['lcov', 'text'],
			reportsDirectory: './coverage',
		},
	},
});
