import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Empacota so o necessario para rodar, sem node_modules: a imagem
  // Docker fica pequena e o start nao depende de instalar dependencias.
  output: 'standalone',
  // Pede compressao gzip nas respostas. O servidor embutido do `next start`
  // ignora esta opcao nesta versao (verificado: nao devolve Content-Encoding),
  // mas ela vale quando a aplicacao roda atras de um proxy que a respeita.
  compress: true,

  images: {
    // Legacy media still served from the WordPress host during migration.
    remotePatterns: [
      { protocol: 'https', hostname: 'lanchascoral.com.br', pathname: '/wp-content/uploads/**' },
      // Fotos dos seminovos, ainda servidas pelo subdominio do broker.
      { protocol: 'https', hostname: 'broker.lanchascoral.com.br', pathname: '/wp-content/uploads/**' },
      // Fotos adicionais das galerias, vindas da versao de referencia.
      { protocol: 'https', hostname: 'mariath.dev', pathname: '/wp-content/uploads/**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  /**
   * Cabecalhos de seguranca.
   * O painel recebe tambem `noindex` e `no-store` — nada dele deve ser
   * indexado por buscadores nem ficar em cache de proxy.
   */
  /*
   * Não anuncia a tecnologia do servidor.
   *
   * `X-Powered-By: Next.js` entrega de graça a pilha e, por tabela, o conjunto
   * de vulnerabilidades conhecidas a testar primeiro. Não é uma proteção por
   * si só — quem procura descobre de outras formas —, mas é informação que
   * não há motivo para oferecer.
   */
  poweredByHeader: false,

  async headers() {
    const base = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    ]

    /*
     * Política de conteúdo do painel.
     *
     * Vale só em `/admin`: é onde estão os dados sensíveis, e onde uma
     * segunda barreira compensa. No site público uma política restritiva
     * quebraria o `next/image` e as fontes do Google sem ganho equivalente.
     *
     * `'unsafe-inline'` em script-src é necessário porque o Next injeta os
     * dados de hidratação em `<script>` inline sem nonce estável. Não torna a
     * política inútil: `form-action 'self'` impede que um script injetado
     * envie um formulário para fora, `connect-src 'self'` barra o envio dos
     * dados roubados, e `frame-ancestors 'none'` fecha o clickjacking.
     *
     * É defesa em profundidade, não a defesa principal — essa é o escape
     * correto na saída (ver `JsonLd.tsx`).
     */
    const cspAdmin = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      // As fotos vêm dos hosts da allowlist do next/image.
      "img-src 'self' data: blob: https://lanchascoral.com.br https://broker.lanchascoral.com.br https://mariath.dev",
      "font-src 'self' data:",
      "connect-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; ')

    return [
      { source: '/:path*', headers: base },
      {
        source: '/admin/:path*',
        headers: [
          ...base,
          { key: 'Content-Security-Policy', value: cspAdmin },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ]
  },
}

export default nextConfig
