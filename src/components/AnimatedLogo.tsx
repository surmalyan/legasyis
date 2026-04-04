import { useRef, useEffect } from "react";

interface AnimatedLogoProps {
  className?: string;
  size?: number;
}

const AnimatedLogo = ({ className = "", size = 160 }: AnimatedLogoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <video
      ref={videoRef}
      src="/logo-animated.mp4"
      autoPlay
      loop
      muted
      playsInline
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default AnimatedLogo;
