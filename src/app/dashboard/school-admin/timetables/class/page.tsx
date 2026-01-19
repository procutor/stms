import { Suspense } from 'react'
import ClassTimetablesClient from './client'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Loading timetable...</div></div>}>
      <ClassTimetablesClient />
    </Suspense>
  )
}