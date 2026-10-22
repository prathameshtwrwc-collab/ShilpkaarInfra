/**
 * Showcase mode: the site is deployed without a database. Public pages are
 * served from bundled content; quote submission and the admin are switched off
 * and say so. Connecting DATABASE_URL enables everything with no code change.
 */
export const hasDatabase = Boolean(process.env.DATABASE_URL);
