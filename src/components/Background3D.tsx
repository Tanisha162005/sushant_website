'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Background3D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: !isMobile, // Disable antialias on mobile for performance
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    camera.position.z = 5;

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    const whiteLight = new THREE.PointLight(0xffffff, 2, 10);
    whiteLight.position.set(-2, -2, 2);
    scene.add(whiteLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const particlesGeometry = new THREE.BufferGeometry();
    const count = isMobile ? 20 : 300; // Significantly reduce particle count on mobile
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 15;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({ size: 0.02, color: 0x9ca3af });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.target.id === 'home') {
          isVisible = entry.isIntersecting;
        }
      });
    }, { rootMargin: '200px' });
    
    const homeEl = document.getElementById('home');
    if (homeEl) observer.observe(homeEl);

    let animationId: number;
    const animateThree = () => {
      animationId = requestAnimationFrame(animateThree);
      if (!isVisible) return; // Skip rendering when out of view
      // Reduce animation speed on mobile to save CPU/GPU cycles
      particles.rotation.y += isMobile ? 0.0002 : 0.001;
      particles.rotation.x += isMobile ? 0.0001 : 0.0005;
      renderer.render(scene, camera);
    };
    animateThree();

    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      renderer.setPixelRatio(newIsMobile ? 1 : Math.min(window.devicePixelRatio, 2));
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} id="bg-canvas" className="fixed top-0 left-0 z-0 pointer-events-none" />;
};
