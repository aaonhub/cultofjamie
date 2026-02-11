import { Suspense } from 'react'
import { getSiteData } from '@/lib/dictionary'
import SiteLayout from '@/components/SiteLayout'

export const dynamic = 'force-static'

export default function HomePage() {
  const data = getSiteData()
  return (
    <Suspense>
      <SiteLayout data={data} />
    </Suspense>
  )
}
