import dynamicImport from 'next/dynamic'

// Force dynamic rendering at the route level
export const dynamic = 'force-dynamic'
// Disable static generation
export const revalidate = 0

const TimetablesClient = dynamicImport(() => import('./client'), { ssr: false })

export default function Page() {
  return <TimetablesClient />
}