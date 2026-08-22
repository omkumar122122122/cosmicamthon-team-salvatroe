import {
  children as seedChildren,
  healthRecords,
  healthSummary,
  notifications,
  orphanages as seedOrphanages,
  users as seedUsers
} from "../data/dummyData";

const DB_KEY = "child_safety_mock_backend_v1";

function findOrphanageForChild(child, orphanages) {
  return orphanages.find((home) => home.id === child.orphanageId || home.name === child.orphanage) ?? orphanages[0];
}

function normalizeChild(child, orphanages) {
  const orphanage = findOrphanageForChild(child, orphanages);

  return {
    attendance: 90,
    health: child.health ?? child.medicalCondition ?? "Stable",
    caseWorker: child.caseWorker ?? "Assigned Welfare Officer",
    educationLevel: child.educationLevel ?? "Not assigned",
    vaccinationStatus: child.vaccinationStatus ?? "Pending review",
    allergies: child.allergies ?? "None recorded",
    adopted: Boolean(child.adopted),
    createdAt: child.createdAt ?? child.admissionDate ?? new Date().toISOString(),
    ...child,
    age: Number(child.age ?? 0),
    orphanageId: orphanage?.id,
    orphanage: orphanage?.name ?? child.orphanage
  };
}

function normalizeOrphanage(orphanage) {
  return {
    compliance: 88,
    occupancy: Number(orphanage.occupancy ?? orphanage.numberOfChildren ?? 0),
    capacity: Number(orphanage.capacity ?? 0),
    totalAdmissions: Number(orphanage.totalAdmissions ?? orphanage.numberOfChildren ?? 0),
    city: orphanage.city ?? "Not provided",
    facilities: orphanage.facilities ?? [],
    administrator: orphanage.administrator ?? {},
    childSummary: orphanage.childSummary ?? {},
    staff: orphanage.staff ?? {},
    aiSafety: orphanage.aiSafety ?? {},
    bankDetails: orphanage.bankDetails ?? {},
    emergencyContact: orphanage.emergencyContact ?? {},
    ...orphanage
  };
}

function normalizeUser(user, orphanages, children) {
  const orphanage = orphanages.find((home) => home.name === user.department || home.id === user.orphanageId);
  const linkedChild = children.find((child) => child.id === user.linkedChildId || child.parentDetails?.id === user.parentId);

  return {
    ...user,
    orphanageId: user.orphanageId ?? orphanage?.id,
    linkedChildId: user.linkedChildId ?? linkedChild?.id,
    parentId: user.parentId ?? linkedChild?.parentDetails?.id
  };
}

export function createSeedDatabase() {
  const orphanages = seedOrphanages.map(normalizeOrphanage);
  const migratedChildren = JSON.parse(localStorage.getItem("registered_children") || "[]");
  const allChildren = [...migratedChildren, ...seedChildren].reduce((records, child) => {
    if (!records.some((item) => item.id === child.id)) {
      records.push(normalizeChild(child, orphanages));
    }
    return records;
  }, []);

  return {
    version: 1,
    users: seedUsers.map((user) => normalizeUser(user, orphanages, allChildren)),
    children: allChildren,
    orphanages,
    notifications,
    healthRecords,
    healthSummary,
    updatedAt: new Date().toISOString()
  };
}

export function readDatabase() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const seed = createSeedDatabase();
      writeDatabase(seed);
      return seed;
    }

    const parsed = JSON.parse(raw);
    const orphanages = (parsed.orphanages?.length ? parsed.orphanages : seedOrphanages).map(normalizeOrphanage);
    const children = (parsed.children?.length ? parsed.children : seedChildren).map((child) => normalizeChild(child, orphanages));

    return {
      ...parsed,
      users: (parsed.users?.length ? parsed.users : seedUsers).map((user) => normalizeUser(user, orphanages, children)),
      children,
      orphanages,
      notifications: parsed.notifications ?? notifications,
      healthRecords: parsed.healthRecords ?? healthRecords,
      healthSummary: parsed.healthSummary ?? healthSummary
    };
  } catch {
    const seed = createSeedDatabase();
    writeDatabase(seed);
    return seed;
  }
}

export function writeDatabase(database) {
  localStorage.setItem(DB_KEY, JSON.stringify({ ...database, updatedAt: new Date().toISOString() }));
}

export function resetDatabase() {
  const seed = createSeedDatabase();
  writeDatabase(seed);
  return seed;
}
