# Delta for storefront-public-info

**Change**: storefront-card-download-location
**Base**: `openspec/specs/storefront-public-info/spec.md` (R1-R6 unchanged)
This delta ADDS R7 and R8. No R1-R6 requirement is modified or removed.

## ADDED Requirements

### R7: Owner can download the card PNG from the NOSOTROS section

The NOSOTROS section MUST thread a strict `isOwner` boolean from the page into the embedded `BusinessPreviewCard`, passing it as `showDownloadButton={isOwner}`. The download button MUST be visible ONLY when `isOwner` is true — staff with permissions (`isStaff`) or anonymous visitors MUST NOT see it. The download button MUST carry a descriptive `aria-label`. The capture logic MUST reuse `BusinessPreviewCard`'s existing `handleDownload` (no new capture code).

#### Scenario: Owner views NOSOTROS

- GIVEN `isOwner` is true for the current viewer
- WHEN the NOSOTROS card renders
- THEN the download button appears with a descriptive `aria-label`

#### Scenario: Non-owner staff member views NOSOTROS

- GIVEN a staff member with `isStaff` true but `isOwner` false
- WHEN the NOSOTROS card renders
- THEN the download button MUST NOT appear

#### Scenario: Anonymous customer views NOSOTROS

- GIVEN a non-owner customer with `isOwner` false and no staff membership
- WHEN the NOSOTROS card renders
- THEN the download button MUST NOT appear

### R8: "Cómo llegar?" deep link to Google Maps when a location exists

The NOSOTROS section MUST render an anchor to Google Maps ONLY when `buildGoogleMapsUrl` returns a non-empty string. The pure helper `buildGoogleMapsUrl` MUST join present location parts (`address`, `city`, `departamento`, `provincia`, `distrito`, `country`) and encode them with `encodeURIComponent` into `https://www.google.com/maps/search/?api=1&query=<encoded>`. The anchor MUST open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`). If NO location part exists, the helper MUST return an empty string and the section MUST render no Maps link. No lat/lng, coordinates, API key, or new DB field is used.

#### Scenario: Full location present

- GIVEN a business with `address`, `city`, and `country`
- WHEN the NOSOTROS section renders
- THEN a "Cómo llegar?" anchor to the encoded Google Maps search URL appears in a new tab

#### Scenario: Sparse business (no location)

- GIVEN a business with all location parts null/empty
- WHEN `buildGoogleMapsUrl` runs
- THEN it returns an empty string and the section renders no Maps link

#### Scenario: buildGoogleMapsUrl with partial location

- GIVEN a business with only `city` and `provincia` present
- WHEN `buildGoogleMapsUrl` runs
- THEN it returns a URL containing those parts URL-encoded

#### Scenario: buildGoogleMapsUrl with no parts

- GIVEN a business with all location parts missing
- WHEN `buildGoogleMapsUrl` runs
- THEN it returns an empty string

## Out of Scope

- Modifying R1-R6 of `storefront-public-info`
- `LocationMap.tsx` iframe embed (not the deep-link anchor)
- Schema, migrations, server actions, or new DB fields
- Reactivating orphaned `AboutSection.tsx`
- Changing settings or create-business `BusinessPreview.tsx` callers
- Changing the `isStaff`-gated `showDownloadButton` used by other storefront sections (only the NOSOTROS card is re-gated to strict `isOwner`)
