"use client"
import React, { useEffect, useRef } from 'react';

const EmbersBackground = ({ children }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle class
    class Ember {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height; // Start at random height initially
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 20;
        this.size = Math.random() * 4 + 1;
        this.speedX = (Math.random() - 0.5) * 1.2;
        this.speedY = -(Math.random() * 1.5 + 2);
        this.life = 1;
        this.decay = Math.random() * 0.005 + 0.002;
        this.flicker = Math.random() * 0.3 + 0.7;
        this.flickerSpeed = Math.random() * 0.02 + 0.01;
      }

      update() {
        // Physics
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedX += (Math.random() - 0.5) * 0.05; // Random drift
        this.speedY += Math.random() * 0.02 - 0.01; // Slight upward acceleration variation
        
        // Flicker effect
        this.flicker += Math.sin(Date.now() * this.flickerSpeed) * 0.1;
        this.flicker = Math.max(0.3, Math.min(1, this.flicker));
        
        // Life decay
        this.life -= this.decay;
        this.size = Math.max(0, this.size - 0.01);

        // Reset if particle is dead or off screen
        if (this.life <= 0 || this.y < -20 || this.x < -20 || this.x > canvas.width + 20) {
          this.reset();
        }
      }

      draw(ctx) {
        if (this.life <= 0) return;

        const alpha = this.life * this.flicker;
        const glowSize = this.size * 3;

        // Create gradient for glow effect
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, glowSize
        );
        
        // Hot ember colors
        gradient.addColorStop(0, `rgba(255, 160, 60, ${alpha})`);
        gradient.addColorStop(0.3, `rgba(255, 100, 30, ${alpha * 0.8})`);
        gradient.addColorStop(0.6, `rgba(255, 60, 10, ${alpha * 0.4})`);
        gradient.addColorStop(1, `rgba(255, 30, 0, 0)`);

        // Draw outer glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw bright core
        const coreGradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size
        );
        coreGradient.addColorStop(0, `rgba(255, 220, 120, ${alpha})`);
        coreGradient.addColorStop(0.7, `rgba(255, 140, 60, ${alpha * 0.8})`);
        coreGradient.addColorStop(1, `rgba(255, 80, 20, ${alpha * 0.3})`);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = coreGradient;
        ctx.fill();
      }
    }

    // Initialize particles
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(new Ember());
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw(ctx);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />
      <div style={{ zIndex: 2 }} className="relative w-full h-full">
        {children}
      </div>
    </div>
  );
};


export default EmbersBackground;