/** Hero art: two blue speech bubbles with a "?" and a few yellow spark lines. Pure SVG. */
export function HelpIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 180 160"
      width="180"
      height="160"
      role="img"
      aria-label="Speech bubble with a question mark"
    >
      <defs>
        <linearGradient id="supHelpFront" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="supHelpBack" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#93c5fd" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {/* back bubble */}
      <path
        d="M22 78 h50 a14 14 0 0 1 14 14 v30 a14 14 0 0 1 -14 14 h-24 l-14 16 v-16 h-12 a14 14 0 0 1 -14 -14 v-30 a14 14 0 0 1 14 -14z"
        fill="url(#supHelpBack)"
        opacity="0.85"
      />
      {/* front bubble */}
      <path
        d="M56 34 h78 a18 18 0 0 1 18 18 v46 a18 18 0 0 1 -18 18 h-48 l-20 20 v-20 h-10 a18 18 0 0 1 -18 -18 v-46 a18 18 0 0 1 18 -18z"
        fill="url(#supHelpFront)"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <text
        x="95"
        y="96"
        textAnchor="middle"
        fontSize="58"
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
        fill="#ffffff"
      >
        ?
      </text>
      {/* sparks */}
      <g stroke="#facc15" strokeWidth="5" strokeLinecap="round">
        <line x1="140" y1="12" x2="134" y2="26" />
        <line x1="160" y1="18" x2="148" y2="30" />
        <line x1="170" y1="36" x2="156" y2="40" />
      </g>
    </svg>
  );
}
