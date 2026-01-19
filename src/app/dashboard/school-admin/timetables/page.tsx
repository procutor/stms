import { Suspense } from 'react'
import TimetablesClient from './client'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Loading timetable...</div></div>}>
      <TimetablesClient />
    </Suspense>
  )
}