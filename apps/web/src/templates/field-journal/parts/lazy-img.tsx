/**
 * A photo below the first view (specs/demo-photos.md). Chrome fetches
 * loading="lazy" images up to ~1250 px below the screen, which would put
 * every photo near the top into the first view. These images carry their
 * URLs in data-src/data-srcset; a tiny inline loader (LAZY_SCRIPT, ~0.4 KB)
 * sets them once a quarter of the photo is on screen (scrolled or swiped to); a peek at the edge of the first view does not count. Without JavaScript the
 * <noscript> copy shows (native lazy loading).
 */
export function LazyImg({ src, srcset, sizes, alt, className }: { src: string; srcset?: string; sizes?: string; alt: string; className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- plain img: no Vercel image optimizer (D-035) */}
      <img data-src={src} data-srcset={srcset} sizes={srcset ? sizes : undefined} alt={alt} loading="lazy" decoding="async" className={className} />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- plain img: no Vercel image optimizer (D-035) */}
        <img src={src} srcSet={srcset} sizes={srcset ? sizes : undefined} alt={alt} loading="lazy" decoding="async" className={className} />
      </noscript>
    </>
  );
}

/** Sets src/srcset of img[data-src] once a quarter of the photo is on screen (inline, once per page). */
export const LAZY_SCRIPT =
  '(()=>{const q=document.querySelectorAll("img[data-src]"),l=e=>{if(e.dataset.srcset)e.srcset=e.dataset.srcset;e.src=e.dataset.src;e.removeAttribute("data-src")};' +
  'if(!("IntersectionObserver"in window))return q.forEach(l);const o=new IntersectionObserver(s=>s.forEach(x=>{if(x.isIntersecting){l(x.target);o.unobserve(x.target)}}),{threshold:0.25});q.forEach(e=>o.observe(e))})()';
