// =====================================================
// SITE JSON-LD — Root knowledge graph (Organization + WebSite)
// =====================================================
// Description: Builds the site-level structured-data graph rendered once in
//   the root layout so every page carries site identity. Storefront pages add
//   their own LocalBusiness/Product graphs separately (@types differ, no
//   conflict). Pure function: receives the app base URL so it stays unit-testable.
// =====================================================

export const SITE_NAME = 'Store Lite';
export const SITE_DESCRIPTION = 'Gestiona tus negocios de forma sencilla y eficiente.';
const SITE_LANGUAGE = 'es';
const SITE_ICON_PATH = '/img/icon.png';
// Only verified social profile — do not add unverified URLs.
const FACEBOOK_PROFILE_URL = 'https://www.facebook.com/storelite';

export interface JsonLdOrganization {
  '@type': 'Organization';
  '@id': string;
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
}

export interface JsonLdWebSite {
  '@type': 'WebSite';
  '@id': string;
  name: string;
  url: string;
  inLanguage: string;
  publisher: { '@id': string };
}

export interface SiteJsonLd {
  '@context': 'https://schema.org';
  '@graph': [JsonLdOrganization, JsonLdWebSite];
}

/**
 * Builds the site-level JSON-LD knowledge graph.
 *
 * @param appUrl - Absolute base URL of the site (e.g. env.nextPublicAppUrl).
 *   A trailing slash is normalized away.
 */
export function buildSiteJsonLd(appUrl: string): SiteJsonLd {
  const baseUrl = appUrl.replace(/\/+$/, '');
  const organizationId = `${baseUrl}/#organization`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: SITE_NAME,
        url: baseUrl,
        logo: `${baseUrl}${SITE_ICON_PATH}`,
        description: SITE_DESCRIPTION,
        sameAs: [FACEBOOK_PROFILE_URL],
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        name: SITE_NAME,
        url: baseUrl,
        inLanguage: SITE_LANGUAGE,
        publisher: { '@id': organizationId },
      },
    ],
  };
}
