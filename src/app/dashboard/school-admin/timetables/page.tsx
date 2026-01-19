import dynamic from 'next/dynamic'

const TimetablesClient = dynamic(() => import('./client'), { ssr: false })

export default function Page() {
  return <TimetablesClient />
}