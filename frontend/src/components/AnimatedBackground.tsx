import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface PathConfig {
  d: string;
  strokeWidth: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
}

const pathConfigs: PathConfig[] = [
  {
    d: 'M-100,200 C200,100 400,300 600,150 S900,250 1100,180 S1400,100 1600,220',
    strokeWidth: 1.8,
    opacity: 0.5,
    duration: 20,
    delay: 0,
    color: '#94a3b8', // slate-400
  },
  {
    d: 'M-50,350 C150,250 350,450 550,300 S800,400 1050,320 S1300,250 1550,380',
    strokeWidth: 1.5,
    opacity: 0.4,
    duration: 22,
    delay: 1,
    color: '#cbd5e1', // slate-300
  },
  {
    d: 'M-80,500 C120,400 320,550 520,420 S780,530 980,450 S1250,380 1500,500',
    strokeWidth: 2.0,
    opacity: 0.55,
    duration: 18,
    delay: 0.5,
    color: '#64748b', // slate-500
  },
  {
    d: 'M-120,120 C80,220 280,80 480,200 S740,120 980,230 S1200,150 1450,120',
    strokeWidth: 1.5,
    opacity: 0.35,
    duration: 25,
    delay: 2,
    color: '#cbd5e1', // slate-300
  },
  {
    d: 'M-60,650 C140,550 340,700 540,580 S790,670 1040,590 S1290,520 1540,650',
    strokeWidth: 1.8,
    opacity: 0.45,
    duration: 21,
    delay: 1.5,
    color: '#94a3b8', // slate-400
  },
  {
    d: 'M-90,80 C110,180 310,50 510,160 S760,80 1010,170 S1260,100 1510,80',
    strokeWidth: 1.6,
    opacity: 0.4,
    duration: 23,
    delay: 3,
    color: '#94a3b8', // slate-400
  },
  {
    d: 'M-40,450 C160,350 360,500 560,380 S810,470 1060,400 S1310,330 1560,450',
    strokeWidth: 2.0,
    opacity: 0.5,
    duration: 19,
    delay: 0.8,
    color: '#64748b', // slate-500
  },
  {
    d: 'M-110,280 C90,380 290,230 490,340 S740,280 990,360 S1240,290 1490,280',
    strokeWidth: 1.5,
    opacity: 0.35,
    duration: 24,
    delay: 2.5,
    color: '#cbd5e1', // slate-300
  },
  {
    d: 'M-70,580 C130,480 330,620 530,510 S780,600 1030,530 S1280,460 1530,580',
    strokeWidth: 1.7,
    opacity: 0.45,
    duration: 20,
    delay: 1.2,
    color: '#94a3b8', // slate-400
  },
  {
    d: 'M-130,750 C70,650 270,800 470,680 S720,770 970,700 S1220,630 1470,750',
    strokeWidth: 1.5,
    opacity: 0.3,
    duration: 22,
    delay: 3.5,
    color: '#cbd5e1', // slate-300
  },
  {
    d: 'M-50,30 C150,130 350,0 550,110 S800,30 1050,120 S1300,50 1550,30',
    strokeWidth: 1.8,
    opacity: 0.42,
    duration: 21,
    delay: 0.3,
    color: '#64748b', // slate-500
  },
  {
    d: 'M-100,420 C100,320 300,470 500,350 S750,440 1000,370 S1250,300 1500,420',
    strokeWidth: 1.6,
    opacity: 0.38,
    duration: 23,
    delay: 2.2,
    color: '#94a3b8', // slate-400
  },
];

export default function AnimatedBackground() {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slight delay so animation starts smoothly after page load
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-surface-50" />

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {pathConfigs.map((config, index) => (
          <AnimatedPath
            key={index}
            config={config}
            index={index}
            reducedMotion={!!prefersReducedMotion}
          />
        ))}
      </svg>
    </div>
  );
}

function AnimatedPath({
  config,
  index,
  reducedMotion,
}: {
  config: PathConfig;
  index: number;
  reducedMotion: boolean;
}) {
  const pathLength = 2000;

  if (reducedMotion) {
    return (
      <path
        d={config.d}
        fill="none"
        stroke={config.color}
        strokeWidth={config.strokeWidth}
        opacity={config.opacity}
        strokeLinecap="round"
      />
    );
  }

  return (
    <motion.path
      d={config.d}
      fill="none"
      stroke={config.color}
      strokeWidth={config.strokeWidth}
      strokeLinecap="round"
      strokeDasharray={`${pathLength}`}
      initial={{
        strokeDashoffset: pathLength,
        opacity: 0,
      }}
      animate={{
        strokeDashoffset: [pathLength, 0, -pathLength],
        opacity: [0, config.opacity, config.opacity, 0],
      }}
      transition={{
        strokeDashoffset: {
          duration: config.duration,
          delay: config.delay,
          repeat: Infinity,
          ease: 'linear',
        },
        opacity: {
          duration: config.duration,
          delay: config.delay,
          repeat: Infinity,
          times: [0, 0.05, 0.95, 1],
          ease: 'easeInOut',
        },
      }}
      style={{
        filter: index % 3 === 0 ? 'blur(0.5px)' : 'none',
      }}
    />
  );
}
