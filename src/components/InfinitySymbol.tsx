const InfinitySymbol = ({ className = "", size = 80 }: { className?: string; size?: number }) => {
  return (
    <div className={`animate-float ${className}`}>
      <svg
        width={size}
        height={size * 0.5}
        viewBox="0 0 200 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 50 C50 20, 90 20, 100 50 C110 80, 150 80, 150 50 C150 20, 110 20, 100 50 C90 80, 50 80, 50 50 Z"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="infinity-draw"
          fill="none"
        />
        {/* Leaf sprouts */}
        <g className="animate-sprout" style={{ animationDelay: "0.6s" }}>
          <path
            d="M100 50 C100 35, 110 25, 105 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M105 15 C100 18, 95 22, 100 30"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M105 15 C110 18, 112 24, 108 28"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>
        {/* Root */}
        <g className="animate-sprout" style={{ animationDelay: "0.9s" }}>
          <path
            d="M100 50 C100 65, 98 75, 100 85"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M100 75 C96 80, 94 85, 96 90"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M100 75 C104 80, 106 85, 104 90"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
};

export default InfinitySymbol;
