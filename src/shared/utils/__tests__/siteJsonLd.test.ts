import { describe, expect, it } from 'vitest';

import { buildSiteJsonLd } from '../siteJsonLd';

// ── Tests ────────────────────────────────────────────────────────────────────

describe('buildSiteJsonLd', () => {
  const appUrl = 'https://storelite.app';

  it('returns a valid @graph with exactly one Organization and one WebSite node', () => {
    const jsonLd = buildSiteJsonLd(appUrl);

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@graph']).toHaveLength(2);
    expect(jsonLd['@graph'].map((node) => node['@type'])).toEqual(['Organization', 'WebSite']);
  });

  it('builds absolute URLs derived from the provided app URL', () => {
    const [organization, website] = buildSiteJsonLd(appUrl)['@graph'];

    expect(organization.url).toBe('https://storelite.app');
    expect(organization.logo).toBe('https://storelite.app/img/icon.png');
    expect(website.url).toBe('https://storelite.app');

    // Every URL must be parseable/absolute
    for (const url of [organization.url, organization.logo, website.url]) {
      expect(() => new URL(url)).not.toThrow();
    }
  });

  it('normalizes a trailing slash on the app URL', () => {
    const [organization] = buildSiteJsonLd(`${appUrl}/`)['@graph'];

    expect(organization.url).toBe(appUrl);
    expect(organization.logo).toBe(`${appUrl}/img/icon.png`);
  });

  it('cross-references WebSite publisher with the Organization @id', () => {
    const [, website] = buildSiteJsonLd(appUrl)['@graph'];

    expect(website.publisher).toEqual({ '@id': `${appUrl}/#organization` });
  });

  it('contains no invented fields — asserts the exact expected object shape', () => {
    expect(buildSiteJsonLd(appUrl)).toEqual({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://storelite.app/#organization',
          name: 'Store Lite',
          url: 'https://storelite.app',
          logo: 'https://storelite.app/img/icon.png',
          description: 'Gestiona tus negocios de forma sencilla y eficiente.',
          sameAs: ['https://www.facebook.com/storelite'],
        },
        {
          '@type': 'WebSite',
          '@id': 'https://storelite.app/#website',
          name: 'Store Lite',
          url: 'https://storelite.app',
          inLanguage: 'es',
          publisher: { '@id': 'https://storelite.app/#organization' },
        },
      ],
    });
  });
});
