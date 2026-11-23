import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../../types";
import { PhotoSpot } from "../parts/photo";
import { pageHref } from "../parts/links";

const PAGE_SIZE = 4;

export async function Gallery({ site, locale, query }: TemplateProps) {
  const t = await getTranslations("Luxe");
  const allPhotos = (site.media ?? []).filter((p) => p.place === "gallery");
  if (allPhotos.length === 0) {
    return (
      <section className="tl-section tl-gallery tl-gallery-empty" aria-labelledby="tl-gallery">
        <h2 id="tl-gallery" className="tl-section-title">{t("galleryTitle")}</h2>
        <p className="tl-section-line">{t("galleryLine")}</p>
        <p className="tl-gallery-empty-text">{t("galleryEmpty")}</p>
      </section>
    );
  }

  const page = Math.max(1, Math.min(Math.ceil(allPhotos.length / PAGE_SIZE), Number(query?.page ?? "1") || 1));
  const start = (page - 1) * PAGE_SIZE;
  const pagePhotos = allPhotos.slice(start, start + PAGE_SIZE);
  const totalPages = Math.ceil(allPhotos.length / PAGE_SIZE);

  const baseUrl = pageHref("gallery", locale, site.linkBase);
  const prevPage = page > 1 ? `${baseUrl}?page=${page - 1}` : null;
  const nextPage = page < totalPages ? `${baseUrl}?page=${page + 1}` : null;

  return (
    <section className="tl-section tl-gallery" aria-labelledby="tl-gallery">
      <h2 id="tl-gallery" className="tl-section-title">{t("galleryTitle")}</h2>
      <p className="tl-section-line">{t("galleryLine")}</p>
      <div className="tl-gallery-grid">
        {pagePhotos.map((p) => (
          <a key={p.id} href={p.src ?? p.srcset?.split(" ")[0] ?? ""} className="tl-gallery-item">
            {p.src && (
              <PhotoSpot photo={p} sizes="(min-width: 760px) 33vw, (min-width: 480px) 50vw, 100vw" />
            )}
          </a>
        ))}
      </div>
      <nav className="tl-gallery-pagination" aria-label={t("galleryPagination")}>
        {prevPage && <a href={prevPage} className="tl-gallery-prev">{t("galleryPrev")}</a>}
        <span className="tl-gallery-page">{t("galleryPage", { page, pages: totalPages })}</span>
        {nextPage && <a href={nextPage} className="tl-gallery-next">{t("galleryNext")}</a>}
      </nav>
    </section>
  );
}
