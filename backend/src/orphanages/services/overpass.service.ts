import { Injectable, Logger } from '@nestjs/common';

export interface NormalizedOrphanage {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  website?: string;
  city?: string;
  source: 'DATABASE' | 'OPENSTREETMAP';
  distance?: number; // Haversine distance in km
}

@Injectable()
export class OverpassService {
  private readonly logger = new Logger(OverpassService.name);

  // Simple in-memory cache: key = `lat,lng,radius`, value = { data, timestamp }
  private cache = new Map<string, { data: NormalizedOrphanage[]; timestamp: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

  // Normalize raw website URLs
  private normalizeWebsiteUrl(url?: string): string | undefined {
    if (!url || typeof url !== 'string') return undefined;
    const trimmed = url.trim();
    if (!trimmed || /^none$/i.test(trimmed) || /^n\/a$/i.test(trimmed) || /^null$/i.test(trimmed)) {
      return undefined;
    }
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  // Normalize raw phone numbers
  private normalizePhoneNumber(phone?: string): string | undefined {
    if (!phone || typeof phone !== 'string') return undefined;
    const trimmed = phone.trim();
    if (!trimmed || /^none$/i.test(trimmed) || /^n\/a$/i.test(trimmed) || /^null$/i.test(trimmed)) {
      return undefined;
    }
    return trimmed;
  }

  /**
   * Query OpenStreetMap Overpass API for orphanages around coordinates
   * @param lat Latitude (-90 to 90)
   * @param lng Longitude (-180 to 180)
   * @param radiusMeters Radius in meters (e.g. 5000, 10000, 25000, 50000, 100000)
   */
  async fetchNearbyOrphanages(
    lat: number,
    lng: number,
    radiusMeters: number,
  ): Promise<NormalizedOrphanage[]> {
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)},${radiusMeters}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    // Overpass QL Query covering nodes, ways, and relations for orphanages & child social facilities
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="orphanage"](around:${radiusMeters},${lat},${lng});
        way["amenity"="orphanage"](around:${radiusMeters},${lat},${lng});
        relation["amenity"="orphanage"](around:${radiusMeters},${lat},${lng});

        node["social_facility"="orphanage"](around:${radiusMeters},${lat},${lng});
        way["social_facility"="orphanage"](around:${radiusMeters},${lat},${lng});
        relation["social_facility"="orphanage"](around:${radiusMeters},${lat},${lng});

        node["social_facility:for"~"child|children"](around:${radiusMeters},${lat},${lng});
        way["social_facility:for"~"child|children"](around:${radiusMeters},${lat},${lng});
        relation["social_facility:for"~"child|children"](around:${radiusMeters},${lat},${lng});
      );
      out center body;
    `;

    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ];

    let lastError: any = null;

    for (const endpoint of endpoints) {
      try {
        const url = `${endpoint}?data=${encodeURIComponent(overpassQuery)}`;
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'OrphanageChildSafetyBackend/1.0 (https://github.com/omkumar122122122)',
          },
        });

        if (response.ok) {
          const data: any = await response.json();
          if (data && Array.isArray(data.elements)) {
            const results = this.normalizeOverpassElements(data.elements);
            this.cache.set(cacheKey, { data: results, timestamp: Date.now() });
            return results;
          }
        }
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Overpass endpoint ${endpoint} failed: ${err.message}`);
      }
    }

    this.logger.error(`All Overpass API endpoints failed. Last error: ${lastError?.message}`);
    return [];
  }

  private normalizeOverpassElements(elements: any[]): NormalizedOrphanage[] {
    const normalized: NormalizedOrphanage[] = [];
    const seenOsmIds = new Set<string>();

    for (const elem of elements) {
      const stableId = `osm-${elem.type}-${elem.id}`;
      if (seenOsmIds.has(stableId)) continue;
      seenOsmIds.add(stableId);

      let latitude: number | null = null;
      let longitude: number | null = null;

      if (elem.type === 'node' && elem.lat && elem.lon) {
        latitude = elem.lat;
        longitude = elem.lon;
      } else if ((elem.type === 'way' || elem.type === 'relation') && elem.center) {
        latitude = elem.center.lat;
        longitude = elem.center.lon;
      }

      if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
        continue; // Skip invalid geometry
      }

      const tags = elem.tags || {};
      const name = tags.name || tags['name:en'] || tags['official_name'] || 'Unnamed Orphanage';

      // Address construction from OSM tags
      const addressParts: string[] = [];
      if (tags['addr:housenumber']) addressParts.push(tags['addr:housenumber']);
      if (tags['addr:street']) addressParts.push(tags['addr:street']);
      if (tags['addr:suburb']) addressParts.push(tags['addr:suburb']);
      if (tags['addr:city']) addressParts.push(tags['addr:city']);
      if (tags['addr:postcode']) addressParts.push(tags['addr:postcode']);

      const address = addressParts.length > 0 ? addressParts.join(', ') : (tags['addr:full'] || undefined);
      const phone = this.normalizePhoneNumber(tags.phone || tags['contact:phone']);
      const website = this.normalizeWebsiteUrl(tags.website || tags['contact:website']);
      const city = tags['addr:city'] || tags['addr:district'] || undefined;

      normalized.push({
        id: stableId,
        name,
        latitude,
        longitude,
        address,
        phone,
        website,
        city,
        source: 'OPENSTREETMAP',
      });
    }

    return normalized;
  }
}
