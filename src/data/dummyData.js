import {
  FiActivity,
  FiAlertTriangle,
  FiBriefcase,
  FiCamera,
  FiCalendar,
  FiFileText,
  FiHeart,
  FiHome,
  FiMessageCircle,
  FiPlusCircle,
  FiSettings,
  FiShield,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiPackage
} from "react-icons/fi";

export const users = [
  {
    id: 1,
    name: "Aarav Sharma",
    email: "admin@safety.gov",
    password: "admin123",
    role: "admin",
    department: "Child Welfare Directorate",
    avatar: "AS"
  },
  {
    id: 2,
    name: "Meera Nair",
    email: "parent@example.com",
    password: "parent123",
    role: "parent",
    department: "Registered Guardian",
    avatar: "MN"
  },
  {
    id: 3,
    name: "Rohan Verma",
    email: "orphanage@example.com",
    password: "orphanage123",
    role: "orphanage",
    department: "Sunrise Care Home",
    avatar: "RV"
  }
];

export const stats = [
  { label: "Registered Children", value: "1,248", trend: "+8.2%", icon: FiUsers, tone: "blue" },
  { label: "Safe Zones Online", value: "42", trend: "+3", icon: FiShield, tone: "green" },
  { label: "Active Orphanages", value: "18", trend: "+2", icon: FiHome, tone: "amber" },
  { label: "Critical Alerts", value: "7", trend: "-4", icon: FiAlertTriangle, tone: "red" }
];

