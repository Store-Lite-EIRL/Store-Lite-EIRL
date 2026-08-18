/**
 * splitFullName
 *
 * Splits a full name on the first space into first_name / last_name,
 * matching the shape Culqi expects in antifraud_details (charges) and
 * client_details (orders). Returns an empty object when no name is
 * provided so callers can spread it conditionally without sending
 * empty strings to the API.
 */

export interface SplitFullNameResult {
  first_name?: string;
  last_name?: string;
}

export function splitFullName(fullName?: string | null): SplitFullNameResult {
  const name = fullName?.trim();
  if (!name) return {};

  const firstSpace = name.indexOf(' ');
  if (firstSpace === -1) return { first_name: name };

  return {
    first_name: name.slice(0, firstSpace),
    last_name: name.slice(firstSpace + 1).trim() || undefined,
  };
}
