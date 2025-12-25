'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 shadow-2xl sticky top-0 z-50 backdrop-blur-lg border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center py-6">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-4 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-emerald-500/25">
                  <span className="text-white font-black text-lg tracking-wider">STMS</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 blur-sm"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent tracking-tight">
                  AI School Timetable
                </span>
                <span className="text-lg md:text-xl font-semibold bg-gradient-to-r from-emerald-200 via-blue-200 to-purple-200 bg-clip-text text-transparent tracking-wider">
                  Management System
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-slate-300 hover:text-emerald-400 transition-all duration-300 font-medium tracking-wide hover:scale-105 transform">
              Home
            </Link>
            <Link href="#benefits" className="text-slate-300 hover:text-blue-400 transition-all duration-300 font-medium tracking-wide hover:scale-105 transform">
              Benefits
            </Link>
            <Link href="#about" className="text-slate-300 hover:text-purple-400 transition-all duration-300 font-medium tracking-wide hover:scale-105 transform">
              About
            </Link>
            <Link href="/contact" className="text-slate-300 hover:text-orange-400 transition-all duration-300 font-medium tracking-wide hover:scale-105 transform">
              Contact Us
            </Link>
            <Link href="/auth/signin" className="text-slate-300 hover:text-white transition-all duration-300 font-semibold tracking-wide hover:scale-105 transform">
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-emerald-600 hover:to-blue-700 transition-all duration-300 font-bold tracking-wide shadow-lg hover:shadow-emerald-500/25 hover:scale-105 transform"
            >
              Get Started
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-300 hover:text-white transition-colors duration-300 p-2 rounded-lg hover:bg-white/10"
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
          <div className="md:hidden pb-6">
            <div className="flex flex-col space-y-4 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <Link href="/" className="text-slate-300 hover:text-emerald-400 transition-all duration-300 font-medium tracking-wide">
                Home
              </Link>
              <Link href="#benefits" className="text-slate-300 hover:text-blue-400 transition-all duration-300 font-medium tracking-wide">
                Benefits
              </Link>
              <Link href="#about" className="text-slate-300 hover:text-purple-400 transition-all duration-300 font-medium tracking-wide">
                About
              </Link>
              <Link href="/contact" className="text-slate-300 hover:text-orange-400 transition-all duration-300 font-medium tracking-wide">
                Contact Us
              </Link>
              <Link href="/auth/signin" className="text-slate-300 hover:text-white transition-all duration-300 font-semibold tracking-wide">
                Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-emerald-600 hover:to-blue-700 transition-all duration-300 font-bold tracking-wide text-center shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}