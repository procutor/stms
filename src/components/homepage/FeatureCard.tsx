import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon?: LucideIcon | null
  title: string
  description: string
  problem: string
  solution: string
  delay?: number
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  problem,
  solution,
  delay = 0
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 h-full">
        {/* Icon */}
        {Icon && (
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-8 h-8 text-blue-600" />
          </div>
        )}

        {/* Content */}
        <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        <p className="text-gray-600 mb-6 leading-relaxed">
          {description}
        </p>

        {/* Additional Benefits */}
        {(problem || solution) && (
          <div className="space-y-4">
            {problem && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-sm font-semibold text-red-800 mb-1">The Problem</div>
                    <div className="text-sm text-red-700">{problem}</div>
                  </div>
                </div>
              </div>
            )}

            {solution && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-sm font-semibold text-green-800 mb-1">Our Solution</div>
                    <div className="text-sm text-green-700">{solution}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
    </motion.div>
  )
}