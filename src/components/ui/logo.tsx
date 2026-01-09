import type React from 'react';

const TwinPathIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="purple"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M4 20c2-2.5 4-3 6-3s4 0.5 6 3" />
        <path d="M4 4c2 2.5 4 3 6 3s4-0.5 6-3" />
    </svg>
);


export function Logo() {
    return (
        <div className="flex items-center justify-center gap-2" aria-label="TwinPath home">
            <TwinPathIcon className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold font-headline text-foreground">TwinPath</span>
        </div>
    )
}