export const children = [
  {
    id: "CH-1021",
    name: "Ishaan Roy",
    age: 9,
    gender: "Male",
    bloodGroup: "B+",
    orphanage: "Sunrise Care Home",
    risk: "Low",
    health: "Stable",
    attendance: 96,
    admissionDate: "2021-04-12",
    caseWorker: "Neha Kapoor",
    educationLevel: "Class 4",
    medicalHistory: "Seasonal asthma, inhaler advised during winter.",
    medicalHistoryFile: "CH-1021-medical-history.pdf",
    vaccinationStatus: "Up to date",
    allergies: "Dust allergy",
    emergencyContact: "Sunrise Care Home Office, +91 98765 11021",
    adopted: false
  },
  {
    id: "CH-1034",
    name: "Anaya Das",
    age: 12,
    gender: "Female",
    bloodGroup: "O+",
    orphanage: "Hope Nest",
    risk: "Medium",
    health: "Observation",
    attendance: 89,
    admissionDate: "2020-09-03",
    caseWorker: "Priya Menon",
    educationLevel: "Class 7",
    medicalHistory: "Mild anemia under nutrition follow-up.",
    medicalHistoryFile: "CH-1034-medical-history.pdf",
    vaccinationStatus: "Up to date",
    allergies: "None recorded",
    emergencyContact: "Hope Nest Welfare Desk, +91 98765 11034",
    adopted: true,
    adoptionDate: "2025-02-18",
    parentDetails: {
      id: "PAR-1034",
      fatherName: "Sourav Das",
      fatherPhone: "+91 98765 21034",
      fatherAadhaar: "XXXX-XXXX-1034",
      fatherOccupation: "School Teacher",
      motherName: "Mitali Das",
      motherPhone: "+91 98765 21035",
      motherAadhaar: "XXXX-XXXX-2034",
      motherOccupation: "Nurse",
      financialCondition: "Stable middle-income household with verified monthly income.",
      hasAnotherChild: true,
      otherChildStatus: "Own child",
      otherChildDetails: "One biological daughter, age 6.",
      adoptionReason: "Family wanted to provide long-term care and education support to a child.",
      voterId: "VTR-XXXX-1034",
      email: "das.family@example.com",
      address: "Civil Lines, Jaipur",
      adoptionOrderId: "ADP-2025-018",
      followUpOfficer: "Ritika Sharma",
      homeStudyStatus: "Approved",
      policeVerification: "Completed",
      postAdoptionFollowUp: "Quarterly welfare visits scheduled through 2027."
    }
  },
  {
    id: "CH-1057",
    name: "Kabir Khan",
    age: 7,
    gender: "Male",
    bloodGroup: "A+",
    orphanage: "Little Steps",
    risk: "Low",
    health: "Stable",
    attendance: 98,
    admissionDate: "2022-01-21",
    caseWorker: "Amit Sinha",
    educationLevel: "Class 2",
    medicalHistory: "No chronic conditions recorded.",
    medicalHistoryFile: "CH-1057-medical-history.pdf",
    vaccinationStatus: "Up to date",
    allergies: "None recorded",
    emergencyContact: "Little Steps Care Desk, +91 98765 11057",
    adopted: false
  },
  {
    id: "CH-1088",
    name: "Sara Ali",
    age: 11,
    gender: "Female",
    bloodGroup: "AB+",
    orphanage: "Sunrise Care Home",
    risk: "High",
    health: "Needs Review",
    attendance: 78,
    admissionDate: "2019-11-08",
    caseWorker: "Neha Kapoor",
    educationLevel: "Class 6",
    medicalHistory: "Recurring migraine and recent counseling referral.",
    medicalHistoryFile: "CH-1088-medical-history.pdf",
    vaccinationStatus: "Booster pending",
    allergies: "Peanuts",
    emergencyContact: "Sunrise Care Home Office, +91 98765 11088",
    adopted: false
  },
  {
    id: "CH-1102",
    name: "Vihaan Sen",
    age: 10,
    gender: "Male",
    bloodGroup: "O-",
    orphanage: "Care Bridge",
    risk: "Medium",
    health: "Stable",
    attendance: 84,
    admissionDate: "2021-07-17",
    caseWorker: "Karan Joshi",
    educationLevel: "Class 5",
    medicalHistory: "Corrective spectacles prescribed.",
    medicalHistoryFile: "CH-1102-medical-history.pdf",
    vaccinationStatus: "Up to date",
    allergies: "None recorded",
    emergencyContact: "Care Bridge Office, +91 98765 11102",
    adopted: true,
    adoptionDate: "2024-12-06",
    parentDetails: {
      id: "PAR-1102",
      fatherName: "Arjun Sen",
      fatherPhone: "+91 98765 21102",
      fatherAadhaar: "XXXX-XXXX-1102",
      fatherOccupation: "Bank Manager",
      motherName: "Nisha Sen",
      motherPhone: "+91 98765 21103",
      motherAadhaar: "XXXX-XXXX-2102",
      motherOccupation: "Small Business Owner",
      financialCondition: "Financially secure, verified savings and regular income.",
      hasAnotherChild: false,
      otherChildStatus: "No other child",
      otherChildDetails: "No other children in the household.",
      adoptionReason: "The parents completed counseling and chose adoption to build their family.",
      voterId: "VTR-XXXX-1102",
      email: "sen.family@example.com",
      address: "Arera Colony, Bhopal",
      adoptionOrderId: "ADP-2024-102",
      followUpOfficer: "Karan Joshi",
      homeStudyStatus: "Approved",
      policeVerification: "Completed",
      postAdoptionFollowUp: "Monthly follow-up for the first six months, then quarterly."
    }
  },
  {
    id: "CH-1145",
    name: "Riya Patel",
    age: 8,
    gender: "Female",
    bloodGroup: "A-",
    orphanage: "Hope Nest",
    risk: "Low",
    health: "Stable",
    attendance: 94,
    admissionDate: "2022-05-28",
    caseWorker: "Priya Menon",
    educationLevel: "Class 3",
    medicalHistory: "Recovered from wrist fracture in 2024.",
    medicalHistoryFile: "CH-1145-medical-history.pdf",
    vaccinationStatus: "Up to date",
    allergies: "None recorded",
    emergencyContact: "Hope Nest Welfare Desk, +91 98765 11145",
    adopted: false
  }
];

