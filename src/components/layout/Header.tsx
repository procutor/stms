'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-orange-50 shadow-2xl sticky top-0 z-50 backdrop-blur-lg border-b border-orange-200">
      <div className="flex items-center justify-between py-6 px-6 sm:px-8 lg:px-12">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center group">
            <span className="text-2xl md:text-3xl font-black bg-gradient-to-r from-gray-900 via-blue-900 to-emerald-900 bg-clip-text text-transparent tracking-tight">
              AI School Timetable Management System STMS
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-gray-700 hover:text-emerald-600 transition-all duration-300 font-medium tracking-wide hover:scale-105 transform">
            Home
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-purple-600 transition-all duration-300 font-medium tracking-wide hover:scale-105 transform">
            About
          </Link>
          <Link href="/contact" className="text-gray-700 hover:text-orange-600 transition-all duration-300 font-medium tracking-wide hover:scale-105 transform">
            Contact Us
          </Link>
          <Link href="/auth/signin" className="text-gray-700 hover:text-primary-600 transition-all duration-300 font-semibold tracking-wide hover:scale-105 transform">
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="bg-orange-600 text-white px-8 py-3 rounded-xl hover:bg-orange-700 transition-all duration-300 font-bold tracking-wide shadow-lg hover:shadow-orange-500/25 hover:scale-105 transform"
          >
            Get Started
          </Link>
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-700 hover:text-orange-600 transition-colors duration-300 p-2 rounded-lg hover:bg-orange-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden px-6 sm:px-8 lg:px-12 pb-6">
          <div className="flex flex-col space-y-4 bg-orange-100/50 backdrop-blur-sm rounded-xl p-6 border border-orange-200">
            <Link href="/" className="text-gray-700 hover:text-emerald-600 transition-all duration-300 font-medium tracking-wide">
              Home
            </Link>
            <Link href="#benefits" className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium tracking-wide">
              Benefits
            </Link>
            <Link href="#about" className="text-gray-700 hover:text-purple-600 transition-all duration-300 font-medium tracking-wide">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-orange-600 transition-all duration-300 font-medium tracking-wide">
              Contact Us
            </Link>
            <Link href="/auth/signin" className="text-gray-700 hover:text-primary-600 transition-all duration-300 font-semibold tracking-wide">
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-orange-600 text-white px-8 py-3 rounded-xl hover:bg-orange-700 transition-all duration-300 font-bold tracking-wide text-center shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}