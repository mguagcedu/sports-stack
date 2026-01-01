import { User } from 'lucide-react';

interface PlayerSilhouetteProps {
  className?: string;
}

export function PlayerSilhouette({ className }: PlayerSilhouetteProps) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-b from-white/10 to-transparent ${className}`}>
      <User className="w-1/2 h-1/2 text-white/30" strokeWidth={1} />
    </div>
  );
}
