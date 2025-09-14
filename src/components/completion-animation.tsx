
'use client';

import { PartyPopper, Sparkles, Star } from 'lucide-react';

const icons = [PartyPopper, Sparkles, Star];

export default function CompletionAnimation() {
  return (
    <>
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        .confetti {
          position: absolute;
          top: 0;
          animation: fall linear forwards;
          pointer-events: none;
        }
      `}</style>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => {
          const Icon = icons[i % icons.length];
          const size = Math.random() * 20 + 10; // 10px to 30px
          const delay = Math.random() * 1.5; // 0s to 1.5s delay
          const duration = Math.random() * 2 + 3; // 3s to 5s duration
          const left = Math.random() * 100; // 0% to 100%
          const colors = ['#fde047', '#f97316', '#ec4899', '#8b5cf6', '#3b82f6'];
          const color = colors[i % colors.length];

          return (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${left}vw`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            >
              <Icon style={{ color: color, width: '100%', height: '100%' }} />
            </div>
          );
        })}
      </div>
    </>
  );
}
