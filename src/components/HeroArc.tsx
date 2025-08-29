import * as React from "react";

export function HeroArc({ className = "", opacity = 0.65 }: { className?: string; opacity?: number }) {
	return (
		<svg
			className={className}
			viewBox="0 0 1200 400"
			fill="none"
			aria-hidden="true"
			focusable="false"
			style={{ opacity }}
		>
			<defs>
				<linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0%" stopColor="hsl(246 90% 60%)" />
					<stop offset="100%" stopColor="hsl(192 92% 50%)" />
				</linearGradient>
				<filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="12" />
				</filter>
			</defs>
			<g filter="url(#blur)" stroke="url(#arcGrad)" strokeWidth="3" strokeLinecap="round" opacity="0.8">
				<path d="M0,280 C240,120 480,80 720,140 C900,184 1060,240 1200,140" />
				<path d="M0,300 C260,140 520,100 760,160 C940,204 1080,250 1200,160" opacity="0.65" />
				<path d="M0,320 C280,160 560,120 800,180 C980,224 1100,260 1200,180" opacity="0.5" />
			</g>
		</svg>
	);
}
