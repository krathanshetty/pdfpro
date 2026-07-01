import { useEffect, useRef } from 'react';

export default function AmbientBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle class definition
    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.25;
        this.speedY = -Math.random() * 0.3 - 0.1; // Float upwards slowly
        this.opacity = Math.random() * 0.5 + 0.1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Reset particle if it drifts off-screen
        if (this.y < 0 || this.x < 0 || this.x > width) {
          this.reset();
          this.y = height; // start back at bottom
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#E11D48'; // Rose accent color
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Gradient orb class definition
    class GradientOrb {
      constructor(color, radius, speed) {
        this.color = color;
        this.radius = radius;
        this.speed = speed;
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off bounds
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        ctx.save();
        const grad = ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.radius
        );
        grad.addColorStop(0, this.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const particles = Array.from({ length: 45 }, () => new Particle());
    
    // Create large crimson blobs for the mesh gradient
    const orbs = [
      new GradientOrb('rgba(225, 29, 72, 0.08)', 350, 0.4),
      new GradientOrb('rgba(159, 18, 57, 0.06)', 450, 0.3),
      new GradientOrb('rgba(244, 63, 94, 0.04)', 300, 0.5),
    ];

    const render = () => {
      // Clear with very dark shade (black-rose background)
      ctx.fillStyle = '#090909';
      ctx.fillRect(0, 0, width, height);

      // Draw and update orbs
      orbs.forEach((orb) => {
        orb.update();
        orb.draw();
      });

      // Draw and update particles
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    // Handle window resizing
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-20 bg-[#090909]"
    />
  );
}
