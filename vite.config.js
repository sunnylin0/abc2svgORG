import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/abc2svg.ts'),
			name: 'abc2svg',
			fileName: 'abc2svg'
		},
		rollupOptions: {
			output: {
				extend: true, // Attempt to extend the global variable if it exists
			}
		}
	},
	server: {
		open: '/edit.html'
	}
});
