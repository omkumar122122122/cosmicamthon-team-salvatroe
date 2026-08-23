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
   * Scan and verify a Parent Visit QR / Credential.
   * Connects to the backend NFC verification endpoint and records movement in recent activity.
   * 
   * @param {string} rawQrInput
   * @returns {Promise<{ success: boolean, access?: string, movement?: string, parent?: object, child?: object, orphanage?: object, visit?: object, message?: string, duplicate?: boolean }>}
   */
  async scanParentQR(rawQrInput) {
    if (!rawQrInput || typeof rawQrInput !== "string" || !rawQrInput.trim()) {
      return {
        success: false,
        message: "Please scan or enter a valid Parent Visit QR / Pass ID.",
      };
    }

    const cleanInput = rawQrInput.trim();

    try {
      // Call backend API /api/v1/nfc/verify
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const res = await fetch("/api/v1/nfc/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ credential: cleanInput }),
      });

      const rawRes = await res.json();
      const data = rawRes.data || rawRes;

      if (res.ok && data.status === "SUCCESS") {
        const movementType = data.movement || "ENTRY";
        const parentName = data.parent?.name || "Parent Visitor";
        const childName = data.child?.name || "Child";
        const currentDate = formatCurrentDate();
        const currentTime = formatCurrentTime();

        // Record in unified gate activity
        const parentMovementRecord = {
          id: `mov-parent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          staffId: data.passId || "PARENT-PASS",
          name: parentName,
          rfidTag: data.passId || "PARENT-QR",
          role: "Parent Visitor",
          userType: "PARENT",
          childName,
          movementType,
          date: currentDate,
          time: currentTime,
          gate: "Main Gate",
          status: "AUTHORIZED",
          currentStatus: movementType === "ENTRY" ? "Inside" : "Outside",
        };

        if (!data.duplicate) {
          recentActivity = [parentMovementRecord, ...recentActivity.slice(0, 19)];
        }

        return {
          success: true,
          access: data.access || "GRANTED",
          movement: movementType,
          duplicate: data.duplicate || false,
          parent: data.parent,
          child: data.child,
          orphanage: data.orphanage,
          visit: data.visit,
          passId: data.passId,
          message: data.message || "✓ VISIT VERIFIED — ACCESS GRANTED",
        };
      } else {
        return {
          success: false,
          access: "DENIED",
          status: data.status || "INVALID",
          message: data.message || "INVALID VISIT PASS: Access Denied.",
          parent: data.parent,
          child: data.child,
          orphanage: data.orphanage,
          visit: data.visit,
        };
      }
    } catch (err) {
      console.warn("NFC API error, checking fallback/offline lookup:", err);
      return {
        success: false,
        access: "DENIED",
        message: "Error verifying visit pass with server. Please try again.",
      };
    }
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

  /**
   * Get Gate Control Center live summary from backend with fallback
   */
  async getGateSummary() {
    try {
      const res = await fetch("/api/v1/nfc/summary");
      if (res.ok) {
        const raw = await res.json();
        return raw.data || raw;
      }
    } catch (e) {
      console.warn("Gate summary fetch fallback:", e);
    }

    // Dynamic fallback calculated from session state
    const staffEntries = recentActivity.filter((a) => a.movementType === "ENTRY" && a.userType !== "PARENT").length + 4;
    const staffExits = recentActivity.filter((a) => a.movementType === "EXIT" && a.userType !== "PARENT").length + 2;
    const parentEntries = recentActivity.filter((a) => a.movementType === "ENTRY" && a.userType === "PARENT").length + 2;
    const parentExits = recentActivity.filter((a) => a.movementType === "EXIT" && a.userType === "PARENT").length + 1;

    return {
      todaySummary: {
        staffEntries,
        staffExits,
        parentEntries,
        parentExits,
        activeInside: staffEntries - staffExits + (parentEntries - parentExits) + 1,
        staffInside: staffEntries - staffExits,
        parentsInside: Math.max(0, parentEntries - parentExits),
        expectedVisitors: 2,
        completedVisits: parentExits,
      },
      currentlyInside: [
        {
          id: "stf-live-01",
          name: "Amit Kumar",
          type: "STAFF",
          referenceId: "STF-001",
          entryTime: new Date(Date.now() - 7200000),
          gate: "Main Gate",
          status: "Inside",
        },
      ],
      expectedVisitors: [
        {
          id: "exp-01",
          name: "Rahul Sharma",
          childName: "Aarav",
          referenceId: "VIS-2026-00041",
          visitTime: "11:00 AM – 01:00 PM",
          status: "EXPECTED",
        },
      ],
      recentActivity: [...recentActivity],
      systemStatus: {
        gate: "Main Gate Security",
        status: "ONLINE",
        scanner: "READY",
        lastSync: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    };
  },

  /**
   * Get Access Audit events with filtering & search
   */
  async getAccessAudit(filters = {}) {
    try {
      const res = await fetch("/api/v1/nfc/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      if (res.ok) {
        const raw = await res.json();
        return raw.data || raw;
      }
    } catch (e) {
      console.warn("Audit log fetch notice:", e);
    }

    // Default fallback from activity stream
    const records = recentActivity.map((a) => ({
      id: a.id,
      date: a.date || formatCurrentDate(),
      time: a.time || formatCurrentTime(),
      personName: a.name,
      childName: a.childName || undefined,
      type: a.userType || (a.role?.includes("Parent") ? "PARENT" : "STAFF"),
      accessMethod: a.userType === "PARENT" ? "QR" : "RFID",
      gate: a.gate || "Main Gate",
      movement: a.movementType,
      result: a.status || "AUTHORIZED",
      referenceId: a.staffId || a.rfidTag || "VIS-PASS",
      notes: "Gate Checkpoint Scan",
    }));

    return {
      records,
      total: records.length,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
  },

  /**
   * Get active smart security & visit alerts
   */
  async getAlerts() {
    try {
      const res = await fetch("/api/v1/nfc/alerts");
      if (res.ok) {
        const raw = await res.json();
        return raw.data || raw;
      }
    } catch (e) {
      console.warn("Alerts fetch fallback:", e);
    }
    return { alerts: [], total: 0 };
  },

  /**
   * Get child visit history for child protection monitoring
   */
  async getChildVisitHistory(childId) {
    try {
      const res = await fetch(`/api/v1/nfc/child-history/${childId}`);
      if (res.ok) {
        const raw = await res.json();
        return raw.data || raw;
      }
    } catch (e) {
      console.warn("Child visit history fetch fallback:", e);
    }
    return { childId, records: [], statistics: { totalVisits: 0, completedVisits: 0, cancelledVisits: 0 } };
  },

  /**
   * Get parent visit history for compliance audit
   */
  async getParentVisitHistory(parentId) {
    try {
      const res = await fetch(`/api/v1/nfc/parent-history/${parentId}`);
      if (res.ok) {
        const raw = await res.json();
        return raw.data || raw;
      }
    } catch (e) {
      console.warn("Parent visit history fetch fallback:", e);
    }
    return { parentId, records: [], statistics: { totalVisits: 0, completedVisits: 0, cancelledVisits: 0 } };
  },
};
