/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Geolocation & Indoor Location Manager
 * Robust handling of GPS, network location, timeouts, permission denial, and manual floor descriptions.
 */

import { UserLocation } from '../types';

export class LocationService {
  private lastKnownLocation: UserLocation = {
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    timestamp: null,
    manualDescription: '',
    source: 'unavailable',
  };

  getLastKnown(): UserLocation {
    return { ...this.lastKnownLocation };
  }

  setManualDescription(desc: string): UserLocation {
    this.lastKnownLocation.manualDescription = desc;
    if (this.lastKnownLocation.source === 'unavailable') {
      this.lastKnownLocation.source = 'manual';
    }
    return { ...this.lastKnownLocation };
  }

  /**
   * Acquire high-accuracy GPS fix with resilient timeout & fallback
   */
  async acquireLocation(timeoutMs = 7000): Promise<{
    location: UserLocation;
    status: 'success' | 'permission_denied' | 'timeout' | 'unavailable' | 'manual_only';
    errorMessage?: string;
  }> {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return {
        location: this.lastKnownLocation,
        status: 'unavailable',
        errorMessage: 'Geolocation hardware/API is not supported on this platform.',
      };
    }

    return new Promise((resolve) => {
      let isSettled = false;

      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          // Return last known with manual fallback
          resolve({
            location: this.lastKnownLocation,
            status: 'timeout',
            errorMessage: 'GPS acquisition timed out (common indoors or in deep structures).',
          });
        }
      }, timeoutMs);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isSettled) return;
          clearTimeout(timer);
          isSettled = true;

          this.lastKnownLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy),
            altitude: position.coords.altitude ? Math.round(position.coords.altitude) : null,
            timestamp: position.timestamp,
            manualDescription: this.lastKnownLocation.manualDescription,
            source: 'gps',
          };

          resolve({
            location: { ...this.lastKnownLocation },
            status: 'success',
          });
        },
        (error) => {
          if (isSettled) return;
          clearTimeout(timer);
          isSettled = true;

          let status: 'permission_denied' | 'timeout' | 'unavailable' = 'unavailable';
          let msg = error.message;

          if (error.code === error.PERMISSION_DENIED) {
            status = 'permission_denied';
            msg = 'Location permission denied by user.';
          } else if (error.code === error.TIMEOUT) {
            status = 'timeout';
            msg = 'Location request timed out.';
          }

          resolve({
            location: this.lastKnownLocation,
            status,
            errorMessage: msg,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 30000, // allow up to 30s cached fix
        }
      );
    });
  }

  formatLocationForSms(loc: UserLocation): string {
    const parts: string[] = [];

    if (loc.latitude !== null && loc.longitude !== null) {
      const lat = loc.latitude.toFixed(5);
      const lng = loc.longitude.toFixed(5);
      const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
      parts.push(`GPS: ${lat}, ${lng} (±${loc.accuracy ?? '?'}m) [${mapsUrl}]`);
    } else {
      parts.push('GPS: Unavailable/Indoor');
    }

    if (loc.manualDescription.trim()) {
      parts.push(`Location Detail: "${loc.manualDescription.trim()}"`);
    }

    return parts.join(' | ');
  }
}

export const locationService = new LocationService();
