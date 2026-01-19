import dynamicImport from 'next/dynamic'

// Add this line to force dynamic rendering
export const dynamic = 'force-dynamic'

const TimetablesClient = dynamicImport(() => import('./client'), { ssr: false })

export default function Page() {
  return <TimetablesClient />
}