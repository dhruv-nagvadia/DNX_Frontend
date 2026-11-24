import { Fragment, type ReactNode } from 'react';
import { ArrowUp, CalendarClock, FileText } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { SiteFooter, SiteNav } from '@/pages/home/HomePage/SiteChrome';
import type { LegalSection } from '@/utils/legalContent';

import styles from './legal.module.css';

const POLICIES = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/refund-policy', label: 'Refund & Cancellation' },
  { to: '/provider-terms', label: 'Provider Terms' },
] as const;

const BULLET = /^\s*•\s*/;

type Block = { kind: 'p'; lines: string[] } | { kind: 'ul'; items: string[] };

/**
 * Splits a section body (plain text with blank-line paragraphs and "• "
 * bullet lines) into paragraphs and lists. The text itself is unchanged.
 */
function toBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  let paraOpen = false;

  for (const raw of body.split('\n')) {
    const line = raw.trimEnd();
    const last = blocks[blocks.length - 1];

    if (line.trim() === '') {
      paraOpen = false;
      continue;
    }

    if (BULLET.test(line)) {
      const item = line.replace(BULLET, '');
      if (last?.kind === 'ul') last.items.push(item);
      else blocks.push({ kind: 'ul', items: [item] });
      paraOpen = false;
    } else if (paraOpen && last?.kind === 'p') {
      last.lines.push(line);
    } else {
      blocks.push({ kind: 'p', lines: [line] });
      paraOpen = true;
    }
  }

  return blocks;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function SectionBody({ body }: { body: string }) {
  return (
    <>
      {toBlocks(body).map((block, i) =>
        block.kind === 'ul' ? (
          <ul key={i} className={styles.list}>
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className={styles.para}>
            {block.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
        ),
      )}
    </>
  );
}

export interface LegalLayoutProps {
  title: ReactNode;
  /** e.g. "September 2026" — rendered as "Last updated: …". */
  lastUpdated?: string;
  sections: LegalSection[];
}

/**
 * Shared shell for the public legal pages: site nav, a header band with the
 * title and last-updated date, a sticky table of contents (desktop) built
 * from the section headings, numbered content cards, and the site footer.
 */
export function LegalLayout({ title, lastUpdated, sections }: LegalLayoutProps) {
  const entries = sections.map((section, i) => ({
    ...section,
    id: `s${i + 1}-${slugify(section.heading)}`,
    num: i + 1,
  }));

  return (
    <div className={styles.page} id="top">
      <SiteNav />

      <main id="main" tabIndex={-1} className={styles.main}>
        <div className={styles.band}>
          <div className={styles.bandInner}>
            <span className={styles.eyebrow}>
              <FileText size={14} strokeWidth={2.25} aria-hidden="true" />
              Legal
            </span>
            <h1 className={styles.title}>{title}</h1>
            {lastUpdated && (
              <p className={styles.updated}>
                <CalendarClock size={15} strokeWidth={2} aria-hidden="true" />
                Last updated: {lastUpdated}
              </p>
            )}

            <nav className={styles.policies} aria-label="Policies">
              {POLICIES.map((p) => (
                <NavLink
                  key={p.to}
                  to={p.to}
                  className={({ isActive }) =>
                    `${styles.policyLink} ${isActive ? styles.policyLinkActive : ''}`
                  }
                >
                  {p.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        <div className={styles.body}>
          <aside className={styles.toc}>
            <nav aria-labelledby="toc-title">
              <h2 id="toc-title" className={styles.tocTitle}>
                On this page
              </h2>
              <ol className={styles.tocList}>
                {entries.map((e) => (
                  <li key={e.id}>
                    <a className={styles.tocLink} href={`#${e.id}`}>
                      <span className={styles.tocNum} aria-hidden="true">
                        {e.num}
                      </span>
                      {e.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <div className={styles.content}>
            {entries.map((e) => (
              <section key={e.id} id={e.id} className={styles.card} aria-labelledby={`${e.id}-h`}>
                <h2 id={`${e.id}-h`} className={styles.sectionHeading}>
                  <span className={styles.num} aria-hidden="true">
                    {e.num}
                  </span>
                  {e.heading}
                </h2>
                <div className={styles.sectionBody}>
                  <SectionBody body={e.body} />
                </div>
              </section>
            ))}

            <a className={styles.backTop} href="#top">
              <ArrowUp size={16} strokeWidth={2.25} aria-hidden="true" />
              Back to top
            </a>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