export const orphanages = [
  {
    id: "ORP-001",
    name: "Sunrise Care Home",
    registrationNumber: "REG-DL-2012-0148",
    governmentLicenseNumber: "GOV-CW-DEL-4892",
    establishmentDate: "2012-06-18",
    organizationType: "NGO",
    numberOfChildren: 164,
    totalAdmissions: 238,
    capacity: 180,
    officialEmail: "office@sunrisecare.org",
    phone: "+91 98765 40001",
    alternativeContact: "+91 98765 40002",
    website: "https://sunrisecare.example.org",
    country: "India",
    state: "Delhi",
    district: "South Delhi",
    city: "Delhi",
    fullAddress: "21 Welfare Road, Saket, New Delhi",
    pinCode: "110017",
    administrator: {
      name: "Rohan Verma",
      designation: "Home Administrator",
      mobile: "+91 98765 40003",
      email: "orphanage@example.com",
      profilePhoto: "rohan-verma-profile.jpg"
    },
    kyc: {
      registrationCertificate: "sunrise-registration-certificate.pdf",
      ngoCertificate: "sunrise-ngo-certificate.pdf",
      governmentLicense: "sunrise-government-license.pdf",
      administratorIdProof: "rohan-verma-id-proof.pdf",
      panCard: "SUNRISE-pan-card.pdf",
      gstNumber: "07SUNRISE1234Z1Z",
      addressProof: "sunrise-address-proof.pdf"
    },
    childSummary: {
      totalBoys: 91,
      totalGirls: 73,
      below5: 24,
      age5To12: 96,
      above12: 44,
      specialNeeds: 12
    },
    staff: {
      totalStaff: 46,
      caretakers: 20,
      teachers: 8,
      medicalStaff: 5,
      securityGuards: 6,
      volunteers: 7
    },
    facilities: [
      "Medical Room",
      "CCTV Surveillance",
      "School",
      "Playground",
      "Library",
      "Computer Lab",
      "Dining Hall",
      "Dormitory",
      "Security Guards",
      "Biometric Attendance"
    ],
    emergencyContact: {
      contactPerson: "Anita Rao",
      mobile: "+91 98765 40004",
      email: "emergency@sunrisecare.org",
      relationship: "Emergency Response Officer"
    },
    aiSafety: {
      faceRecognitionEnabled: "Yes",
      cctvInstalled: "Yes",
      numberOfCameras: 38,
      visitorFaceVerificationEnabled: "Yes",
      childAttendanceSystem: "Biometric and face recognition",
      gpsTrackingAvailable: "Yes",
      emergencyAlertSystemEnabled: "Yes"
    },
    bankDetails: {
      bankName: "State Bank of India",
      accountHolderName: "Sunrise Care Home",
      accountNumber: "XXXXXX4482",
      ifscCode: "SBIN0001482"
    },
    occupancy: 164,
    compliance: 94
  },
  { id: "ORP-002", name: "Hope Nest", city: "Jaipur", capacity: 120, occupancy: 101, compliance: 91, totalAdmissions: 176 },
  { id: "ORP-003", name: "Little Steps", city: "Lucknow", capacity: 90, occupancy: 86, compliance: 88, totalAdmissions: 129 },
  { id: "ORP-004", name: "Care Bridge", city: "Bhopal", capacity: 130, occupancy: 119, compliance: 96, totalAdmissions: 158 }
];

export const activityFeed = [
  { label: "Guardian visit verified", value: 32 },
  { label: "Health checks", value: 76 },
  { label: "Education updates", value: 58 },
  { label: "Safety inspections", value: 44 }
];

export const monthlySafety = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Safety Score",
      data: [82, 85, 87, 89, 91, 94],
      borderColor: "#1c74d8",
      backgroundColor: "rgba(28, 116, 216, 0.14)",
      tension: 0.4,
      fill: true
    },
    {
      label: "Compliance",
      data: [78, 81, 84, 86, 88, 92],
      borderColor: "#0f9f6e",
      backgroundColor: "rgba(15, 159, 110, 0.12)",
      tension: 0.4,
      fill: true
    }
  ]
};

export const riskDistribution = {
  labels: ["Low", "Medium", "High"],
  datasets: [
    {
      data: [68, 24, 8],
      backgroundColor: ["#0f9f6e", "#f59e0b", "#dc2626"],
      borderWidth: 0
    }
  ]
};

export const adminNav = [
  { label: "Dashboard", path: "/admin", icon: FiActivity },
  { label: "Children", path: "/admin/children", icon: FiUsers },
  { label: "Parent Verification", path: "/admin/parent-verification", icon: FiUserCheck },
  { label: "Register Orphanage", path: "/admin/register-orphanage", icon: FiHome },
  { label: "Orphanages", path: "/admin/orphanages", icon: FiHome },
  { label: "Staff Management", path: "/admin/staff", icon: FiBriefcase },
  { label: "Alerts", path: "/admin/alerts", icon: FiAlertTriangle },
  { label: "System Settings", path: "/admin/settings", icon: FiSettings },
  { label: "Profile", path: "/admin/profile", icon: FiUser }
];

export const parentNav = [
  { label: "Dashboard", path: "/parent", icon: FiActivity },
  { label: "Sahayak AI", path: "/parent/sahayak-ai", icon: FiMessageCircle },
  { label: "KYC Verification", path: "/parent/kyc", icon: FiShield },
  { label: "Profile", path: "/parent/profile", icon: FiUser },
  { label: "Visit Request", path: "/parent/visit-request", icon: FiCalendar },
  { label: "Child Welfare Follow-up", path: "/parent/child-welfare-follow-up-session", icon: FiHeart },
  { label: "Notifications", path: "/parent/notifications", icon: FiAlertTriangle }
];

