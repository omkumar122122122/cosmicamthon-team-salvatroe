/**
 * rfidDummyData.js
 * Mock data source for Velora RFID Staff Movement & Verification Demo.
 * 
 * Designed to be easily replaced by backend API endpoints in future phases.
 */

export const mockRFIDRecords = [
  {
    rfidTag: "RFID-STF-001",
    staffId: "STF-001",
    name: "Rahul Sharma",
    role: "Staff",
    rfidStatus: "Active",
    accessType: "Entry",
    gate: "Main Gate",
    date: "22 August 2026",
    time: "09:42 PM",
    accessStatus: "Authorized",
    department: "Child Care & Welfare",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  },
  {
    rfidTag: "RFID-STF-002",
    staffId: "STF-002",
    name: "Amit Kumar",
    role: "Staff",
    rfidStatus: "Active",
    accessType: "Exit",
    gate: "Main Gate",
    date: "22 August 2026",
    time: "06:13 PM",
    accessStatus: "Authorized",
    department: "Security & Safety",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  },
  {
    rfidTag: "RFID-STF-003",
    staffId: "STF-003",
    name: "Priya Singh",
    role: "Staff",
    rfidStatus: "Active",
    accessType: "Entry",
    gate: "Staff Gate",
    date: "22 August 2026",
    time: "09:25 AM",
    accessStatus: "Authorized",
    department: "Medical & Health Care",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  },
];
