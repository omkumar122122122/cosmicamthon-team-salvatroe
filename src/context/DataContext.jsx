import { createContext, useContext, useMemo, useState } from "react";
import { readDatabase, resetDatabase, writeDatabase } from "../services/mockBackend";

const DataContext = createContext(null);

function createChildRecord(values, user, orphanage) {
  const admissionDate = values.admissionDate || new Date().toISOString().slice(0, 10);
  const health = values.health || values.medicalCondition || "Stable";

  return {
    id: values.id,
    name: values.name,
    age: Number(values.age),
    gender: values.gender,
    bloodGroup: values.bloodGroup,
    orphanageId: orphanage.id,
    orphanage: orphanage.name,
    risk: values.risk,
    health,
    attendance: Number(values.attendance ?? 90),
    admissionDate,
    caseWorker: values.caseWorker || user?.name || "Assigned Welfare Officer",
    educationLevel: values.educationLevel || "Not assigned",
    medicalHistory: values.medicalHistory || values.medicalCondition || "Initial medical review pending.",
    medicalHistoryFile: values.medicalHistoryFile || `${values.id}-medical-history.pdf`,
    vaccinationStatus: values.vaccinationStatus || "Pending review",
    allergies: values.allergies || "None recorded",
    emergencyContact: values.emergencyContact || `${orphanage.name} Office, ${orphanage.phone ?? "Not provided"}`,
    adopted: false,
    foundCondition: values.foundCondition,
    foundLocation: values.foundLocation,
    identificationMarks: values.identificationMarks,
    notes: values.notes,
    photoName: values.photoName,
    registeredBy: user?.name,
    createdAt: new Date().toISOString()
  };
}

function fileName(value, fallback) {
  return value?.[0]?.name || fallback;
}

function createOrphanageRecord(values, nextIndex) {
  const id = `ORP-${String(nextIndex).padStart(3, "0")}`;
  const numberOfChildren = Number(values.numberOfChildren || 0);
  const capacity = Number(values.capacity || 0);

  return {
    id,
    name: values.name,
    registrationNumber: values.registrationNumber,
    governmentLicenseNumber: values.governmentLicenseNumber,
    establishmentDate: values.establishmentDate,
    organizationType: values.organizationType,
    numberOfChildren,
    totalAdmissions: numberOfChildren,
    capacity,
    occupancy: numberOfChildren,
    officialEmail: values.officialEmail,
    phone: values.phone,
    alternativeContact: values.alternativeContact,
    website: values.website,
    country: values.country,
    state: values.state,
    district: values.district,
    city: values.city,
    fullAddress: values.fullAddress,
    pinCode: values.pinCode,
    compliance: 86,
    administrator: {
      name: values.administratorName,
      designation: values.designation,
      mobile: values.mobile,
      email: values.administratorEmail,
      profilePhoto: fileName(values.profilePhoto, "administrator-profile.jpg")
    },
    kyc: {
      registrationCertificate: fileName(values.registrationCertificate, "registration-certificate.pdf"),
      ngoCertificate: fileName(values.ngoCertificate, "ngo-certificate.pdf"),
      governmentLicense: fileName(values.governmentLicense, "government-license.pdf"),
      administratorIdProof: fileName(values.administratorIdProof, "administrator-id-proof.pdf"),
      panCard: fileName(values.panCard, "organization-pan-card.pdf"),
      gstNumber: values.gstNumber,
      addressProof: fileName(values.addressProof, "address-proof.pdf")
    },
    childSummary: {
      totalBoys: Number(values.totalBoys || 0),
      totalGirls: Number(values.totalGirls || 0),
      below5: Number(values.below5 || 0),
      age5To12: Number(values.age5To12 || 0),
      above12: Number(values.above12 || 0),
      specialNeeds: Number(values.specialNeeds || 0)
    },
    staff: {
      totalStaff: Number(values.totalStaff || 0),
      caretakers: Number(values.caretakers || 0),
      teachers: Number(values.teachers || 0),
      medicalStaff: Number(values.medicalStaff || 0),
      securityGuards: Number(values.securityGuards || 0),
      volunteers: Number(values.volunteers || 0)
    },
    facilities: Array.isArray(values.facilities) ? values.facilities : values.facilities ? [values.facilities] : [],
    emergencyContact: {
      contactPerson: values.emergencyContactPerson,
      mobile: values.emergencyMobile,
      email: values.emergencyEmail,
      relationship: values.emergencyRelationship
    },
    aiSafety: {
      faceRecognitionEnabled: values.faceRecognitionEnabled,
      cctvInstalled: values.cctvInstalled,
      numberOfCameras: Number(values.numberOfCameras || 0),
      visitorFaceVerificationEnabled: values.visitorFaceVerificationEnabled,
      childAttendanceSystem: values.childAttendanceSystem,
      gpsTrackingAvailable: values.gpsTrackingAvailable,
      emergencyAlertSystemEnabled: values.emergencyAlertSystemEnabled
    },
    bankDetails: {
      bankName: values.bankName,
      accountHolderName: values.accountHolderName,
      accountNumber: values.accountNumber,
      ifscCode: values.ifscCode
    },
    createdAt: new Date().toISOString()
  };
}

export function DataProvider({ children }) {
  const [database, setDatabase] = useState(() => readDatabase());

  const commit = (updater) => {
    let nextDatabase;
    setDatabase((current) => {
      nextDatabase = typeof updater === "function" ? updater(current) : updater;
      writeDatabase(nextDatabase);
      return nextDatabase;
    });
    return nextDatabase;
  };

  const addChild = (values, user) => {
    const orphanage = database.orphanages.find((home) => home.id === values.orphanageId || home.name === values.orphanage);
    if (!orphanage) {
      throw new Error("Selected orphanage does not exist.");
    }

    const child = createChildRecord(values, user, orphanage);

    commit((current) => ({
      ...current,
      children: [child, ...current.children],
      orphanages: current.orphanages.map((home) =>
        home.id === orphanage.id
          ? {
              ...home,
              occupancy: Number(home.occupancy || 0) + 1,
              numberOfChildren: Number(home.numberOfChildren || home.occupancy || 0) + 1,
              totalAdmissions: Number(home.totalAdmissions || home.occupancy || 0) + 1
            }
          : home
      )
    }));

    return child;
  };

  const addOrphanage = (values) => {
    const orphanage = createOrphanageRecord(values, database.orphanages.length + 1);

    commit((current) => ({
      ...current,
      orphanages: [orphanage, ...current.orphanages]
    }));

    return orphanage;
  };

  const getVisibleChildren = (user) => {
    if (user?.role === "orphanage") {
      return database.children.filter((child) => child.orphanageId === user.orphanageId || child.orphanage === user.department);
    }

    if (user?.role === "parent") {
      const child = database.children.find((item) => item.id === user.linkedChildId || item.parentDetails?.id === user.parentId);
      return child ? [child] : [];
    }

    return database.children;
  };

  const getLinkedChildForParent = (user) =>
    database.children.find((child) => child.id === user?.linkedChildId || child.parentDetails?.id === user?.parentId) ?? database.children.find((child) => child.adopted);

  const getOrphanageForUser = (user) => database.orphanages.find((home) => home.id === user?.orphanageId || home.name === user?.department);

  const resetMockDatabase = () => {
    const seed = resetDatabase();
    setDatabase(seed);
    return seed;
  };

  const value = useMemo(
    () => ({
      ...database,
      addChild,
      addOrphanage,
      getVisibleChildren,
      getLinkedChildForParent,
      getOrphanageForUser,
      resetMockDatabase
    }),
    [database]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
}
