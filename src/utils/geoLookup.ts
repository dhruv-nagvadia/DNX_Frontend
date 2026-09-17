import { networkCall } from '@/api/apiConfig';
import { endpoints } from '@/api/endpoints';

/** One post office entry from India Post's free, keyless PIN-code directory. */
export interface PostOffice {
  name: string;
  district: string;
  state: string;
  pincode: string;
}

const POSTAL_BASE = 'https://api.postalpincode.in';

interface RawPostOfficeResponse {
  Status?: string;
  PostOffice?: {
    Name?: string;
    District?: string;
    State?: string;
    Pincode?: string;
  }[];
}

function toPostOffices(json: unknown): PostOffice[] {
  const first = Array.isArray(json) ? (json[0] as RawPostOfficeResponse) : null;
  if (!first || first.Status !== 'Success' || !Array.isArray(first.PostOffice)) {
    return [];
  }
  return first.PostOffice.map((p) => ({
    name: p.Name ?? '',
    district: p.District ?? '',
    state: p.State ?? '',
    pincode: p.Pincode ?? '',
  })).filter((p) => p.name && p.pincode);
}

/** City (district) + state for an exact 6-digit PIN code — India Post, free & keyless. */
export async function lookupPincode(pincode: string): Promise<{ city: string; state: string } | null> {
  try {
    const res = await fetch(`${POSTAL_BASE}/pincode/${encodeURIComponent(pincode)}`);
    if (!res.ok) return null;
    const best = toPostOffices(await res.json())[0];
    return best ? { city: best.district, state: best.state } : null;
  } catch {
    return null;
  }
}

interface ReverseGeocodeResult {
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
}

/**
 * Best-effort address/city/state/PIN for device coordinates. Goes through our
 * own backend (which calls Nominatim) rather than hitting a geocoding API
 * directly from the browser — Nominatim sends no CORS headers, so a direct
 * client-side call is silently blocked.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ address?: string; city?: string; state?: string; postalCode?: string }> {
  try {
    const res = await networkCall.get<{ data: ReverseGeocodeResult }>(endpoints.reverseGeocode, {
      params: { lat, lng },
    });
    const { address, city, state, postalCode } = res.data.data;
    return {
      address: address ?? undefined,
      city: city ?? undefined,
      state: state ?? undefined,
      postalCode: postalCode ?? undefined,
    };
  } catch {
    return {};
  }
}
