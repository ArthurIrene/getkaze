/** vitest mock for next-intl/navigation (avoids next/navigation in jsdom). */

export function createNavigation() {
  return {
    Link: "a",
    redirect: () => {
      throw new Error("redirect");
    },
    permanentRedirect: () => {
      throw new Error("permanentRedirect");
    },
    notFound: () => {
      throw new Error("notFound");
    },
    unstable_rewrite: () => {},
    usePathname: () => "",
    useRouter: () => ({}),
    useParams: () => ({}),
    useSearchParams: () => new URLSearchParams(),
    getPathname: () => "",
  };
}

export const router = {};
export const usePathname = () => "";
export const useRouter = () => ({});
export const useParams = () => ({});
export const useSearchParams = () => new URLSearchParams();
export const redirect = () => {
  throw new Error("redirect");
};
export const permanentRedirect = () => {
  throw new Error("permanentRedirect");
};
export const notFound = () => {
  throw new Error("notFound");
};
export const unstable_rewrite = () => {};
