import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PackRevealProps, RevealPhase } from './types';
import { RevealCountdown } from './RevealCountdown';
import { LightSweep } from './LightSweep';
import { RevealStage } from './RevealStage';
import { Button } from '@/components/ui/button';

export function PackRevealModal({
  cards,
  teamName,
  sportName,
  seasonLabel,
  schoolLogo,
  onComplete,
  onClose,
}: PackRevealProps) {
  const [phase, setPhase] = useState<RevealPhase>('intro');

  const handleStartReveal = useCallback(() => {
    setPhase('countdown');
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setPhase('revealing');
  }, []);

  const handleAllRevealed = useCallback(() => {
    setPhase('complete');
  }, []);

  const handleFinish = useCallback(() => {
    onComplete();
    onClose();
  }, [onComplete, onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl animate-pulse" 
          style={{ animationDelay: '1s' }} 
        />
        
        {/* Grid lines */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      {/* Light sweep effect */}
      <LightSweep active={phase === 'revealing'} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Content based on phase */}
      <div className="relative z-30 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-center gap-4 pt-8">
          {schoolLogo && (
            <img src={schoolLogo} alt="" className="w-12 h-12 object-contain" />
          )}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">{teamName}</h1>
            <p className="text-sm text-white/60">{sportName} • {seasonLabel}</p>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 relative">
          {/* Intro phase */}
          {phase === 'intro' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 animate-fade-in">
              <div className="text-center">
                <h2 className="text-4xl font-black text-white mb-2">
                  ROSTER REVEAL
                </h2>
                <p className="text-lg text-white/60">
                  {cards.length} athletes ready to be unveiled
                </p>
              </div>
              
              {/* Pack visual */}
              <div className="relative">
                <div className="w-48 h-64 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 border-4 border-white/20 shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform cursor-pointer"
                  onClick={handleStartReveal}
                >
                  <div className="text-center">
                    <span className="text-6xl">🎴</span>
                    <p className="text-white font-bold mt-2">TAP TO OPEN</p>
                  </div>
                </div>
                
                {/* Glow */}
                <div className="absolute inset-0 rounded-xl bg-primary/30 blur-2xl -z-10 animate-pulse" />
              </div>

              <Button 
                size="lg" 
                onClick={handleStartReveal}
                className="text-lg px-8"
              >
                Open Pack
              </Button>
            </div>
          )}

          {/* Countdown phase */}
          {phase === 'countdown' && (
            <RevealCountdown onComplete={handleCountdownComplete} />
          )}

          {/* Revealing phase */}
          {phase === 'revealing' && (
            <RevealStage cards={cards} onAllRevealed={handleAllRevealed} />
          )}

          {/* Complete phase */}
          {phase === 'complete' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 animate-fade-in">
              <div className="text-center">
                <h2 className="text-4xl font-black text-white mb-2">
                  🏆 ROSTER COMPLETE!
                </h2>
                <p className="text-lg text-white/60">
                  All {cards.length} team members revealed
                </p>
              </div>

              {/* Stats summary */}
              <div className="flex gap-8">
                {[
                  { label: 'Athletes', value: cards.filter(c => c.role === 'player').length },
                  { label: 'Coaches', value: cards.filter(c => c.role === 'coach').length },
                  { label: 'Staff', value: cards.filter(c => c.role === 'staff').length },
                ].filter(s => s.value > 0).map(stat => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl font-black text-white">{stat.value}</div>
                    <div className="text-sm text-white/60">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={handleFinish}>
                  View Team
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
