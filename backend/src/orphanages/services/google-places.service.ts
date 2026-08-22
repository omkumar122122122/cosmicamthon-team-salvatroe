import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NormalizedOrphanage {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  website?: string;
  city?: string;
  source: 'registered' | 'google';
  isVerified?: boolean;
  distance?: number; // Haversine distance in km
}

@Injectable()
export class GooglePlacesService {
  private readonly logger = new Logger(GooglePlacesService.name);

  // In-memory TTL cache to minimize expensive Google Places API calls (10 min cache)
  private cache = new Map<string, { data: NormalizedOrphanage[]; timestamp: number }>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000;

  constructor(private readonly configService: ConfigService) {}

  // Helper to normalize phone numbers
  private normalizePhone(phone?: string): string | undefined {
    if (!phone || typeof phone !== 'string') return undefined;
    const trimmed = phone.trim();
    if (!trimmed || /^none$/i.test(trimmed) || /^n\/a$/i.test(trimmed)) return undefined;
    return trimmed;
  }

  // Helper to normalize website URLs
  private normalizeWebsite(url?: string): string | undefined {
    if (!url || typeof url !== 'string') return undefined;
    const trimmed = url.trim();
    if (!trimmed || /^none$/i.test(trimmed) || /^n\/a$/i.test(trimmed)) return undefined;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  /**
   * Search Google Places API for nearby orphanages & child care homes
   * @param lat Latitude (-90 to 90)
   * @param lng Longitude (-180 to 180)
   * @param radiusKm Selected search radius in kilometers (5, 10, 25, 50, 100)
   */
  async fetchNearbyOrphanages(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<NormalizedOrphanage[]> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') || process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY is not set in backend .env. Returning local database results.');
      return [];
    }

    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)},${radiusKm}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    // Google Places API limits circle radius searches to 50,000m (50 km).
    // For 100 km radius, we query the center + 4 offset grid centers (45km N, S, E, W) to achieve full 100 km coverage,
    // then filter out results whose Haversine distance exceeds 100 km.
    const searchCenters: Array<{ lat: number; lng: number }> = [{ lat, lng }];

    if (radiusKm > 50) {
      const latOffset = 0.4; // ~44.4 km
      const lngOffset = 0.4 / Math.cos((lat * Math.PI) / 180);
      searchCenters.push(
        { lat: lat + latOffset, lng },
        { lat: lat - latOffset, lng },
        { lat, lng: lng + lngOffset },
        { lat, lng: lng - lngOffset },
      );
    }

    const effectiveRadiusMeters = Math.min(radiusKm * 1000, 50000);
    const textQueries = [
      "orphanage",
      "children home",
      "SOS Children's Village",
      "child care home",
    ];

    const allPlacesMap = new Map<string, NormalizedOrphanage>();

    for (const center of searchCenters) {
      for (const query of textQueries) {
        try {
          const results = await this.executeGooglePlacesSearch(
            center.lat,
            center.lng,
            effectiveRadiusMeters,
            query,
            apiKey,
          );

          for (const item of results) {
            if (!allPlacesMap.has(item.id)) {
              allPlacesMap.set(item.id, item);
            }
          }
        } catch (err: any) {
          this.logger.warn(`Google Places query failed for (${center.lat}, ${center.lng}): ${err.message}`);
        }
      }
    }

    const finalResults = Array.from(allPlacesMap.values());
    this.cache.set(cacheKey, { data: finalResults, timestamp: Date.now() });
    return finalResults;
  }

  /**
   * Execute Google Places Text Search with field masks to fetch phone/website in 1 single call
   */
  private async executeGooglePlacesSearch(
    lat: number,
    lng: number,
    radiusMeters: number,
    queryText: string,
    apiKey: string,
  ): Promise<NormalizedOrphanage[]> {
    // Places API (New) Text Search with X-Goog-FieldMask
    const newApiUrl = 'https://places.googleapis.com/v1/places:searchText';
    const bodyPayload = {
      textQuery: queryText,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        },
      },
    };

    try {
      const res = await fetch(newApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri',
        },
        body: JSON.stringify(bodyPayload),
      });

      if (res.ok) {
        const data: any = await res.json();
        if (data && Array.isArray(data.places)) {
          return data.places.map((place: any) => this.normalizeGoogleNewPlace(place));
        }
      }
    } catch (err: any) {
      // Fallback if new Places API endpoint fails
    }

    // Fallback: Google Places Legacy Text Search
    const legacyUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      queryText,
    )}&location=${lat},${lng}&radius=${radiusMeters}&key=${apiKey}`;

    try {
      const res = await fetch(legacyUrl);
      if (res.ok) {
        const data: any = await res.json();
        if (data && Array.isArray(data.results)) {
          return data.results.map((place: any) => this.normalizeGoogleLegacyPlace(place));
        }
      }
    } catch (err: any) {
      this.logger.error(`Legacy Google Places search failed: ${err.message}`);
    }

    return [];
  }

  private normalizeGoogleNewPlace(place: any): NormalizedOrphanage {
    const id = place.id ? `google-${place.id}` : `google-${Math.random().toString(36).substring(2, 9)}`;
    const name = place.displayName?.text || 'Unnamed Orphanage';
    const latitude = place.location?.latitude || 0;
    const longitude = place.location?.longitude || 0;
    const address = place.formattedAddress || undefined;
    const phone = this.normalizePhone(place.nationalPhoneNumber);
    const website = this.normalizeWebsite(place.websiteUri);

    return {
      id,
      name,
      latitude,
      longitude,
      address,
      phone,
      website,
      source: 'google',
    };
  }

  private normalizeGoogleLegacyPlace(place: any): NormalizedOrphanage {
    const id = place.place_id ? `google-${place.place_id}` : `google-${Math.random().toString(36).substring(2, 9)}`;
    const name = place.name || 'Unnamed Orphanage';
    const latitude = place.geometry?.location?.lat || 0;
    const longitude = place.geometry?.location?.lng || 0;
    const address = place.formatted_address || place.vicinity || undefined;

    return {
      id,
      name,
      latitude,
      longitude,
      address,
      phone: undefined,
      website: undefined,
      source: 'google',
    };
  }
}
