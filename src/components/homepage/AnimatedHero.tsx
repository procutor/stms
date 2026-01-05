import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, Clock, Users, Zap, UserPlus, LogIn } from 'lucide-react'
import ImageSlider from './ImageSlider'

export default function AnimatedHero() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/slider-image-1.jpg.jpg')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/90 via-blue-50/90 to-purple-50/90" />
      </div>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-16 h-16 bg-purple-200/30 rounded-full"
          animate={{
            y: [0, 20, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-12 h-12 bg-pink-200/30 rounded-full"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-40 right-10 w-24 h-24 bg-indigo-200/30 rounded-full"
          animate={{
            x: [0, -10, 0],
            y: [0, 10, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-blue-800 font-semibold mb-8"
            >
              <Zap className="w-5 h-5 mr-2" />
              Trusted by 500+ Schools Worldwide
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight"
            >
              Stop Wasting{' '}
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                20+ Hours
              </span>{' '}
              on Manual Timetables
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl text-gray-600 mb-8 max-w-2xl leading-relaxed"
            >
              Automate your school's scheduling with AI-powered timetabling that eliminates conflicts,
              saves time, and lets you focus on what matters most - teaching.
            </motion.p>



            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start mb-8"
            >
              <Link
                href="/auth/signup"
                className="group text-white px-10 py-5 rounded-2xl hover:opacity-90 transition-all duration-300 font-bold text-xl shadow-2xl transform hover:-translate-y-2 hover:scale-105"
                style={{backgroundColor: '#001D40'}}
              >
                <span className="flex items-center">
                  <UserPlus className="w-6 h-6 mr-3" />
                  Register
                </span>
              </Link>

              <Link
                href="/auth/signin"
                className="group bg-gradient-to-r from-orange-400 to-orange-600 text-white px-10 py-5 rounded-2xl hover:from-orange-500 hover:to-orange-700 transition-all duration-300 font-bold text-xl shadow-lg hover:shadow-orange-500/25 transform hover:-translate-y-1 hover:scale-105"
              >
                <span className="flex items-center">
                  <LogIn className="w-6 h-6 mr-3" />
                  Login
                </span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex flex-wrap justify-center lg:justify-start gap-8 text-sm text-gray-500 font-medium"
            >
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-green-500 mr-2" />
                Setup in 10 minutes
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 text-blue-500 mr-2" />
                100% Free
              </div>
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-purple-500 mr-2" />
                No credit card required
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Slider at page edge */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative flex items-center justify-end"
          >
            <div className="w-full max-w-md">
              <ImageSlider 
                images={[
                  { 
                    src: '/slider-image-1.jpg.jpg', 
                    alt: 'Feature 1',
                    title: '',
                    description: 'See how our AI creates perfect timetables in seconds'
                  },
                  { 
                    src: '/slider-image-2.jpg.png', 
                    alt: 'Feature 2',
                    title: '',
                    description: 'Automatically detects and resolves scheduling conflicts'
                  },
                  { 
                    src: '/slider-image-3.jpg.jpg', 
                    alt: 'Feature 3',
                    title: '',
                    description: 'Access your schedules anywhere, anytime'
                  }
                ]}
                autoPlayDelay={4000}
              />
            </div>
          </motion.div>


        </div>
      </div>
    </section>
  )
}