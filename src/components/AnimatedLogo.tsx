interface AnimatedLogoProps {
  className?: string;
  size?: number;
}

const AnimatedLogo = ({ className = "", size = 160 }: AnimatedLogoProps) => {
  return (
    <img
      src="/logo-animated.gif"
      alt="Legacy"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default AnimatedLogo;
