'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageSliderProps {
  images: {
    src: string
    alt: string
    title?: string
    description?: string
  }[]
  autoPlay?: boolean
  autoPlayDelay?: number
}

export default function ImageSlider({ 
  images, 
  autoPlay = true, 
  autoPlayDelay = 5000 
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-play functionality
  if (autoPlay) {
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, autoPlayDelay)
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main Image Container */}
      <div className="relative h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <img
              src={images[currentIndex].src}
              alt={images[currentIndex].alt}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay with text */}
            {(images[currentIndex].title || images[currentIndex].description) && (
              <div className="absolute inset-0 bg-black/40 flex items-end">
                <div className="p-6 text-white">
                  {images[currentIndex].title && (
                    <h3 className="text-2xl font-bold mb-2">{images[currentIndex].title}</h3>
                  )}
                  {images[currentIndex].description && (
                    <p className="text-lg opacity-90">{images[currentIndex].description}</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}