export const orphanageNav = [
  { label: "Dashboard",          path: "/orphanage",                    icon: FiActivity },
  { label: "AI Attendance",      path: "/orphanage/ai-attendance",      icon: FiCamera },
  { label: "Visit Requests",     path: "/orphanage/visit-requests",     icon: FiCalendar },
  { label: "Donations",           path: "/orphanage/donation-requests",  icon: FiPackage },
  { label: "Children",           path: "/orphanage/children",           icon: FiUsers },
  { label: "Register Child",     path: "/orphanage/register-child",     icon: FiPlusCircle },
  { label: "Staff Management",   path: "/orphanage/staff",              icon: FiBriefcase },
  { label: "Adoption Management", path: "/orphanage/adoption-management", icon: FiFileText },
  { label: "Health Monitoring",  path: "/orphanage/health-monitoring",  icon: FiHeart },
  { label: "Reports",            path: "/orphanage/reports",            icon: FiShield },
  { label: "Profile",            path: "/orphanage/profile",            icon: FiUser }
];

/* ─── Health Monitoring Data ──────────────────────────────── */

export const healthRecords = [
  {
    childId: "CH-1021",
    childName: "Ishaan Roy",
    age: 9,
    gender: "Male",
    bloodGroup: "B+",
    height: "132 cm",
    weight: "28 kg",
    bmi: "16.1",
    lastCheckup: "2026-05-14",
    nextCheckup: "2026-08-14",
    healthStatus: "Healthy",
    doctor: "Dr. Priya Sharma",
    allergies: "Dust allergy",
    conditions: "Seasonal asthma",
    medications: "Salbutamol inhaler (as needed)",
    emergencyContact: "+91 98765 11021",
    vaccinationStatus: "Up to date",
    vaccinations: [
      { name: "BCG",        dateGiven: "2017-03-10", nextDue: null,         status: "Completed" },
      { name: "Hepatitis B",dateGiven: "2017-03-10", nextDue: null,         status: "Completed" },
      { name: "OPV",        dateGiven: "2019-06-20", nextDue: null,         status: "Completed" },
      { name: "MMR",        dateGiven: "2021-04-15", nextDue: null,         status: "Completed" },
      { name: "Typhoid",    dateGiven: "2024-01-10", nextDue: "2026-01-10", status: "Completed" },
      { name: "Influenza",  dateGiven: "2025-11-05", nextDue: "2026-11-05", status: "Pending"   }
    ],
    healthHistory: [
      { date: "2026-05-14", doctor: "Dr. Priya Sharma", diagnosis: "Routine checkup",     treatment: "General health assessment",        notes: "Good overall health. Inhaler refilled." },
      { date: "2026-01-22", doctor: "Dr. Priya Sharma", diagnosis: "Mild asthma episode", treatment: "Nebulisation + inhaler prescribed", notes: "Recovered within 2 days. Monitor in winter." },
      { date: "2025-08-10", doctor: "Dr. Rajan Mehta",  diagnosis: "Routine checkup",     treatment: "Vitamin D supplementation advised", notes: "Slightly low vitamin D levels." }
    ]
  },
  {
    childId: "CH-1088",
    childName: "Sara Ali",
    age: 11,
    gender: "Female",
    bloodGroup: "AB+",
    height: "142 cm",
    weight: "34 kg",
    bmi: "16.9",
    lastCheckup: "2026-04-02",
    nextCheckup: "2026-07-02",
    healthStatus: "Under Observation",
    doctor: "Dr. Neha Kapoor",
    allergies: "Peanuts",
    conditions: "Recurring migraine",
    medications: "Paracetamol 250mg (as needed), counselling sessions",
    emergencyContact: "+91 98765 11088",
    vaccinationStatus: "Booster pending",
    vaccinations: [
      { name: "BCG",        dateGiven: "2015-02-14", nextDue: null,         status: "Completed" },
      { name: "Hepatitis B",dateGiven: "2015-02-14", nextDue: null,         status: "Completed" },
      { name: "MMR",        dateGiven: "2018-09-01", nextDue: null,         status: "Completed" },
      { name: "Typhoid",    dateGiven: "2022-03-18", nextDue: "2024-03-18", status: "Overdue"   },
      { name: "Td Booster", dateGiven: null,         nextDue: "2026-06-15", status: "Pending"   },
      { name: "Influenza",  dateGiven: "2025-10-20", nextDue: "2026-10-20", status: "Pending"   }
    ],
    healthHistory: [
      { date: "2026-04-02", doctor: "Dr. Neha Kapoor",  diagnosis: "Migraine follow-up", treatment: "Counselling referred, medication adjusted", notes: "Headache frequency reduced. Stress management ongoing." },
      { date: "2026-02-14", doctor: "Dr. Neha Kapoor",  diagnosis: "Severe headache",    treatment: "Paracetamol administered",                  notes: "Peanut exposure confirmed as trigger. Allergy card issued." },
      { date: "2025-10-30", doctor: "Dr. Rajan Mehta",  diagnosis: "Routine checkup",    treatment: "Iron supplement advised",                   notes: "Mild anaemia detected. Follow-up in 3 months." }
    ]
  },
  {
    childId: "CH-1057",
    childName: "Kabir Khan",
    age: 7,
    gender: "Male",
    bloodGroup: "A+",
    height: "118 cm",
    weight: "21 kg",
    bmi: "15.1",
    lastCheckup: "2026-06-01",
    nextCheckup: "2026-09-01",
    healthStatus: "Healthy",
    doctor: "Dr. Amit Sinha",
    allergies: "None recorded",
    conditions: "No chronic conditions",
    medications: "None",
    emergencyContact: "+91 98765 11057",
    vaccinationStatus: "Up to date",
    vaccinations: [
      { name: "BCG",        dateGiven: "2019-05-10", nextDue: null,         status: "Completed" },
      { name: "Hepatitis B",dateGiven: "2019-05-10", nextDue: null,         status: "Completed" },
      { name: "OPV",        dateGiven: "2021-02-14", nextDue: null,         status: "Completed" },
      { name: "MMR",        dateGiven: "2022-08-20", nextDue: null,         status: "Completed" },
      { name: "Typhoid",    dateGiven: "2025-04-05", nextDue: "2027-04-05", status: "Completed" },
      { name: "Influenza",  dateGiven: "2025-12-01", nextDue: "2026-12-01", status: "Pending"   }
    ],
    healthHistory: [
      { date: "2026-06-01", doctor: "Dr. Amit Sinha",  diagnosis: "Routine checkup",    treatment: "General assessment, no concerns",  notes: "Excellent health. Weight on track for age." },
      { date: "2025-12-10", doctor: "Dr. Amit Sinha",  diagnosis: "Routine checkup",    treatment: "Calcium supplement recommended",   notes: "Growing well. Dental check suggested next visit." },
      { date: "2025-06-18", doctor: "Dr. Rajan Mehta", diagnosis: "Fever — viral",      treatment: "Paracetamol, rest and hydration",  notes: "Recovered fully within 5 days." }
    ]
  },
  {
    childId: "CH-1034",
    childName: "Anaya Das",
    age: 12,
    gender: "Female",
    bloodGroup: "O+",
    height: "148 cm",
    weight: "38 kg",
    bmi: "17.3",
    lastCheckup: "2026-03-18",
    nextCheckup: "2026-06-18",
    healthStatus: "Under Observation",
    doctor: "Dr. Priya Menon",
    allergies: "None recorded",
    conditions: "Mild anaemia under nutrition follow-up",
    medications: "Ferrous sulphate tablet (daily), multivitamin",
    emergencyContact: "+91 98765 11034",
    vaccinationStatus: "Up to date",
    vaccinations: [
      { name: "BCG",        dateGiven: "2014-04-12", nextDue: null,         status: "Completed" },
      { name: "Hepatitis B",dateGiven: "2014-04-12", nextDue: null,         status: "Completed" },
      { name: "MMR",        dateGiven: "2017-10-05", nextDue: null,         status: "Completed" },
      { name: "OPV",        dateGiven: "2016-07-22", nextDue: null,         status: "Completed" },
      { name: "Typhoid",    dateGiven: "2023-09-14", nextDue: "2025-09-14", status: "Overdue"   },
      { name: "Td Booster", dateGiven: null,         nextDue: "2026-08-01", status: "Pending"   }
    ],
    healthHistory: [
      { date: "2026-03-18", doctor: "Dr. Priya Menon",  diagnosis: "Anaemia follow-up",  treatment: "Continued iron therapy, diet chart revised", notes: "Haemoglobin improving — 10.2 g/dL from 9.4." },
      { date: "2025-12-05", doctor: "Dr. Priya Menon",  diagnosis: "Routine checkup",    treatment: "Iron supplement started",                   notes: "Low haemoglobin detected — 9.4 g/dL. Nutrition plan issued." },
      { date: "2025-07-20", doctor: "Dr. Rajan Mehta",  diagnosis: "Routine checkup",    treatment: "General health assessment",                 notes: "All vitals normal. Growth on expected curve." }
    ]
  },
  {
    childId: "CH-1102",
    childName: "Vihaan Sen",
    age: 10,
    gender: "Male",
    bloodGroup: "O-",
    height: "138 cm",
    weight: "30 kg",
    bmi: "15.7",
    lastCheckup: "2026-04-25",
    nextCheckup: "2026-07-25",
    healthStatus: "Healthy",
    doctor: "Dr. Karan Joshi",
    allergies: "None recorded",
    conditions: "Corrective spectacles prescribed (myopia)",
    medications: "None",
    emergencyContact: "+91 98765 11102",
    vaccinationStatus: "Up to date",
    vaccinations: [
      { name: "BCG",        dateGiven: "2016-08-03", nextDue: null,         status: "Completed" },
      { name: "Hepatitis B",dateGiven: "2016-08-03", nextDue: null,         status: "Completed" },
      { name: "OPV",        dateGiven: "2018-11-11", nextDue: null,         status: "Completed" },
      { name: "MMR",        dateGiven: "2020-03-28", nextDue: null,         status: "Completed" },
      { name: "Typhoid",    dateGiven: "2024-06-10", nextDue: "2026-06-10", status: "Completed" },
      { name: "Influenza",  dateGiven: "2025-10-15", nextDue: "2026-10-15", status: "Pending"   }
    ],
    healthHistory: [
      { date: "2026-04-25", doctor: "Dr. Karan Joshi",  diagnosis: "Eye follow-up",      treatment: "New spectacle prescription (–1.5D both eyes)", notes: "Vision stable. Review in 6 months." },
      { date: "2025-11-12", doctor: "Dr. Karan Joshi",  diagnosis: "Routine checkup",    treatment: "Spectacles advised for the first time",        notes: "Myopia detected during school screening. Mild case." },
      { date: "2025-05-08", doctor: "Dr. Priya Sharma", diagnosis: "Routine checkup",    treatment: "General health assessment",                    notes: "All parameters within normal range." }
    ]
  },
  {
    childId: "CH-1145",
    childName: "Riya Patel",
    age: 8,
    gender: "Female",
    bloodGroup: "A-",
    height: "124 cm",
    weight: "23 kg",
    bmi: "14.9",
    lastCheckup: "2026-05-30",
    nextCheckup: "2026-08-30",
    healthStatus: "Healthy",
    doctor: "Dr. Priya Menon",
    allergies: "None recorded",
    conditions: "Fully recovered from wrist fracture (2024)",
    medications: "Calcium supplement (completed course)",
    emergencyContact: "+91 98765 11145",
    vaccinationStatus: "Up to date",
    vaccinations: [
      { name: "BCG",        dateGiven: "2018-06-14", nextDue: null,         status: "Completed" },
      { name: "Hepatitis B",dateGiven: "2018-06-14", nextDue: null,         status: "Completed" },
      { name: "OPV",        dateGiven: "2020-09-09", nextDue: null,         status: "Completed" },
      { name: "MMR",        dateGiven: "2021-12-20", nextDue: null,         status: "Completed" },
      { name: "Typhoid",    dateGiven: "2024-11-03", nextDue: "2026-11-03", status: "Completed" },
      { name: "Influenza",  dateGiven: "2025-11-20", nextDue: "2026-11-20", status: "Pending"   }
    ],
    healthHistory: [
      { date: "2026-05-30", doctor: "Dr. Priya Menon",  diagnosis: "Routine checkup",     treatment: "General assessment, calcium course ended",   notes: "Wrist fully healed. No further orthopaedic follow-up needed." },
      { date: "2024-09-15", doctor: "Dr. Rajan Mehta",  diagnosis: "Wrist fracture",      treatment: "Plaster cast, calcium + vitamin D course",   notes: "Left distal radius fracture. Cast removed after 5 weeks." },
      { date: "2024-06-10", doctor: "Dr. Priya Menon",  diagnosis: "Routine checkup",     treatment: "General health assessment",                  notes: "All vitals normal. Good growth trajectory." }
    ]
  }
];

export const healthSummary = {
  totalChildren: 6,
  checkupsDue: 3,
  overdueCheckups: 1,
  vaccinationsDue: 6,
  healthyChildren: 4
};
