import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface StatsCounterProps {
  value: number
  suffix?: string
  label: string
  delay?: number
}

export default function StatsCounter({ value, suffix = '', label, delay = 0 }: StatsCounterProps) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        const duration = 2000 // 2 seconds
        const steps = 60
        const increment = value / steps
        let current = 0

        const counter = setInterval(() => {
          current += increment
          if (current >= value) {
            setCount(value)
            clearInterval(counter)
          } else {
            setCount(Math.floor(current))
          }
        }, duration / steps)

        return () => clearInterval(counter)
      }, delay * 1000)

      return () => clearTimeout(timer)
    }
  }, [isInView, value, delay])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="text-6xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xl text-white font-medium drop-shadow-md">{label}</div>
    </motion.div>
  )
}