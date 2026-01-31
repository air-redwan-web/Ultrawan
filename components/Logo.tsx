import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 40 }) => {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`} style={{ width: size, height: size }}>
      <img 
        src="https://i.postimg.cc/nLLxjNLN/Untitled-design-9.png" 
        alt="Ultrawan Logo" 
        className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
      />
    </div>
  );
};

export default Logo;