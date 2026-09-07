/*
 * Conferência das regras de validação do painel.
 *
 * Cada caso corresponde a algo que o operador (ou um POST forjado) pode
 * mandar de verdade. Rodar com:  npx tsx audit/_teste-validacao.mjs
 */
import { boatSchema } from '../src/lib/boat-schema.ts'
import { listingSchema } from '../src/lib/listing-schema.ts'

// `published`/`sold` chegam como boolean: quem converte o checkbox é o
// parseBoatForm/parseListingForm, antes do schema.
const base = { slug: 'coral-36', name: 'Coral 36', published: true, order: '0' }
const bl = { slug: 'x', title: 'X', kind: 'LANCHA', published: true, sold: false, order: '0' }

let falhas = 0
const conf = (cond, texto, extra = '') => {
  if (!cond) falhas++
  console.log(`${cond ? '  ok  ' : ' FALHA'} ${texto}${extra ? '  ' + extra : ''}`)
}

console.log('--- MODELOS ---')
let r = boatSchema.safeParse({ ...base, lengthM: '4,86' })
conf(r.success && r.data.lengthM === 4.86, 'comprimento com vírgula (4,86)', r.success ? `-> ${r.data.lengthM}` : r.error.issues[0].message)

r = boatSchema.safeParse({ ...base, lengthM: '1500' })
conf(!r.success, 'recusa valor acima de Decimal(5,2)', r.success ? 'ACEITOU' : '')

r = boatSchema.safeParse({ ...base, lengthM: '-3' })
conf(!r.success, 'recusa medida negativa')

r = boatSchema.safeParse({ ...base, lengthM: '' })
conf(r.success && r.data.lengthM === undefined, 'campo vazio vira ausente, não zero')

r = boatSchema.safeParse({ ...base, images: [{ url: 'https://evil.example.com/a.jpg' }] })
conf(!r.success, 'recusa foto de host não permitido')

r = boatSchema.safeParse({ ...base, images: [{ url: 'https://lanchascoral.com.br/wp-content/uploads/a.jpg' }] })
conf(r.success, 'aceita foto de host permitido')

r = boatSchema.safeParse({ ...base, images: [{ url: '/brand/foto.jpg' }] })
conf(r.success, 'aceita caminho interno')

r = boatSchema.safeParse({ ...base, heroImage: 'abacaxi' })
conf(!r.success, 'recusa capa que não é endereço')

r = boatSchema.safeParse({ ...base, manualUrl: 'https://lanchascoral.com.br/wp-content/uploads/2021/12/36.pdf' })
conf(r.success && r.data.manualUrl, 'aceita memorial descritivo em PDF')

r = boatSchema.safeParse({ ...base, manualUrl: 'javascript:alert(1)' })
conf(!r.success, 'recusa manualUrl com javascript:')

r = boatSchema.safeParse({ ...base, powerMinHp: '400', powerMaxHp: '300' })
conf(!r.success, 'recusa potência mínima maior que a máxima')

r = boatSchema.safeParse({ ...base, slug: 'new' })
conf(!r.success, 'recusa slug "new" (colidiria com a tela de criação)')

r = boatSchema.safeParse({ ...base, slug: 'Coral 36' })
conf(!r.success, 'recusa slug com espaço e maiúscula')

r = boatSchema.safeParse({ ...base, slug: 'coral-36-cabinada' })
conf(r.success, 'aceita slug bem formado')

console.log('\n--- SEMINOVOS ---')
r = listingSchema.safeParse({ ...bl, engineType: 'Popa' })
conf(r.success, 'aceita motorização da lista')

r = listingSchema.safeParse({ ...bl, engineType: 'popa' })
conf(!r.success, 'recusa variação de caixa (quebraria o filtro)')

r = listingSchema.safeParse({ ...bl, engineType: '' })
conf(r.success && r.data.engineType === undefined, 'motorização em branco é permitida')

r = listingSchema.safeParse({ ...bl, year: '1800' })
conf(!r.success, 'recusa ano fora da faixa')

r = listingSchema.safeParse({ ...bl, year: '2024' })
conf(r.success, 'aceita ano válido')

r = listingSchema.safeParse({ ...bl, priceBrl: '1990000' })
conf(r.success, 'aceita o maior preço do estoque real (R$ 1,99 mi)')

r = listingSchema.safeParse({ ...bl, priceBrl: '999999999999' })
conf(!r.success, 'recusa preço que estouraria a coluna Int')

console.log(falhas === 0 ? '\nTodos os casos passaram.' : `\n${falhas} caso(s) falharam.`)
process.exit(falhas === 0 ? 0 : 1)
