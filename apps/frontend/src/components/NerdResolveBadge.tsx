/**
 * NerdResolve badge.
 *
 * Shared signature mark across every NerdResolve-built site: the glasses logo
 * pinned to the bottom-right of the footer, faint at rest and fully opaque on
 * hover or keyboard focus.
 *
 * No event handlers on purpose - the hover/focus transition is pure CSS so
 * this stays a Server Component. Adding onMouseEnter would force every footer
 * that renders it to become a Client Component (and breaks the Next.js App
 * Router build outright).
 *
 * Positioning: renders a zero-height anchor and pins the badge to the
 * footer's own bottom-right corner using `position: fixed`-like offsets
 * relative to the nearest positioned ancestor. To stay consistent across
 * sites whose footers have different inner padding, the anchor escapes any
 * inner container by being placed as the last child of <footer> and using
 * negative insets that cancel typical footer padding.
 *
 * Drop it as the last child inside <footer>.
 */
type NerdResolveBadgeProps = {
  /** Override if the site serves the asset from a different path. */
  src?: string;
};

const CSS = `
footer:has(.nr-badge-anchor){position:relative}
.nr-badge-anchor{position:static}
.nr-badge{position:absolute;right:1rem;bottom:.75rem;display:inline-flex;
align-items:center;justify-content:center;line-height:0;opacity:.35;z-index:5;
/* 44px de area de toque com a imagem de 28px centrada: a marca continua do
   mesmo tamanho, mas o alvo passa a atender a regra de acessibilidade
   (target-size), que reprovava um alvo de 28px sem folga ao redor. */
min-width:44px;min-height:44px;padding:8px;margin:-8px -8px -4px;
transition:opacity 200ms ease-in-out}
.nr-badge:hover,.nr-badge:focus-visible{opacity:1}
.nr-badge img{width:28px;height:auto;display:block}
@media (prefers-reduced-motion:reduce){.nr-badge{transition:none}}
`;

export default function NerdResolveBadge({
  src = '/nerdresolve-badge.png',
}: NerdResolveBadgeProps) {
  return (
    <div className="nr-badge-anchor">
      {/* Scoped inline so the badge works in any project without touching
          that project's stylesheet or build pipeline. */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <a
        href="https://nerdresolve.com"
        target="_blank"
        rel="noopener noreferrer"
        className="nr-badge"
        aria-label="Site desenvolvido por NerdResolve"
        title="Desenvolvido por NerdResolve"
      >
        <img
          src={src}
          alt="NerdResolve"
          width={28}
          height={9}
          loading="lazy"
          decoding="async"
        />
      </a>
    </div>
  );
}
