import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'


const steps = [
  {
    id: 1,
    title: "Quick Setup",
    description: "Enter your school details, teachers, subjects, and class information in our intuitive interface.",
    time: "2 minutes",
    color: "from-blue-500 to-blue-600"
  },
  {
    id: 2,
    title: "AI Generation",
    description: "Our intelligent algorithm analyzes constraints and creates conflict-free schedules automatically.",
    time: "30 seconds",
    color: "from-purple-500 to-purple-600"
  },
  {
    id: 3,
    title: "Review & Adjust",
    description: "Preview your timetable, make any necessary adjustments, and publish with confidence.",
    time: "5 minutes",
    color: "from-green-500 to-green-600"
  },
  {
    id: 4,
    title: "Go Live",
    description: "Share the schedule with teachers, students, and parents instantly. Updates happen in real-time.",
    time: "1 minute",
    color: "from-orange-500 to-orange-600"
  }
]

export default function ProcessTimeline() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get your perfect school timetable in just 10 minutes with our streamlined process.
          </p>
        </motion.div>

        {/* 2x2 Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => {


            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="h-full"
              >
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 h-full">
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`w-6 h-6 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center text-white font-bold text-xs`}>
                        {step.id}
                      </span>
                      <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                    </div>
                    <div className="text-sm text-blue-600 font-medium">{step.time}</div>
                  </div>

                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-full text-green-800 font-semibold mb-6">
            <CheckCircle className="w-5 h-5 mr-2" />
            Total Time: 10 Minutes
          </div>
          <p className="text-lg text-gray-600 mb-8">
            Ready to transform your school's scheduling? Start your free trial today.
          </p>
        </motion.div>
      </div>
    </section>
  )
}