import { useEffect, useState } from 'react';

interface LightSweepProps {
  active: boolean;
}

export function LightSweep({ active }: LightSweepProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
      {/* Horizontal light sweep */}
      <div 
        className="absolute top-0 h-full w-32 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[sweep_1s_ease-in-out]"
        style={{ 
          animation: 'sweep 1s ease-in-out forwards',
        }}
      />
      
      {/* Particle burst */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/80"
            style={{
              animation: `particle-${i % 4} 1s ease-out forwards`,
              animationDelay: `${i * 30}ms`,
            }}
          />
        ))}
      </div>
      
      <style>{`
        @keyframes sweep {
          0% { left: -128px; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes particle-0 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(100px, -80px) scale(0); opacity: 0; }
        }
        @keyframes particle-1 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-120px, 60px) scale(0); opacity: 0; }
        }
        @keyframes particle-2 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(80px, 100px) scale(0); opacity: 0; }
        }
        @keyframes particle-3 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-60px, -120px) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
