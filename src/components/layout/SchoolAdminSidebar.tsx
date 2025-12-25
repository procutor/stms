'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Calendar, Users, BookOpen, Wrench, FileText, Clock, Upload, Home, MapPin, Phone, Mail, Building2, ChevronDown, ChevronUp, User } from 'lucide-react'

interface SchoolAdminSidebarProps {
    className?: string
}

interface School {
    id: string
    name: string
    type: string
    address?: string
    province?: string
    district?: string
    sector?: string
    email: string
    phone?: string
    status: string
    approvedAt?: string
}

export default function SchoolAdminSidebar({ className = '' }: SchoolAdminSidebarProps) {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [schoolInfo, setSchoolInfo] = useState<School | null>(null)
    const [isProfileExpanded, setIsProfileExpanded] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchSchoolInfo = async () => {
            if (session?.user?.schoolId) {
                try {
                    const response = await fetch('/api/schools')
                    if (response.ok) {
                        const schools = await response.json()
                        const currentSchool = schools.find((school: School) => school.id === session.user.schoolId)
                        setSchoolInfo(currentSchool || null)
                    }
                } catch (error) {
                    console.error('Error fetching school info:', error)
                }
            }
            setIsLoading(false)
        }

        fetchSchoolInfo()
    }, [session])

    const navigationItems = [
        {
            href: '/dashboard/school-admin',
            icon: Home,
            label: 'Dashboard',
            isActive: pathname === '/dashboard/school-admin'
        },
        {
            href: '/dashboard/school-admin/add-teacher',
            icon: Users,
            label: 'Add Teacher',
            isActive: pathname === '/dashboard/school-admin/add-teacher'
        },
        {
            href: '/dashboard/school-admin/assignments',
            icon: Users,
            label: 'Teacher Assignments',
            isActive: pathname === '/dashboard/school-admin/assignments'
        },


        {
            href: '/dashboard/school-admin/subjects',
            icon: BookOpen,
            label: 'Add/View Subjects',
            isActive: pathname === '/dashboard/school-admin/subjects'
        },
        {
            href: '/dashboard/school-admin/modules',
            icon: Wrench,
            label: 'Add/View Modules',
            isActive: pathname === '/dashboard/school-admin/modules'
        },
        {
            href: '/dashboard/school-admin/add-classes',
            icon: Users,
            label: 'Add/View Classes',
            isActive: pathname === '/dashboard/school-admin/add-classes'
        },
        {
            href: '/dashboard/school-admin/time-slots',
            icon: Clock,
            label: 'Manage Time Slots',
            isActive: pathname === '/dashboard/school-admin/time-slots'
        },
        {
            href: '/dashboard/school-admin/generate-timetables',
            icon: Calendar,
            label: 'Generate Timetable',
            isActive: pathname === '/dashboard/school-admin/generate-timetables'
        },
        {
            href: '/dashboard/school-admin/bulk-upload',
            icon: Upload,
            label: 'Bulk Upload',
            isActive: pathname === '/dashboard/school-admin/bulk-upload'
        },
        {
            href: '/dashboard/school-admin/daily-timetables',
            icon: Users,
            label: 'Daily Class Timetables',
            isActive: pathname === '/dashboard/school-admin/daily-timetables'
        }
    ]

    return (
        <div className={`fixed top-0 left-0 h-full w-64 bg-blue-900 shadow-lg z-50 overflow-y-auto ${className}`}>
            <div className="p-6">
                <div className="mb-6">
                    <div className="p-2">
                        <h2 className="text-base font-bold text-white">
                            School Admin
                        </h2>
                        {!isLoading && schoolInfo && (
                            <p className="text-sm text-blue-100 mt-1">
                                {schoolInfo.name}
                            </p>
                        )}
                    </div>
                </div>

                <nav className="space-y-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`w-full text-left px-4 py-2 text-white hover:bg-blue-800 hover:bg-opacity-50 rounded-lg flex items-center space-x-2 transition-colors text-base whitespace-nowrap ${
                                    item.isActive ? 'bg-blue-800 bg-opacity-50' : ''
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </div>
    )
}