import { Montserrat, JetBrains_Mono } from 'next/font/google'
import JsonLd from '@/components/JsonLd'
import { organizationSchema, websiteSchema } from '@/lib/schema'
import { getTelefonesPublicados } from '@/lib/contatos'
import './globals.css'

/**
 * Casca comum dos dois layouts raiz.
 *
 * O site tem DOIS root layouts, um por idioma (`(pt)` e `(en)`), para que cada
 * árvore sirva o seu próprio `<html lang>` já no HTML inicial. Antes havia um
 * único layout fixo em `pt-BR` e um script que corrigia o atributo depois da
 * hidratação: o visitante via o valor certo, mas o buscador e o leitor de tela
 * liam o documento servido, com o idioma errado.
 *
 * Tudo o que não depende do idioma vive aqui para não divergir entre os dois.
 */

// Apenas `latin`: `latin-ext` acrescenta glifos do leste europeu que o site
// (português e inglês) nunca usa, e cada peso vira um arquivo a mais.
// O peso 300 foi retirado por não aparecer em nenhuma classe do projeto.
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const fontVars = `${montserrat.variable} ${jetbrains.variable}`

export async function Shell({ lang, children }: { lang: 'pt-BR' | 'en'; children: React.ReactNode }) {
  /* Telefones do banco para o JSON-LD da organização. É uma consulta por
     renderização de layout, mas as páginas do site são estáticas ou
     revalidadas: na prática ela roda no build e a cada revalidação, não a
     cada visita. */
  const telefones = await getTelefonesPublicados()
  return (
    // `suppressHydrationWarning`: o script abaixo tira a classe `no-js` antes
    // da hidratação, então o className que o React encontra no cliente difere
    // do que veio do servidor — divergência intencional, não um bug.
    <html lang={lang} className={`no-js ${fontVars}`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        {/* Remove `no-js` antes da pintura: com JS as animações de entrada
            assumem; sem JS o CSS mantém tudo visível. Fica DENTRO do <body>
            porque <script> filho direto de <html> é HTML inválido. Como é o
            primeiro nó do corpo, roda antes de qualquer conteúdo pintar. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.remove('no-js')`,
          }}
        />
        {/* Identidade do estaleiro e do site: base do Knowledge Panel. */}
        <JsonLd data={[organizationSchema(telefones), websiteSchema()]} />
        {children}
      </body>
    </html>
  )
}
