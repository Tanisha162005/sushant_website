/**
 * ComingSoon3D — Magnificent Glass Crystal
 * ========================================
 * A breathtaking, cinematic 3D scene featuring a floating, slowly rotating
 * glass crystal core surrounded by orbiting shards and golden dust.
 * Pure, elegant 3D art designed to look premium and sophisticated.
 *
 * Features:
 *   - Central Octahedron (Diamond/Crystal shape) with complex glass material
 *   - Orbiting geometric shards
 *   - Cinematic lighting (deep purple, gold, and white rim light)
 *   - Floating gold/purple dust particles
 *   - Smooth, majestic animations
 */

'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function ComingSoon3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const isMobile = window.innerWidth < 768;

    // ── Scene Setup ─────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0514, 0.05);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, isMobile ? 8 : 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // High quality
    renderer.setClearColor(0x000000, 0);
    // Enable tone mapping for better lighting contrast
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // ── Cinematic Lighting ──────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x120a24, 2.0); // Soft dark purple ambient
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xd8b4fe, 3.0); // Soft gold/purple main
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    const fillLight = new THREE.PointLight(0x7c3aed, 5.0, 20); // Deep purple fill
    fillLight.position.set(-5, -2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffffff, 4.0, 20); // Crisp white rim
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    // ── Materials ───────────────────────────────────────────────────────────
    // Premium Glass Material
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.9, // Glass effect
      ior: 1.5,
      thickness: 2.0,
      attenuationColor: new THREE.Color(0xa855f7), // Purple tint inside
      attenuationDistance: 2.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const wireMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8b4fe, // Accent gold/light purple
      metalness: 0.8,
      roughness: 0.2,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });

    const solidMaterial = new THREE.MeshStandardMaterial({
      color: 0x0b0514, // Dark core
      metalness: 0.9,
      roughness: 0.4,
      envMapIntensity: 1.0,
    });

    // ── Central Crystal ─────────────────────────────────────────────────────
    const crystalGroup = new THREE.Group();
    scene.add(crystalGroup);

    const coreGeo = new THREE.OctahedronGeometry(1.5, 0);
    
    // Outer glass shell
    const crystalMesh = new THREE.Mesh(coreGeo, glassMaterial);
    crystalGroup.add(crystalMesh);

    // Inner dark core
    const innerCoreGeo = new THREE.OctahedronGeometry(0.8, 0);
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, solidMaterial);
    crystalGroup.add(innerCoreMesh);

    // Inner wireframe
    const innerWireGeo = new THREE.OctahedronGeometry(1.55, 0);
    const innerWireMesh = new THREE.Mesh(innerWireGeo, wireMaterial);
    crystalGroup.add(innerWireMesh);

    // ── Orbiting Shards ─────────────────────────────────────────────────────
    const shardsGroup = new THREE.Group();
    scene.add(shardsGroup);

    const shardGeo = new THREE.OctahedronGeometry(0.2, 0);
    const numShards = isMobile ? 12 : 24;
    
    const shards: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; axis: THREE.Vector3 }[] = [];

    for (let i = 0; i < numShards; i++) {
      // Alternate materials for shards
      const mat = i % 3 === 0 ? wireMaterial : i % 3 === 1 ? glassMaterial : solidMaterial;
      const shard = new THREE.Mesh(shardGeo, mat);
      
      const angle = (i / numShards) * Math.PI * 2;
      const radius = 2.5 + Math.random() * 1.5;
      const speed = 0.2 + Math.random() * 0.4;
      const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      
      // Initial scale variation
      const scale = 0.5 + Math.random() * 1.0;
      shard.scale.setScalar(scale);

      shardsGroup.add(shard);
      shards.push({ mesh: shard, angle, radius, speed, axis });
    }

    // ── Ambient Dust Particles ──────────────────────────────────────────────
    const dustCount = isMobile ? 200 : 500;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    const color1 = new THREE.Color(0xd8b4fe); // light gold/purple
    const color2 = new THREE.Color(0xa855f7); // vivid purple

    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 15;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;

      const mix = Math.random();
      const mixedColor = color1.clone().lerp(color2, mix);
      dustColors[i * 3] = mixedColor.r;
      dustColors[i * 3 + 1] = mixedColor.g;
      dustColors[i * 3 + 2] = mixedColor.b;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // ── Mouse Interaction ───────────────────────────────────────────────────
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    if (!isMobile) window.addEventListener('mousemove', onMouseMove);

    // ── Animation Loop ──────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth mouse target
      target.x += (mouse.x - target.x) * 0.02;
      target.y += (mouse.y - target.y) * 0.02;

      // Rotate central crystal
      crystalGroup.rotation.y = time * 0.15;
      crystalGroup.rotation.x = time * 0.1 + target.y * 0.5;
      crystalGroup.rotation.z = target.x * 0.5;
      
      // Floating motion
      crystalGroup.position.y = Math.sin(time * 0.5) * 0.3;

      // Counter-rotate inner core slightly
      innerCoreMesh.rotation.y = -time * 0.3;
      innerWireMesh.rotation.z = time * 0.2;

      // Animate shards
      shards.forEach((s, i) => {
        const t = time * s.speed + s.angle;
        // Orbit position
        s.mesh.position.x = Math.cos(t) * s.radius;
        s.mesh.position.z = Math.sin(t) * s.radius;
        s.mesh.position.y = Math.sin(t * 2 + s.angle) * 1.5;
        
        // Spin on own axis
        s.mesh.rotateOnAxis(s.axis, 0.02);
      });

      // Slowly rotate shard group based on mouse
      shardsGroup.rotation.x = target.y * 0.2;
      shardsGroup.rotation.y = target.x * 0.2;

      // Animate dust
      dust.rotation.y = time * 0.02;
      dust.position.y = Math.sin(time * 0.2) * 0.5;

      // Dynamic lighting
      mainLight.position.x = 5 + Math.sin(time * 0.5) * 2;
      mainLight.position.z = 5 + Math.cos(time * 0.3) * 2;

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ──────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!container) return;
      const m = window.innerWidth < 768;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.position.set(0, 0, m ? 8 : 6);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', onResize);

    // ── Cleanup ─────────────────────────────────────────────────────────────
    return () => {
      if (!isMobile) window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameId);
      
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((mat) => mat.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
