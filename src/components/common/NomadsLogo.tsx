import React from 'react';

interface NomadsLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export const NomadsLogo: React.FC<NomadsLogoProps> = ({
  className = "w-8 h-8",
  size,
  showText = false,
  textClassName = "text-xl font-extrabold text-white tracking-tight",
}) => {
  return (
    <div className="inline-flex items-center gap-2.5">
      <div
        className={`bg-black rounded-xl border border-zinc-800 flex items-center justify-center p-1.5 shadow-md shrink-0 ${className}`}
        style={size ? { width: size, height: size } : undefined}
      >
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
        >
          {/* Outer Black Canvas */}
          <rect width="200" height="200" rx="24" fill="black" />

          {/* Interlocking N-A Stylized Graphic in White */}
          <g fill="white">
            {/* Main Left Vertical Trunk */}
            <path d="M35 70 C35 60, 45 50, 55 50 L55 150 C45 150, 35 140, 35 130 Z" />

            {/* Left-to-Right Arch Loop (N shape) */}
            <path
              d="M55 50 C80 50, 115 90, 140 130 C150 145, 165 150, 175 150 L175 125 C165 125, 150 115, 135 90 C110 50, 80 50, 55 50 Z"
            />

            {/* Right Arch Loop (A shape) */}
            <path
              d="M75 150 C65 150, 50 145, 40 130 C30 115, 45 90, 70 50 C95 50, 125 50, 145 50 C160 50, 170 60, 170 70 L170 150 C160 150, 150 140, 150 130 L150 75 C150 70, 140 68, 135 68 C120 68, 95 68, 75 105 C60 130, 68 150, 75 150 Z"
            />

            {/* Circuit Line Traces & Terminal Nodes - Left */}
            <line x1="10" y1="80" x2="35" y2="80" stroke="white" strokeWidth="4" />
            <circle cx="10" cy="80" r="4" fill="white" />

            <line x1="15" y1="100" x2="35" y2="100" stroke="white" strokeWidth="4" />
            <circle cx="15" cy="100" r="4" fill="white" />

            <line x1="20" y1="120" x2="35" y2="120" stroke="white" strokeWidth="4" />
            <circle cx="20" cy="120" r="4" fill="white" />

            {/* Vertical Circuit Traces - Left */}
            <line x1="45" y1="105" x2="45" y2="125" stroke="black" strokeWidth="3" />
            <line x1="50" y1="95" x2="50" y2="135" stroke="black" strokeWidth="3" />

            {/* Circuit Line Traces & Terminal Nodes - Right */}
            <line x1="170" y1="90" x2="190" y2="90" stroke="white" strokeWidth="4" />
            <circle cx="190" cy="90" r="4" fill="white" />

            <line x1="170" y1="110" x2="185" y2="110" stroke="white" strokeWidth="4" />
            <circle cx="185" cy="110" r="4" fill="white" />

            <line x1="150" y1="85" x2="150" y2="105" stroke="white" strokeWidth="4" />
            <circle cx="150" cy="85" r="4" fill="white" />

            <line x1="160" y1="80" x2="160" y2="100" stroke="white" strokeWidth="4" />
            <circle cx="160" cy="80" r="4" fill="white" />
          </g>
        </svg>
      </div>

      {showText && (
        <span className={textClassName}>
          Nomads<span className="text-zinc-400">Chat</span>
        </span>
      )}
    </div>
  );
};
