import logoStatic from "@/assets/logo-static.png";

interface StaticLogoProps {
  className?: string;
  size?: number;
}

const StaticLogo = ({ className = "", size = 80 }: StaticLogoProps) => {
  return (
    <img
      src={logoStatic}
      alt="Legacy"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default StaticLogo;
