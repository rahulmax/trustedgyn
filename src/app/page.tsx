import { Directory } from '@/components/directory'
import { getDirectoryDoctors } from '@/lib/utils'

export default function Home() {
  return <Directory doctors={getDirectoryDoctors()} />
}
