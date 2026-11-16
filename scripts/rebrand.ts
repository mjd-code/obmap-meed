/**
 * Safe Automated Rebranding CLI Tool (ADR-0013 / BRAND-STEP-01).
 *
 * Usage:
 *   bun run rebrand -- --name "Sidra" --slug "sidra" --domain "sidra.app" [--tagline "..."] [--invite-prefix "SIDRA"] [--dry-run]
 *
 * Updates the central brand manifest (`src/global/config/brand.config.ts`),
 * fallback HTML metadata (`index.html`), and optional `package.json` metadata
 * while enforcing a strict Protected Path Denylist.
 */

export interface RebrandCliOptions {
  name: string;
  shortName: string;
  slug: string;
  domain: string;
  tagline?: string;
  description?: string;
  invitePrefix: string;
  dryRun: boolean;
}

const PROTECTED_PATH_PREFIXES = [
  'supabase/migrations/',
  'docs/00-meta/00-1-quovadis.md',
  'docs/changelogs/archive-',
  'docs/_machine/changelog.jsonl',
  'src/global/utils/storageKeyMigrator.ts',
];

/**
 * Guards historical migrations, archives, and backward-compatible legacy storage keys
 * from blind rebranding mutations (ADR-0013 §2.4).
 */
export function isProtectedRebrandPath(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, '/').replace(/^\.\//, '');
  return PROTECTED_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function sanitizeSlug(raw: string): string {
  return (
    raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'app'
  );
}

export function parseRebrandArgs(argv: string[]): RebrandCliOptions {
  const map = new Map<string, string>();
  let dryRun = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx > 2) {
        map.set(arg.slice(2, eqIdx), arg.slice(eqIdx + 1));
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        map.set(arg.slice(2), argv[i + 1]);
        i += 1;
      }
    }
  }

  const name = (map.get('name') ?? '').trim();
  if (!name) {
    throw new Error(
      'Missing required --name argument. Example: bun run rebrand -- --name "Sidra" --slug "sidra" --domain "sidra.app" --dry-run',
    );
  }

  const slug = sanitizeSlug(map.get('slug') ?? name);
  const shortName = (map.get('short-name') ?? name).trim();
  const domain = (map.get('domain') ?? `${slug}.app`).trim();
  const invitePrefix = (
    map.get('invite-prefix') ?? slug.replace(/[^a-z0-9]/gi, '').toUpperCase()
  ).trim();

  return {
    name,
    shortName,
    slug,
    domain,
    tagline: map.get('tagline')?.trim(),
    description: map.get('description')?.trim(),
    invitePrefix,
    dryRun,
  };
}

function escapeSingleQuoted(val: string): string {
  return val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Updates `DEFAULT_BRAND_MANIFEST` fields inside `src/global/config/brand.config.ts`
 * without altering runtime hooks, store logic, or env overrides.
 */
export function buildUpdatedBrandConfigSource(
  source: string,
  opts: RebrandCliOptions,
): string {
  const origin = opts.domain.startsWith('http') ? opts.domain : `https://${opts.domain}`;
  const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

  let next = source
    .replace(/id:\s*'[^']*'/, `id: '${escapeSingleQuoted(opts.slug)}'`)
    .replace(/name:\s*'[^']*'/, `name: '${escapeSingleQuoted(opts.name)}'`)
    .replace(/shortName:\s*'[^']*'/, `shortName: '${escapeSingleQuoted(opts.shortName)}'`)
    .replace(/slug:\s*'[^']*'/, `slug: '${escapeSingleQuoted(opts.slug)}'`)
    .replace(/domain:\s*'[^']*'/, `domain: '${escapeSingleQuoted(opts.domain)}'`)
    .replace(/canonicalOrigin:\s*'[^']*'/, `canonicalOrigin: '${escapeSingleQuoted(cleanOrigin)}'`)
    .replace(/sdkPackageName:\s*'[^']*'/, `sdkPackageName: '@${escapeSingleQuoted(opts.slug)}/sdk'`)
    .replace(/inviteCodePrefix:\s*'[^']*'/, `inviteCodePrefix: '${escapeSingleQuoted(opts.invitePrefix)}'`);

  if (opts.tagline) {
    next = next.replace(/tagline:\s*'[^']*'/, `tagline: '${escapeSingleQuoted(opts.tagline)}'`);
  }
  if (opts.description) {
    next = next.replace(
      /description:\s*\n?\s*'[^']*'/,
      `description:\n    '${escapeSingleQuoted(opts.description)}'`,
    );
  }
  return next;
}

