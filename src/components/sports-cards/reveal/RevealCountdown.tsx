import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface RevealCountdownProps {
  onComplete: () => void;
}

export function RevealCountdown({ onComplete }: RevealCountdownProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCount(count - 1), 800);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Radial pulse effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          key={count}
          className="w-64 h-64 rounded-full bg-primary/20 animate-[ping_0.8s_ease-out]"
        />
      </div>
      
      {/* Number */}
      <span 
        key={`num-${count}`}
        className={cn(
          'text-[200px] font-black text-white drop-shadow-2xl',
          'animate-[scale-in_0.3s_ease-out,fade-out_0.5s_ease-in_0.3s]'
        )}
        style={{ textShadow: '0 0 100px rgba(255,255,255,0.5)' }}
      >
        {count > 0 ? count : ''}
      </span>
    </div>
  );
}
