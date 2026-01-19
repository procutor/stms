import dynamic from 'next/dynamic'

const TeacherTimetablesClient = dynamic(() => import('./client'), { ssr: false })

export default function Page() {
  return <TeacherTimetablesClient />
}