export function buildUpdatedIndexHtml(html: string, opts: RebrandCliOptions): string {
  const origin = opts.domain.startsWith('http') ? opts.domain : `https://${opts.domain}`;
  const cleanOrigin = `${origin.endsWith('/') ? origin.slice(0, -1) : origin}/`;
  const tagline = opts.tagline ?? 'Knowledge Graph & Living Workspace';
  const fullTitle = `${opts.name} - ${tagline}`;

  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${fullTitle}</title>`)
    .replace(/<meta name="title" content="[^"]*" \/>/, `<meta name="title" content="${fullTitle}" />`)
    .replace(/<meta name="author" content="[^"]*" \/>/, `<meta name="author" content="${opts.name}" />`)
    .replace(/<meta name="apple-mobile-web-app-title" content="[^"]*" \/>/, `<meta name="apple-mobile-web-app-title" content="${opts.shortName}" />`)
    .replace(/<meta name="application-name" content="[^"]*" \/>/, `<meta name="application-name" content="${opts.shortName}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${cleanOrigin}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${fullTitle}" />`)
    .replace(/<meta property="og:site_name" content="[^"]*" \/>/, `<meta property="og:site_name" content="${opts.name}" />`)
    .replace(/<meta name="twitter:url" content="[^"]*" \/>/, `<meta name="twitter:url" content="${cleanOrigin}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${fullTitle}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${cleanOrigin}" />`);
}

export async function runRebrandCli(argv: string[] = process.argv.slice(2)): Promise<void> {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const opts = parseRebrandArgs(argv);
  const root = process.cwd();
  const targets = [
    {
      relPath: 'src/global/config/brand.config.ts',
      transform: (raw: string) => buildUpdatedBrandConfigSource(raw, opts),
    },
    {
      relPath: 'index.html',
      transform: (raw: string) => buildUpdatedIndexHtml(raw, opts),
    },
  ];

  const changed: string[] = [];

  for (const target of targets) {
    if (isProtectedRebrandPath(target.relPath)) {
      throw new Error(`Refusing to mutate protected path: ${target.relPath}`);
    }
    const abs = path.resolve(root, target.relPath);
    if (!fs.existsSync(abs)) continue;
    const before = fs.readFileSync(abs, 'utf8');
    const after = target.transform(before);
    if (before !== after) {
      changed.push(target.relPath);
      if (!opts.dryRun) {
        fs.writeFileSync(abs, after, 'utf8');
      }
    }
  }

  console.log(`[rebrand] Mode: ${opts.dryRun ? 'DRY RUN (no files written)' : 'APPLIED'}`);
  console.log(`[rebrand] Target Brand: ${opts.name} (${opts.slug}) -> https://${opts.domain}`);
  console.log(`[rebrand] Files ${opts.dryRun ? 'to update' : 'updated'}: ${changed.join(', ') || '(none)'}`);
  console.log(
    '[rebrand] Manual external assets checklist: public/favicon.ico, public/apple-touch-icon.png, public/og-image.png, DNS/domain, & Supabase OAuth branding.',
  );
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/rebrand.ts');

if (isDirectExecution) {
  runRebrandCli().catch((err) => {
    console.error('[rebrand] Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
