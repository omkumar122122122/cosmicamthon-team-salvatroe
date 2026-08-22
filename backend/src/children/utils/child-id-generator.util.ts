export class ChildIdGeneratorUtil {
  /**
   * Generates a unique, standardized Child ID code.
   * Format: CH-YYYY-XXXXX (e.g. CH-2026-00125)
   */
  static generateChildCode(sequenceNumber?: number): string {
    const year = new Date().getFullYear();
    const seq = sequenceNumber ?? Math.floor(10000 + Math.random() * 90000);
    const paddedSeq = String(seq).padStart(5, '0');
    return `CH-${year}-${paddedSeq}`;
  }
}
