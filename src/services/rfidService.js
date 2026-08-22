/**
 * rfidService.js
 * Clean service layer for RFID verification and movement queries.
 * Abstracted to easily swap mock data with backend API calls in future phases.
 */

import { mockRFIDRecords } from "../data/rfidDummyData.js";

export const rfidService = {
  /**
   * Verify an RFID card ID against the registered database.
   * Performs normalization (trimming whitespace and case-insensitive comparison).
   * 
   * @param {string} rawRfidInput
   * @returns {Promise<{ success: boolean, data?: object, message?: string }>}
   */
  async verifyRFID(rawRfidInput) {
    // Brief async delay to simulate network/hardware lookup without artificial lag
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (!rawRfidInput || typeof rawRfidInput !== "string" || !rawRfidInput.trim()) {
      return {
        success: false,
        message: "Please enter an RFID ID.",
      };
    }

    const normalizedInput = rawRfidInput.trim().toUpperCase();

    const record = mockRFIDRecords.find(
      (item) => item.rfidTag.toUpperCase() === normalizedInput
    );

    if (!record) {
      return {
        success: false,
        message: "RFID ID NOT RECOGNIZED",
      };
    }

    if (record.rfidStatus !== "Active") {
      return {
        success: false,
        message: `RFID CARD ${record.rfidStatus.toUpperCase()}`,
        data: record,
      };
    }

    return {
      success: true,
      data: record,
      message: "RFID VERIFIED",
    };
  },

  /**
   * Get an RFID record by RFID tag ID with normalization.
   * 
   * @param {string} rfidTag
   * @returns {Promise<object|null>}
   */
  async getRecordByTag(rfidTag) {
    if (!rfidTag || typeof rfidTag !== "string") return null;
    const normalized = rfidTag.trim().toUpperCase();
    const record = mockRFIDRecords.find(
      (item) => item.rfidTag.toUpperCase() === normalized
    );
    return record ? { ...record } : null;
  },

  /**
   * Get all registered RFID records.
   */
  async getAllRecords() {
    return [...mockRFIDRecords];
  },
};
