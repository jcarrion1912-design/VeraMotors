// Identidad gráfica del sistema: tacómetro (marca) y silueta de vehículo.

export function BrandMark({ size = 36 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect width="48" height="48" rx="10" fill="#134455" />
            <path d="M11.3 33.2a15.5 15.5 0 1 1 25.4 0" stroke="#86b8c7" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M24 26.5 33.4 15" stroke="#f2851b" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="24" cy="26.5" r="3.4" fill="#f2851b" />
        </svg>
    );
}

export function VehicleSilhouette({ className }) {
    return (
        <svg className={className} viewBox="0 0 640 210" fill="none" aria-hidden="true">
            <path
                d="M24 150q-4-24 30-30l92-16c38-34 92-56 168-56 72 0 122 18 170 54l76 14c30 6 52 16 56 34l2 14q0 8-8 8h-42a46 46 0 0 0-92 0H206a46 46 0 0 0-92 0H34q-10 0-10-8z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M172 104c30-26 76-42 132-43v43zM322 61c54 1 94 15 130 43H322z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <circle cx="160" cy="172" r="33" stroke="currentColor" strokeWidth="2" />
            <circle cx="160" cy="172" r="12" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="500" cy="172" r="33" stroke="currentColor" strokeWidth="2" />
            <circle cx="500" cy="172" r="12" stroke="currentColor" strokeWidth="1.5" />
            <path d="M0 206h640" stroke="currentColor" strokeWidth="1" strokeDasharray="2 10" />
        </svg>
    );
}
