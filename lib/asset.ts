/** Public-folder paths with the deploy base path in front (GitHub Pages serves from /repo-name). */
export const asset = (p: string) => (p.startsWith('/') ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${p}` : p);
