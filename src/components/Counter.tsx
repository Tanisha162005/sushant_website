'use client';
import { useEffect, useRef, useState } from 'react';

export const Counter = ({ target, suffix = '' }: { target: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        let start = 0;
        const duration = 2000;
        const startTime = performance.now();
        
        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          const current = Math.floor(eased * target);
          
          setCount(current);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setCount(target);
          }
        };
        
        requestAnimationFrame(animate);
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    
    observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="stat-number">
      {count}{suffix}
    </span>
  );
};
