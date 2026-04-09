import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ghost, ArrowLeft, Sparkles } from 'lucide-react'

export default function NotFoundPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center overflow-hidden relative">
      {/* Animated background particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-primary-500 opacity-20 animate-float"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Mouse follow glow */}
      <div
        className="absolute w-64 h-64 rounded-full bg-primary-500 opacity-10 blur-3xl pointer-events-none transition-all duration-300"
        style={{
          left: mousePos.x - 128,
          top: mousePos.y - 128,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 text-center px-4">
        {/* Ghost animation */}
        <div className="mb-8 animate-bounce-slow">
          <Ghost
            size={80}
            className="mx-auto text-primary-400 animate-ghost-float drop-shadow-[0_0_30px_rgba(15,111,130,0.5)]"
          />
        </div>

        {/* 404 text with glitch effect */}
        <div className="relative mb-6">
          <h1
            className="text-9xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-300 to-primary-500 animate-text-shimmer"
            style={{ backgroundSize: '200% 100%' }}
          >
            404
          </h1>
          <div className="absolute inset-0 text-9xl md:text-[12rem] font-black text-primary-500 opacity-30 animate-glitch-1">
            404
          </div>
          <div className="absolute inset-0 text-9xl md:text-[12rem] font-black text-primary-400 opacity-30 animate-glitch-2">
            404
          </div>
        </div>

        {/* Subtitle with typing animation */}
        <p className="text-xl md:text-2xl text-slate-300 font-medium mb-3 animate-fade-in-up">
          Oops! Page not found
        </p>
        <p className="text-sm text-slate-400 mb-10 animate-fade-in-up animation-delay-200">
          The page you're looking for seems to have wandered off into the void
        </p>

        {/* Animated divider */}
        <div className="flex items-center justify-center gap-3 mb-10 animate-fade-in-up animation-delay-400">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary-500 animate-pulse" />
          <Sparkles size={20} className="text-primary-400 animate-spin-slow" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary-500 animate-pulse" />
        </div>

        {/* Back to home button */}
        <Link
          to="/dashboard"
          className="group inline-flex items-center gap-3 px-8 py-4 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(15,111,130,0.5)] active:scale-95 animate-fade-in-up animation-delay-600"
        >
          <ArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform duration-300"
          />
          Take Me Back Home
        </Link>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 0.4;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes ghost-float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(-3deg);
          }
          75% {
            transform: translateY(-5px) rotate(3deg);
          }
        }

        @keyframes text-shimmer {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        @keyframes glitch-1 {
          0%, 100% {
            clip-path: inset(0 0 100% 0);
            transform: translate(0);
          }
          20% {
            clip-path: inset(20% 0 60% 0);
            transform: translate(-3px, 2px);
          }
          40% {
            clip-path: inset(50% 0 30% 0);
            transform: translate(3px, -2px);
          }
          60% {
            clip-path: inset(70% 0 10% 0);
            transform: translate(-2px, 3px);
          }
          80% {
            clip-path: inset(10% 0 80% 0);
            transform: translate(2px, -3px);
          }
        }

        @keyframes glitch-2 {
          0%, 100% {
            clip-path: inset(100% 0 0 0);
            transform: translate(0);
          }
          20% {
            clip-path: inset(60% 0 20% 0);
            transform: translate(3px, -2px);
          }
          40% {
            clip-path: inset(30% 0 50% 0);
            transform: translate(-3px, 2px);
          }
          60% {
            clip-path: inset(10% 0 70% 0);
            transform: translate(2px, -3px);
          }
          80% {
            clip-path: inset(80% 0 5% 0);
            transform: translate(-2px, 3px);
          }
        }

        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-float {
          animation: float ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-ghost-float {
          animation: ghost-float 3s ease-in-out infinite;
        }

        .animate-text-shimmer {
          animation: text-shimmer 3s linear infinite;
        }

        .animate-glitch-1 {
          animation: glitch-1 2s infinite linear alternate-reverse;
        }

        .animate-glitch-2 {
          animation: glitch-2 2.5s infinite linear alternate-reverse;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  )
}
