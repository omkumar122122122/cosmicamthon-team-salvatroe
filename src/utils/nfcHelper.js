/**
 * nfcHelper.js — Web NFC API integration & safe browser compatibility handler
 */

/**
 * Checks if the Web NFC API is supported in the current browser environment
 */
export function isWebNfcSupported() {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

/**
 * Centralized public NFC scan URL builder.
 * Prioritizes VITE_PUBLIC_APP_URL (Cloudflare Tunnel URL) when configured,
 * otherwise falls back dynamically to current window.location.origin, and lastly localhost.
 */
export function buildNfcPublicScanUrl(nfcIdOrToken) {
  const publicEnv = import.meta.env.VITE_PUBLIC_APP_URL;
  let baseUrl = 'http://localhost:5173';

  if (publicEnv && typeof publicEnv === 'string' && publicEnv.trim() !== '') {
    baseUrl = publicEnv.trim().replace(/\/+$/, '');
  } else if (typeof window !== 'undefined' && window.location?.origin) {
    baseUrl = window.location.origin.replace(/\/+$/, '');
  }

  const cleanId = encodeURIComponent(String(nfcIdOrToken || '').trim());
  return `${baseUrl}/nfc/scan/${cleanId}`;
}

/**
 * Extracts a secure token or NFC ID from an NDEF text/URL record or string
 */
export function extractTokenFromNfcPayload(payloadStr) {
  if (!payloadStr) return null;
  const clean = String(payloadStr).trim();

  // 1. Matches /nfc/scan/:id, /nfc/visit/:id, or /nfc/parent/:id URL patterns
  const urlMatch = clean.match(/\/nfc\/(?:scan|visit|parent)\/([a-zA-Z0-9_-]+)/i);
  if (urlMatch && urlMatch[1]) {
    const val = urlMatch[1];
    return {
      type: val.toUpperCase().startsWith('NFC-VST-') ? 'NFC_ID' : 'TOKEN',
      value: val,
    };
  }

  // 2. Matches human NFC-VST-XXXXXX pattern
  if (/^NFC-VST-[A-Z0-9]+$/i.test(clean)) {
    return { type: 'NFC_ID', value: clean.toUpperCase() };
  }

  // 3. Matches 32-64 char hex secure token directly
  if (/^[a-fA-F0-9]{32,64}$/.test(clean)) {
    return { type: 'TOKEN', value: clean };
  }

  return { type: 'RAW', value: clean };
}

/**
 * Starts a native Web NFC scanner session
 * @param {Object} callbacks
 * @returns {Function} stopScanning function
 */
export async function startWebNfcScan({ onReading, onError, onStatusChange, signal }) {
  if (!isWebNfcSupported()) {
    throw new Error('Web NFC API is not supported in this browser. Use Chrome on Android or the manual tap simulator.');
  }

  try {
    const ndef = new window.NDEFReader();
    onStatusChange?.('INITIALIZING', 'Requesting NFC sensor access...');

    await ndef.scan({ signal });
    onStatusChange?.('LISTENING', 'Hold your phone near an NFC tag to scan...');

    ndef.addEventListener('readingerror', () => {
      onError?.(new Error('Cannot read data from the NFC tag. Try tapping again.'));
    });

    ndef.addEventListener('reading', ({ message, serialNumber }) => {
      onStatusChange?.('READING', 'NFC tag detected! Reading payload...');
      let extractedData = null;

      for (const record of message.records) {
        if (record.recordType === 'text') {
          const textDecoder = new TextDecoder(record.encoding || 'utf-8');
          const decoded = textDecoder.decode(record.data);
          extractedData = extractTokenFromNfcPayload(decoded);
          break;
        } else if (record.recordType === 'url') {
          const textDecoder = new TextDecoder();
          const decodedUrl = textDecoder.decode(record.data);
          extractedData = extractTokenFromNfcPayload(decodedUrl);
          break;
        }
      }

      onReading?.({
        serialNumber,
        extractedData,
        recordsCount: message.records.length,
      });
    });

    return () => {
      // Cleanup handled by AbortController signal
    };
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      throw new Error('NFC permission was denied. Please allow NFC access in your browser site settings.');
    } else if (error.name === 'NotSupportedError') {
      throw new Error('NFC hardware is unavailable or disabled on this device.');
    }
    throw error;
  }
}

/**
 * Writes an NFC Visit Pass URL onto a physical NFC card/tag (NTAG213/215/216)
 */
export async function writeWebNfcTag(url, signal) {
  if (!isWebNfcSupported()) {
    throw new Error('Web NFC writing is not supported in this browser.');
  }

  const ndef = new window.NDEFReader();
  await ndef.write(
    {
      records: [
        { recordType: 'url', data: url },
      ],
    },
    { signal }
  );
}
