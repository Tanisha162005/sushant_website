'use client';
import { useEffect, useState } from 'react';

export const FloatingElements = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      setScrollY(window.scrollY);
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
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Glow Orb 1 - Top Left */}
      <div 
        className="absolute rounded-full opacity-10 blur-[80px]"
        style={{
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
          top: '-10%', left: '-5%',
          transform: `translateY(${scrollY * 0.15}px)`,
          transition: 'transform 0.1s cubic-bezier(0.1, 0.5, 0.1, 1)'
        }}
      />
      
      {/* Glow Orb 2 - Middle Right */}
      <div 
        className="absolute rounded-full opacity-5 blur-[100px]"
        style={{
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
          top: '30%', right: '-10%',
          transform: `translateY(${scrollY * -0.2}px)`,
          transition: 'transform 0.1s cubic-bezier(0.1, 0.5, 0.1, 1)'
        }}
      />

      {/* Floating Hollow Square */}
      <div 
        className="absolute opacity-20"
        style={{
          width: '80px', height: '80px',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '16px',
          top: '20%', left: '15%',
          transform: `translateY(${scrollY * 0.3}px) rotate(${scrollY * 0.1}deg)`,
          transition: 'transform 0.1s cubic-bezier(0.1, 0.5, 0.1, 1)'
        }}
      />

      {/* Floating Small Circle */}
      <div 
        className="absolute opacity-30"
        style={{
          width: '40px', height: '40px',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          borderRadius: '50%',
          top: '50%', left: '80%',
          transform: `translateY(${scrollY * -0.35}px)`,
          transition: 'transform 0.1s cubic-bezier(0.1, 0.5, 0.1, 1)'
        }}
      />

      {/* Floating Solid Pill */}
      <div 
        className="absolute opacity-10"
        style={{
          width: '120px', height: '40px',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '9999px',
          top: '75%', left: '20%',
          transform: `translateY(${scrollY * 0.25}px) rotate(${-scrollY * 0.05}deg)`,
          transition: 'transform 0.1s cubic-bezier(0.1, 0.5, 0.1, 1)',
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
        }}
      />

      {/* Deep Background Star/Dot */}
      <div 
        className="absolute opacity-60"
        style={{
          width: '8px', height: '8px',
          backgroundColor: '#fff',
          borderRadius: '50%',
          top: '10%', left: '85%',
          transform: `translateY(${scrollY * 0.1}px)`,
          boxShadow: '0 0 10px #fff',
          transition: 'transform 0.1s cubic-bezier(0.1, 0.5, 0.1, 1)'
        }}
      />
      
      {/* Deep Background Star/Dot 2 */}
      <div 
        className="absolute opacity-40"
        style={{
          width: '6px', height: '6px',
          backgroundColor: '#fff',
          borderRadius: '50%',
          top: '85%', left: '10%',
          transform: `translateY(${scrollY * -0.15}px)`,
          boxShadow: '0 0 10px #fff',
          transition: 'transform 0.1s cubic-bezier(0.1, 0.5, 0.1, 1)'
        }}
      />
    </div>
  );
};
