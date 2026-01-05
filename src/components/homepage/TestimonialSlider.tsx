import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

interface Testimonial {
  id: number
  name: string
  role: string
  school: string
  content: string
  avatar?: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "School Principal",
    school: "Greenwood Academy",
    content: "SchoolTimetable Pro transformed our scheduling process. What used to take our admin team 3 days now happens in minutes. Our teachers have more time for what matters - teaching.",
    rating: 5
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Director of Studies",
    school: "Riverside High School",
    content: "The conflict detection is incredible. We eliminated all scheduling conflicts and reduced student stress. Parents are happier, teachers are happier - everyone wins.",
    rating: 5
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    role: "Head Teacher",
    school: "Lincoln Elementary",
    content: "As a teacher, I was skeptical about automated scheduling. But this system respects our preferences while ensuring fairness. It's a game-changer for work-life balance.",
    rating: 5
  },
  {
    id: 4,
    name: "David Thompson",
    role: "School Administrator",
    school: "Oakwood College",
    content: "The ROI was immediate. We saved over $50,000 in administrative costs in the first year alone. Plus, our timetable accuracy improved from 85% to 100%.",
    rating: 5
  }
]

export default function TestimonialSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [isAutoPlaying])

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    setIsAutoPlaying(false)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    setIsAutoPlaying(false)
  }

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Trusted by Educators Worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See what school leaders, teachers, and administrators say about transforming their scheduling process.
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main testimonial */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {testimonials[currentIndex].name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <Quote className="w-12 h-12 text-blue-200 mb-4 mx-auto md:mx-0" />

                <blockquote className="text-xl md:text-2xl text-gray-700 italic leading-relaxed mb-6">
                  "{testimonials[currentIndex].content}"
                </blockquote>

                <div className="flex items-center justify-center md:justify-start space-x-1 mb-4">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <div>
                  <div className="font-bold text-gray-900 text-lg">{testimonials[currentIndex].name}</div>
                  <div className="text-blue-600 font-medium">{testimonials[currentIndex].role}</div>
                  <div className="text-gray-600">{testimonials[currentIndex].school}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation arrows */}
          <button
            onClick={prevTestimonial}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-xl rounded-full shadow-lg border border-white/20 flex items-center justify-center hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <button
            onClick={nextTestimonial}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-xl rounded-full shadow-lg border border-white/20 flex items-center justify-center hover:bg-white transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>

          {/* Dots indicator */}
          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}