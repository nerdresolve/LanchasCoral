import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/* `.mts` para o Vite carregar como ESM: com `.ts` ele avisa que o arquivo usa
   sintaxe de módulo num contexto CommonJS. Como não há `__dirname` em ESM,
   ele é derivado da própria URL do arquivo. */
const AQUI = path.dirname(fileURLToPath(import.meta.url))

/**
 * Testes unitários da lógica pura.
 *
 * Cobre o que dá para verificar sem subir o site: regras de validação,
 * cifragem, política de retenção, montagem de e-mail. Rodam em segundos e
 * servem de rede antes do `build` — os testes de ponta a ponta em `audit/`
 * continuam existindo para o que só se prova contra o site no ar.
 *
 * `environment: 'node'` porque nada aqui toca no DOM; um ambiente de
 * navegador só deixaria a suíte mais lenta.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    /* Os scripts de `audit/` falam com produção e levam minutos — não são
       testes unitários e não devem rodar aqui. */
    exclude: ['node_modules/**', 'audit/**', '.next/**'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/prisma.ts', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(AQUI, 'src'),
      /* `server-only` lança ao ser importado fora de um Server Component.
         Nos testes de Node isso barraria todo módulo do servidor, então
         aponta para um arquivo vazio — a proteção real continua valendo no
         build do Next. */
      'server-only': path.resolve(AQUI, 'test/_vazio.ts'),
    },
  },
})
