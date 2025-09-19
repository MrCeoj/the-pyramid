/*"use client";
import React, { useEffect, useRef } from "react";

const EmbersBackground = ({ children }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const gradientCacheRef = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Optimize canvas context
    ctx.imageSmoothingEnabled = false;
    
    const isMobile = window.innerWidth < 768;
    const pixelRatio = isMobile ? 0.5 : (window.devicePixelRatio || 1);

    // Set canvas size to viewport dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth * pixelRatio;
      canvas.height = window.innerHeight * pixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingEnabled = false;
      
      // Clear gradient cache on resize
      gradientCacheRef.current = {};
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Pre-calculate random values for performance
    const getRandomFloat = (min, max) => Math.random() * (max - min) + min;
    
    // Optimized Ember class
    class Ember {
      constructor() {
        this.reset();
        this.y = Math.random() * window.innerHeight; // Start at random height initially
        // Pre-calculate flicker values
        this.flickerOffset = Math.random() * Math.PI * 2;
        this.baseFlicker = getRandomFloat(0.6, 0.9);
      }

      reset() {
        this.x = Math.random() * window.innerWidth;
        this.y = window.innerHeight + 20; // Start from bottom of viewport
        this.size = getRandomFloat(1.5, 3.5);
        this.speedX = getRandomFloat(-0.8, 0.8);
        this.speedY = getRandomFloat(-8.5, -5.2);
        this.life = 1;
        this.decay = getRandomFloat(0.003, 0.007);
        this.flickerSpeed = getRandomFloat(0.008, 0.015);
      }

      update() {
        // Simplified physics
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Reduced random drift calculations
        if (Math.random() < 0.1) { // Only 10% of frames
          this.speedX += getRandomFloat(-0.03, 0.03);
        }

        // Simplified flicker using pre-calculated offset
        this.flicker = this.baseFlicker + Math.sin(Date.now() * this.flickerSpeed + this.flickerOffset) * 0.2;

        // Life decay
        this.life -= this.decay;

        // Reset conditions - use viewport dimensions
        if (this.life <= 0 || this.y < -20 || Math.abs(this.x) > window.innerWidth + 20) {
          this.reset();
        }
      }

      draw(ctx) {
        if (this.life <= 0) return;

        const alpha = this.life * this.flicker;
        if (alpha < 0.1) return; // Skip very transparent particles

        // Use cached gradients for better performance
        const gradientKey = `${Math.floor(this.size)}_${Math.floor(alpha * 10)}`;
        let gradient = gradientCacheRef.current[gradientKey];
        
        if (!gradient) {
          const glowSize = this.size * 2.5;
          gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
          gradient.addColorStop(0, `rgba(255, 200, 100, ${alpha})`);
          gradient.addColorStop(0.4, `rgba(255, 120, 40, ${alpha * 0.6})`);
          gradient.addColorStop(1, 'rgba(255, 60, 0, 0)');
          
          // Cache gradient if we have room
          if (Object.keys(gradientCacheRef.current).length < 50) {
            gradientCacheRef.current[gradientKey] = gradient;
          }
        }

        // Single draw call with transform
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
      }
    }

    // Heavily reduced particle count for mobile
    const particleCount = isMobile ? 8 : 25;
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(new Ember());
    }

    // Throttled animation with frame skipping on mobile
    let lastTime = 0;
    const targetFPS = isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime) => {
      if (currentTime - lastTime >= frameInterval) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        particlesRef.current.forEach((particle) => {
          particle.update();
          particle.draw(ctx);
        });

        lastTime = currentTime;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate(lastTime);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none w-full h-full"
        style={{ zIndex: 1 }}
      />
      <div style={{ zIndex: 2 }} className="relative w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default EmbersBackground;*/