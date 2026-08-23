/**
 * gateService.js
 * Clean service layer for Orphanage Gate RFID simulation, access control, and movement history.
 */

import { initialMockStaff, initialRecentActivity } from "../data/gateData.js";

// In-memory persistent state during frontend runtime session
let staffRecords = [...initialMockStaff.map((s) => ({ ...s }))];
let recentActivity = [...initialRecentActivity.map((a) => ({ ...a }))];
let lastScanTimestampByTag = {};

const SCAN_COOLDOWN_MS = 3500; // 3.5 seconds cooldown to prevent duplicate double scans

function formatCurrentDate() {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCurrentTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export const gateService = {
  /**
   * Scan and verify an RFID tag.
   * Handles normalization, cooldown, active status, toggle entry/exit, and activity recording.
   * 
   * @param {string} rawRfidInput
   * @returns {Promise<{ success: boolean, staff?: object, movement?: object, message?: string, duplicate?: boolean }>}
   */
  async scanRFID(rawRfidInput) {
    // Brief simulated verification latency
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (!rawRfidInput || typeof rawRfidInput !== "string" || !rawRfidInput.trim()) {
      return {
        success: false,
        message: "Please enter an RFID ID.",
      };
    }

    const normalizedTag = rawRfidInput.trim().toUpperCase();

    // 1. Cooldown / Duplicate Scan Check
    const now = Date.now();
    const lastScanTime = lastScanTimestampByTag[normalizedTag];
    if (lastScanTime && now - lastScanTime < SCAN_COOLDOWN_MS) {
      return {
        success: false,
        duplicate: true,
        message: "SCAN ALREADY PROCESSED. Please wait before scanning again.",
      };
    }

    // 2. Find Staff Record (supports RFID ID, Staff ID, or normalized variants)
    const staffIndex = staffRecords.findIndex((item) => {
      const rfid = item.rfidTag.toUpperCase();
      const staffId = item.staffId.toUpperCase();
      const name = item.name.toUpperCase();

      return (
        rfid === normalizedTag ||
        staffId === normalizedTag ||
        rfid === `RFID-${normalizedTag}` ||
        staffId === `STF-${normalizedTag}` ||
        rfid.replace(/[^A-Z0-9]/g, "") === normalizedTag.replace(/[^A-Z0-9]/g, "") ||
        staffId.replace(/[^A-Z0-9]/g, "") === normalizedTag.replace(/[^A-Z0-9]/g, "") ||
        name === normalizedTag
      );
    });

    if (staffIndex === -1) {
      return {
        success: false,
        message: "CARD OR STAFF ID NOT RECOGNIZED - ACCESS DENIED",
      };
    }

    const staff = staffRecords[staffIndex];

    // 3. Inactive Card Check
    if (staff.rfidStatus?.toLowerCase() !== "active") {
      return {
        success: false,
        message: "RFID CARD INACTIVE - ACCESS DENIED",
      };
    }

    // 4. Automatic Entry / Exit Toggle Logic
    const previousStatus = staff.currentStatus?.toLowerCase() === "inside" ? "Inside" : "Outside";
    const movementType = previousStatus === "Outside" ? "ENTRY" : "EXIT";
    const newStatus = movementType === "ENTRY" ? "Inside" : "Outside";

    const currentDate = formatCurrentDate();
    const currentTime = formatCurrentTime();

    // Record movement object
    const movementRecord = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      staffId: staff.staffId,
      name: staff.name,
      rfidTag: staff.rfidTag,
      role: staff.role,
      movementType,
      date: currentDate,
      time: currentTime,
      gate: staff.gate || "Main Gate",
      status: "AUTHORIZED",
      currentStatus: newStatus,
    };

    // Update staff in-memory state
    staff.currentStatus = newStatus;
    staff.lastMovement = {
      movementType,
      date: currentDate,
      time: currentTime,
      gate: staff.gate || "Main Gate",
      status: "AUTHORIZED",
    };

    // Prepend to activity log
    recentActivity = [movementRecord, ...recentActivity.slice(0, 19)];

    // Update cooldown timestamp
    lastScanTimestampByTag[normalizedTag] = now;

    return {
      success: true,
      staff: { ...staff },
      movement: { ...movementRecord },
      message: "RFID VERIFIED",
    };
  },

  /**
   * Get a staff member by their staff ID (e.g. STF-001)
   */
  async getStaffById(staffId) {
    if (!staffId || typeof staffId !== "string") return null;
    const normalized = staffId.trim().toUpperCase();
    const found = staffRecords.find(
      (s) => s.staffId.toUpperCase() === normalized
    );
    return found ? { ...found } : null;
  },

  /**
   * Get all registered staff
   */
  async getAllStaff() {
    return staffRecords.map((s) => ({ ...s }));
  },

  /**
   * Get recent gate activity movements
   */
  async getRecentActivity() {
    return recentActivity.map((a) => ({ ...a }));
  },
};
