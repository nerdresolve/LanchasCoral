import type { Metadata } from 'next'
import HomeView from '@/views/home'
import SiteFooter from '@/components/SiteFooter'
import { alternatesEn } from '@/lib/alternates'

export const metadata: Metadata = {
  // Sem estes campos a pagina caia no template do layout raiz e servia
  // titulo e descricao EM PORTUGUES numa pagina inglesa.
  title: { absolute: 'Coral Boats | Brazilian boatbuilder since 1990' },
  description:
    'We build motor boats from 16 to 50 feet in Duque de Caxias, Rio de Janeiro. Over 3,000 boats delivered, Wood Free monocoque hulls and a 10-year structural warranty.',
  alternates: alternatesEn('/', '/en'),
}

export default function Page() {
  return (
    <>
      <HomeView locale="en" />
      <SiteFooter locale="en" />
    </>
  )
}
