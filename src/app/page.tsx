import { getDictionary } from '@/lib/dictionary'
import DictionaryView from '@/components/DictionaryView'

export const dynamic = 'force-static'

export default function HomePage() {
  const dictionary = getDictionary()
  return <DictionaryView dictionary={dictionary} />
}
