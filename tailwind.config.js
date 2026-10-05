/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'Public Sans',
  				'Inter',
  				'sans-serif'
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
    			status: {
    				grade1: {
    					DEFAULT: 'hsl(var(--status-grade1))',
    					foreground: 'hsl(var(--status-grade1-foreground))',
    				},
    				grade2: {
    					DEFAULT: 'hsl(var(--status-grade2))',
    					foreground: 'hsl(var(--status-grade2-foreground))',
    				},
    				grade3: {
    					DEFAULT: 'hsl(var(--status-grade3))',
    					foreground: 'hsl(var(--status-grade3-foreground))',
    				},
    				grade4: {
    					DEFAULT: 'hsl(var(--status-grade4))',
    					foreground: 'hsl(var(--status-grade4-foreground))',
    				},
				success: {
					DEFAULT: 'hsl(var(--status-success))',
					foreground: 'hsl(var(--status-success-foreground))',
				},
				warning: {
					DEFAULT: 'hsl(var(--status-warning))',
					foreground: 'hsl(var(--status-warning-foreground))',
				},
				danger: {
					DEFAULT: 'hsl(var(--status-danger))',
					foreground: 'hsl(var(--status-danger-foreground))',
				},
				info: {
					DEFAULT: 'hsl(var(--status-info))',
					foreground: 'hsl(var(--status-info-foreground))',
				},
				neutral: {
					DEFAULT: 'hsl(var(--status-neutral))',
					foreground: 'hsl(var(--status-neutral-foreground))',
				},
			},
			'path-testing': {
				DEFAULT: 'hsl(var(--path-testing))',
				foreground: 'hsl(var(--path-testing-foreground))',
			},
			category: {
				'muscle-relaxants': {
					bg: 'hsl(var(--cat-muscle-relaxants-bg))',
					ring: 'hsl(var(--cat-muscle-relaxants-ring))',
					text: 'hsl(var(--cat-muscle-relaxants-text))',
					border: 'hsl(var(--cat-muscle-relaxants-border))',
					solid: 'hsl(var(--cat-muscle-relaxants-solid))',
					'solid-foreground': 'hsl(var(--cat-muscle-relaxants-solid-foreground))',
					pulse: 'hsl(var(--cat-muscle-relaxants-pulse))',
					action: 'hsl(var(--cat-muscle-relaxants-action))',
				},
				'penicillins': {
					bg: 'hsl(var(--cat-penicillins-bg))',
					ring: 'hsl(var(--cat-penicillins-ring))',
					text: 'hsl(var(--cat-penicillins-text))',
					border: 'hsl(var(--cat-penicillins-border))',
					solid: 'hsl(var(--cat-penicillins-solid))',
					'solid-foreground': 'hsl(var(--cat-penicillins-solid-foreground))',
					pulse: 'hsl(var(--cat-penicillins-pulse))',
					action: 'hsl(var(--cat-penicillins-action))',
				},
				'cephalosporins': {
					bg: 'hsl(var(--cat-cephalosporins-bg))',
					ring: 'hsl(var(--cat-cephalosporins-ring))',
					text: 'hsl(var(--cat-cephalosporins-text))',
					border: 'hsl(var(--cat-cephalosporins-border))',
					solid: 'hsl(var(--cat-cephalosporins-solid))',
					'solid-foreground': 'hsl(var(--cat-cephalosporins-solid-foreground))',
					pulse: 'hsl(var(--cat-cephalosporins-pulse))',
					action: 'hsl(var(--cat-cephalosporins-action))',
				},
				'hypnotics': {
					bg: 'hsl(var(--cat-hypnotics-bg))',
					ring: 'hsl(var(--cat-hypnotics-ring))',
					text: 'hsl(var(--cat-hypnotics-text))',
					border: 'hsl(var(--cat-hypnotics-border))',
					solid: 'hsl(var(--cat-hypnotics-solid))',
					'solid-foreground': 'hsl(var(--cat-hypnotics-solid-foreground))',
					pulse: 'hsl(var(--cat-hypnotics-pulse))',
					action: 'hsl(var(--cat-hypnotics-action))',
				},
				'local-anaesthetics': {
					bg: 'hsl(var(--cat-local-anaesthetics-bg))',
					ring: 'hsl(var(--cat-local-anaesthetics-ring))',
					text: 'hsl(var(--cat-local-anaesthetics-text))',
					border: 'hsl(var(--cat-local-anaesthetics-border))',
					solid: 'hsl(var(--cat-local-anaesthetics-solid))',
					'solid-foreground': 'hsl(var(--cat-local-anaesthetics-solid-foreground))',
					pulse: 'hsl(var(--cat-local-anaesthetics-pulse))',
					action: 'hsl(var(--cat-local-anaesthetics-action))',
				},
				'opioids': {
					bg: 'hsl(var(--cat-opioids-bg))',
					ring: 'hsl(var(--cat-opioids-ring))',
					text: 'hsl(var(--cat-opioids-text))',
					border: 'hsl(var(--cat-opioids-border))',
					solid: 'hsl(var(--cat-opioids-solid))',
					'solid-foreground': 'hsl(var(--cat-opioids-solid-foreground))',
					pulse: 'hsl(var(--cat-opioids-pulse))',
					action: 'hsl(var(--cat-opioids-action))',
				},
				'antiseptics': {
					bg: 'hsl(var(--cat-antiseptics-bg))',
					ring: 'hsl(var(--cat-antiseptics-ring))',
					text: 'hsl(var(--cat-antiseptics-text))',
					border: 'hsl(var(--cat-antiseptics-border))',
					solid: 'hsl(var(--cat-antiseptics-solid))',
					'solid-foreground': 'hsl(var(--cat-antiseptics-solid-foreground))',
					pulse: 'hsl(var(--cat-antiseptics-pulse))',
					action: 'hsl(var(--cat-antiseptics-action))',
				},
				'others': {
					bg: 'hsl(var(--cat-others-bg))',
					ring: 'hsl(var(--cat-others-ring))',
					text: 'hsl(var(--cat-others-text))',
					border: 'hsl(var(--cat-others-border))',
					solid: 'hsl(var(--cat-others-solid))',
					'solid-foreground': 'hsl(var(--cat-others-solid-foreground))',
					pulse: 'hsl(var(--cat-others-pulse))',
					action: 'hsl(var(--cat-others-action))',
				},
				'reversal-agents': {
					bg: 'hsl(var(--cat-reversal-agents-bg))',
					ring: 'hsl(var(--cat-reversal-agents-ring))',
					text: 'hsl(var(--cat-reversal-agents-text))',
					border: 'hsl(var(--cat-reversal-agents-border))',
					solid: 'hsl(var(--cat-reversal-agents-solid))',
					'solid-foreground': 'hsl(var(--cat-reversal-agents-solid-foreground))',
					pulse: 'hsl(var(--cat-reversal-agents-pulse))',
					action: 'hsl(var(--cat-reversal-agents-action))',
				},
				'proton-pump-inhibitors': {
					bg: 'hsl(var(--cat-proton-pump-inhibitors-bg))',
					ring: 'hsl(var(--cat-proton-pump-inhibitors-ring))',
					text: 'hsl(var(--cat-proton-pump-inhibitors-text))',
					border: 'hsl(var(--cat-proton-pump-inhibitors-border))',
					solid: 'hsl(var(--cat-proton-pump-inhibitors-solid))',
					'solid-foreground': 'hsl(var(--cat-proton-pump-inhibitors-solid-foreground))',
					pulse: 'hsl(var(--cat-proton-pump-inhibitors-pulse))',
					action: 'hsl(var(--cat-proton-pump-inhibitors-action))',
				},
				'default': {
					bg: 'hsl(var(--cat-default-bg))',
					ring: 'hsl(var(--cat-default-ring))',
					text: 'hsl(var(--cat-default-text))',
					border: 'hsl(var(--cat-default-border))',
					solid: 'hsl(var(--cat-default-solid))',
					'solid-foreground': 'hsl(var(--cat-default-solid-foreground))',
					pulse: 'hsl(var(--cat-default-pulse))',
					action: 'hsl(var(--cat-default-action))',
				},
			},
  			'nsw-blue': {
  				DEFAULT: 'hsl(var(--nsw-blue))',
  				light: 'hsl(var(--nsw-blue-light))'
  			},
  			'nsw-info': {
  				DEFAULT: 'hsl(var(--nsw-info))',
  				bg: 'hsl(var(--nsw-info-bg))'
  			},
  			masthead: {
  				DEFAULT: 'hsl(var(--masthead))',
  				foreground: 'hsl(var(--masthead-foreground))',
  				accent: 'hsl(var(--masthead-accent))',
  				border: 'hsl(var(--masthead-border))',
				edge: 'hsl(var(--masthead-edge))',
  			},
  			'workflow-active': {
  				DEFAULT: 'hsl(var(--workflow-active))',
  				foreground: 'hsl(var(--workflow-active-foreground))',
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0', opacity: '0' },
  				to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
  				to: { height: '0', opacity: '0' }
  			},
  			'content-enter': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'content-enter-subtle': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(2px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-1000px 0'
  				},
  				'100%': {
  					backgroundPosition: '1000px 0'
  				}
  			},
  			'screen-enter': {
  				'0%': { opacity: '0', transform: 'translateY(8px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			},
  			'row-enter': {
  				'0%': { opacity: '0', transform: 'translateY(4px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			},
  			'section-reveal': {
  				'0%': { opacity: '0', transform: 'translateY(6px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			},
  			'gate-exit': {
  				'0%': { opacity: '1', transform: 'scale(1)' },
  				'100%': { opacity: '0', transform: 'scale(0.97)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'content-enter': 'content-enter 0.2s ease-out forwards',
  			'content-enter-subtle': 'content-enter-subtle 0.15s ease-out forwards',
  			shimmer: 'shimmer 2s linear infinite',
  			'screen-enter': 'screen-enter 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  			'row-enter': 'row-enter 0.2s cubic-bezier(0.4, 0, 0.2, 1) both',
  			'section-reveal': 'section-reveal 0.25s cubic-bezier(0.4, 0, 0.2, 1) both',
  			'gate-exit': 'gate-exit 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  		},
  		borderRadius: {
  			lg: '0',
  			md: '0',
  			sm: '0',
  			xl: '0',
  			'2xl': '0',
  			'3xl': '0'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
