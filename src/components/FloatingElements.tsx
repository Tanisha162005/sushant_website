'use client';
import { useEffect, useRef } from 'react';

export const FloatingElements = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollY = window.scrollY;
        const elements = containerRef.current.querySelectorAll('[data-speed]');
        elements.forEach((el) => {
          const speed = parseFloat(el.getAttribute('data-speed') || '0');
          const rotSpeed = parseFloat(el.getAttribute('data-rotate') || '0');
          let transform = `translate3d(0, ${scrollY * speed}px, 0)`;
          if (rotSpeed !== 0) {
            transform += ` rotate(${scrollY * rotSpeed}deg)`;
          }
          (el as HTMLElement).style.transform = transform;
        });
      }
      ticking = false;
    };
    
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Glow Orb 1 - Top Left */}
      <div 
        className="glow-orb absolute rounded-full opacity-10 blur-[80px]"
        data-speed="0.15"
        style={{
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
          top: '-10%', left: '-5%'
        }}
      />
      
      {/* Glow Orb 2 - Middle Right */}
      <div 
        className="glow-orb absolute rounded-full opacity-5 blur-[100px]"
        data-speed="-0.2"
        style={{
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
          top: '30%', right: '-10%'
        }}
      />

      {/* Floating Hollow Square */}
      <div 
        className="absolute opacity-20"
        data-speed="0.3"
        data-rotate="0.1"
        style={{
          width: '80px', height: '80px',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '16px',
          top: '20%', left: '15%'
        }}
      />

      {/* Floating Small Circle */}
      <div 
        className="absolute opacity-30"
        data-speed="-0.35"
        style={{
          width: '40px', height: '40px',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          borderRadius: '50%',
          top: '50%', left: '80%'
        }}
      />

      {/* Floating Solid Pill */}
      <div 
        className="absolute opacity-10"
        data-speed="0.25"
        data-rotate="-0.05"
        style={{
          width: '120px', height: '40px',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '9999px',
          top: '75%', left: '20%',
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
        }}
      />

      {/* Deep Background Star/Dot */}
      <div 
        className="absolute opacity-60"
        data-speed="0.1"
        style={{
          width: '8px', height: '8px',
          backgroundColor: '#fff',
          borderRadius: '50%',
          top: '10%', left: '85%',
          boxShadow: '0 0 10px #fff'
        }}
      />
      
      {/* Deep Background Star/Dot 2 */}
      <div 
        className="absolute opacity-40"
        data-speed="-0.15"
        style={{
          width: '6px', height: '6px',
          backgroundColor: '#fff',
          borderRadius: '50%',
          top: '85%', left: '10%',
          boxShadow: '0 0 10px #fff'
        }}
      />
    </div>
  );
};
