import dynamicImport from 'next/dynamic'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'edge'

const ClassTimetablesClient = dynamicImport(() => import('./client'), { ssr: false })

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Loading timetable...</div></div>}>
      <ClassTimetablesClient />
    </Suspense>
  )
}