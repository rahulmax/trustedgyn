import doctors from '@/data/doctors.json'
import { Directory } from '@/components/directory'
import { type Doctor } from '@/lib/types'

export default function Home() {
  return <Directory doctors={doctors as Doctor[]} />
}
