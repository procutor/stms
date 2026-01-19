import dynamic from 'next/dynamic'

const ClassTimetablesClient = dynamic(() => import('./client'), { ssr: false })

export default function Page() {
  return <ClassTimetablesClient />
}