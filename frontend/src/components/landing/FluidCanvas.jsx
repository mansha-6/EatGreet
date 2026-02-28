import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function FluidCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Configuration
        const config = {
            particleCount: 150,
            baseColor: '253, 105, 65', // #FD6941 rgb
            connectionDistance: 120,
            mouseRadius: 150,
        };

        let particles = [];
        let mouse = { x: null, y: null };

        // Handle Resize
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        // Track Mouse
        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const handleMouseLeave = () => {
            mouse.x = null;
            mouse.y = null;
        };

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 1;
                this.vy = (Math.random() - 0.5) * 1;
                this.radius = Math.random() * 2 + 1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${config.baseColor}, 0.5)`;
                ctx.fill();
            }

            update() {
                // Bounce off edges
                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

                this.x += this.vx;
                this.y += this.vy;

                // Mouse interaction / Repel
                if (mouse.x && mouse.y) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < config.mouseRadius) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (config.mouseRadius - distance) / config.mouseRadius;

                        this.x -= forceDirectionX * force * 5;
                        this.y -= forceDirectionY * force * 5;
                    }
                }

                this.draw();
            }
        }

        const initParticles = () => {
            particles = [];

            // Generate fewer particles on smaller screens
            const responsiveParticleCount = Math.floor((window.innerWidth * window.innerHeight) / 10000);
            const finalCount = Math.min(responsiveParticleCount, config.particleCount);

            for (let i = 0; i < finalCount; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();

                // Draw connections
                for (let j = i; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < config.connectionDistance) {
                        const opacity = 1 - (distance / config.connectionDistance);
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${config.baseColor}, ${opacity * 0.3})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <motion.canvas
            ref={canvasRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="fixed inset-0 w-full h-full pointer-events-none z-[-1] mix-blend-multiply"
        />
    );
}
