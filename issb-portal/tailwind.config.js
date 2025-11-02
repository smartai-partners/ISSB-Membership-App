/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			fontFamily: {
				sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
				display: ['Inter', 'sans-serif'],
			},
			colors: {
				border: '#e0e0e0',
				input: '#e0e0e0',
				ring: '#4caf50',
				background: '#ffffff',
				foreground: '#424242',
				primary: {
					50: '#e8f5e9',
					100: '#c8e6c9',
					200: '#a5d6a7',
					300: '#81c784',
					400: '#66bb6a',
					500: '#4caf50',
					600: '#43a047',
					700: '#388e3c',
					800: '#2e7d32',
					900: '#1b5e20',
					DEFAULT: '#4caf50',
					foreground: '#ffffff',
				},
				secondary: {
					DEFAULT: '#9e9e9e',
					foreground: '#424242',
				},
				accent: {
					DEFAULT: '#f5f5f5',
					foreground: '#424242',
				},
				success: {
					DEFAULT: '#4caf50',
					light: '#e8f5e9',
					dark: '#388e3c',
				},
				warning: {
					DEFAULT: '#ff9800',
					light: '#fff3e0',
					dark: '#f57c00',
				},
				error: {
					DEFAULT: '#f44336',
					light: '#ffebee',
					dark: '#d32f2f',
				},
				info: {
					DEFAULT: '#2196f3',
					light: '#e3f2fd',
					dark: '#1976d2',
				},
				destructive: {
					DEFAULT: '#f44336',
					foreground: '#ffffff',
				},
				muted: {
					DEFAULT: '#f5f5f5',
					foreground: '#757575',
				},
				popover: {
					DEFAULT: '#ffffff',
					foreground: '#424242',
				},
				card: {
					DEFAULT: '#ffffff',
					foreground: '#424242',
				},
				gray: {
					50: '#fafafa',
					100: '#f5f5f5',
					200: '#eeeeee',
					300: '#e0e0e0',
					400: '#bdbdbd',
					500: '#9e9e9e',
					600: '#757575',
					700: '#616161',
					800: '#424242',
					900: '#212121',
				},
			},
			borderRadius: {
				lg: '0.5rem',
				md: '0.375rem',
				sm: '0.25rem',
				xl: '0.75rem',
				'2xl': '1rem',
				'3xl': '1.5rem',
			},
			boxShadow: {
				'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
				'DEFAULT': '0 2px 8px 0 rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
				'md': '0 2px 8px 0 rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
				'lg': '0 4px 16px 0 rgb(0 0 0 / 0.1), 0 2px 8px -2px rgb(0 0 0 / 0.08)',
				'xl': '0 8px 24px 0 rgb(0 0 0 / 0.12), 0 4px 12px -4px rgb(0 0 0 / 0.1)',
				'2xl': '0 16px 48px 0 rgb(0 0 0 / 0.14), 0 8px 24px -8px rgb(0 0 0 / 0.12)',
				'none': 'none',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
				'fade-in': {
					from: { opacity: 0 },
					to: { opacity: 1 },
				},
				'slide-up': {
					from: { transform: 'translateY(10px)', opacity: 0 },
					to: { transform: 'translateY(0)', opacity: 1 },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-in-out',
				'slide-up': 'slide-up 0.3s ease-out',
			},
			transitionDuration: {
				'fast': '150ms',
				'base': '200ms',
				'slow': '300ms',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}
