'use client'

import { motion, AnimatePresence } from 'framer-motion'

export type AiRobotState = 'idle' | 'thinking' | 'building'

interface AiRobotMascotProps {
  state?: AiRobotState
  size?: number
}

export function AiRobotMascot({ state = 'idle', size = 64 }: AiRobotMascotProps) {
  const isThinking = state === 'thinking'
  const isBuilding = state === 'building'

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={isBuilding ? { y: [0, 1, 0] } : { y: [0, -3, 0] }}
      transition={{
        duration: isBuilding ? 0.28 : 2.4,
        repeat: Infinity,
        ease: isBuilding ? 'linear' : 'easeInOut',
      }}
      className="overflow-visible"
    >
      <AnimatePresence mode="wait">
        {isThinking && (
          <motion.g
            key="thinking-bubble"
            initial={{ opacity: 0, y: 6, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.7 }}
            transition={{ duration: 0.25 }}
          >
            <circle cx="60" cy="14" r="11" fill="#202024" stroke="#D9A86C" strokeWidth="2" />
            <text
              x="60"
              y="19"
              textAnchor="middle"
              fill="#F2C27F"
              fontSize="14"
              fontWeight="700"
              fontFamily="sans-serif"
            >
              ?
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      <motion.line
        x1="60"
        y1="28"
        x2="60"
        y2="16"
        stroke="#B8B1A7"
        strokeWidth="3"
        strokeLinecap="round"
        animate={isBuilding ? { stroke: '#F2C27F' } : { stroke: '#B8B1A7' }}
      />
      <motion.circle
        cx="60"
        cy="14"
        r="4"
        fill="#D9A86C"
        animate={isBuilding ? { scale: [1, 1.4, 1], fill: ['#D9A86C', '#F2C27F', '#D9A86C'] } : { scale: 1 }}
        transition={{ duration: 0.56, repeat: Infinity }}
      />

      <motion.rect
        x="34"
        y="28"
        width="52"
        height="40"
        rx="14"
        fill="#202024"
        stroke={isBuilding ? '#F2C27F' : '#D9A86C'}
        strokeWidth="2.5"
        animate={{
          stroke: isBuilding ? ['#F2C27F', '#D9A86C', '#F2C27F'] : isThinking ? ['#D9A86C', '#F2C27F', '#D9A86C'] : '#D9A86C',
        }}
        transition={{ duration: isBuilding ? 0.56 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.circle
        cx="49"
        cy="48"
        r="5.5"
        fill={isThinking ? '#F2C27F' : '#F5F1EA'}
        animate={isThinking ? { scaleY: [1, 1.15, 1] } : { scaleY: [1, 0.1, 1] }}
        transition={isThinking ? { duration: 1.2, repeat: Infinity } : { duration: 3.2, repeat: Infinity, repeatDelay: 1.6 }}
      />
      <motion.circle
        cx="71"
        cy="48"
        r="5.5"
        fill={isThinking ? '#F2C27F' : '#F5F1EA'}
        animate={isThinking ? { scaleY: [1, 1.15, 1] } : { scaleY: [1, 0.1, 1] }}
        transition={isThinking ? { duration: 1.2, repeat: Infinity } : { duration: 3.2, repeat: Infinity, repeatDelay: 1.6 }}
      />

      <motion.path
        d={isBuilding ? 'M 52 60 Q 60 64 68 60' : 'M 52 62 Q 60 66 68 62'}
        stroke="#F5F1EA"
        strokeWidth="2"
        strokeLinecap="round"
        fill="transparent"
        animate={isBuilding ? { d: ['M 52 60 Q 60 64 68 60', 'M 52 58 Q 60 62 68 58', 'M 52 60 Q 60 64 68 60'] } : {}}
        transition={{ duration: 0.56, repeat: Infinity }}
      />

      <rect x="40" y="68" width="40" height="34" rx="10" fill="#202024" stroke="#B8B1A7" strokeWidth="2" />
      <motion.circle
        cx="60"
        cy="85"
        r="5"
        fill="#D9A86C"
        animate={isBuilding ? { fill: ['#D9A86C', '#F2C27F', '#D9A86C'], scale: [1, 1.25, 1] } : { fill: '#D9A86C', scale: 1 }}
        transition={{ duration: 0.56, repeat: Infinity }}
      />

      <path
        d="M 40 78 Q 28 86 30 98"
        stroke="#B8B1A7"
        strokeWidth="4"
        strokeLinecap="round"
        fill="transparent"
      />
      <circle cx="30" cy="100" r="4.5" fill="#D9A86C" />

      <motion.g
        animate={
          isBuilding
            ? { rotate: [-18, 34, -18], x: [0, 1, 0] }
            : isThinking
            ? { rotate: [-6, 6, -6] }
            : { rotate: 0 }
        }
        transition={
          isBuilding
            ? { duration: 0.56, repeat: Infinity, ease: 'easeInOut' }
            : isThinking
            ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.4 }
        }
        style={{ originX: '80px', originY: '78px' }}
      >
        <path d="M 80 78 Q 92 86 96 74" stroke="#B8B1A7" strokeWidth="4" strokeLinecap="round" fill="transparent" />
        <circle cx="96" cy="72" r="4.5" fill="#D9A86C" />
        <rect x="93" y="52" width="6" height="28" rx="2" fill="#8C7F70" transform="rotate(-12 96 72)" />
        <rect x="84" y="46" width="24" height="10" rx="2" fill="#D9A86C" transform="rotate(-12 96 72)" />
      </motion.g>

      <motion.g
        animate={isBuilding ? { x: [0, -1, 0], y: [0, 1, 0] } : { x: 0, y: 0 }}
        transition={{ duration: 0.56, repeat: Infinity }}
      >
        <rect x="24" y="86" width="4" height="26" rx="1" fill="#B8B1A7" transform="rotate(14 26 99)" />
        <path d="M 22 109 L 30 109 L 26 118 Z" fill="#D9A86C" />
      </motion.g>

      <AnimatePresence>
        {isBuilding && (
          <motion.g
            key="sparks"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.56, repeat: Infinity }}
          >
            <circle cx="24" cy="108" r="2" fill="#F2C27F" />
            <circle cx="18" cy="104" r="1.5" fill="#F2C27F" />
            <circle cx="30" cy="102" r="1.5" fill="#F2C27F" />
          </motion.g>
        )}
      </AnimatePresence>
    </motion.svg>
  )
}
