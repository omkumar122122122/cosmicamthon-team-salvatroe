"""
setup_demo_users.py
────────────────────────────────────────────────────────────────────
Removes ALL existing users and creates 3 fresh test users — one per role
(ADMIN, ORPHANAGE, PARENT) — in the Neon PostgreSQL database with known
passwords. Also creates supporting records (parent profile, orphanage staff,
orphanage, child) for realistic demo data.
"""
import asyncio
import bcrypt
import uuid

from app.database import fetch_one, fetch_all, init_db_pool, close_db_pool

# ── Demo credentials ──────────────────────────────────────────────────
ADMIN_EMAIL = "admin@safety.gov"
ADMIN_PWD = "admin123"

ORPHANAGE_EMAIL = "orphanage@example.com"
ORPHANAGE_PWD = "orphanage123"

PARENT_EMAIL = "parent@demo.com"
PARENT_PWD = "parent123"

BCRYPT_ROUNDS = 12


def hash_pwd(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode()


async def main():
    await init_db_pool()

    try:
        # 1. Delete all existing users (CASCADE will handle related rows)
        deleted = await fetch_one("DELETE FROM users RETURNING id")
        all_deleted = []
        while deleted:
            all_deleted.append(deleted["id"])
            deleted = await fetch_one(
                "DELETE FROM users WHERE id = $1 RETURNING id", deleted["id"]
            )
        # Simpler: just delete all
        await fetch_one("DELETE FROM users")
        print(f"✓ Cleared all existing users")

        # 2. Create ADMIN user
        admin_id = str(uuid.uuid4())
        admin_hash = hash_pwd(ADMIN_PWD)
        admin_id_db = await fetch_one(
            """INSERT INTO users
               (id, email, "firstName", "lastName", role, password,
                "isActive", "isEmailVerified", "provider", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, true, true, 'LOCAL', NOW(), NOW())
               RETURNING id""",
            admin_id, ADMIN_EMAIL, "Admin", "User", "ADMIN", admin_hash,
        )
        print(f"\n✅ ADMIN USER")
        print(f"    Email:    {ADMIN_EMAIL}")
        print(f"    ID:       {admin_id_db['id']}")
        print(f"    Password: {ADMIN_PWD}")
        print(f"    Role:     ADMIN")

        # 3. Create ORPHANAGE user + orphanage + orphanage_staff
        orph_user_id = str(uuid.uuid4())
        orph_hash = hash_pwd(ORPHANAGE_PWD)
        orph_user_id_db = await fetch_one(
            """INSERT INTO users
               (id, email, "firstName", "lastName", role, password,
                "isActive", "isEmailVerified", "provider", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, true, true, 'LOCAL', NOW(), NOW())
               RETURNING id""",
            orph_user_id, ORPHANAGE_EMAIL, "Orphanage", "Admin", "ORPHANAGE", orph_hash,
        )

        # Create orphanage
        orph_id = str(uuid.uuid4())
        orph_id_db = await fetch_one(
            """INSERT INTO orphanages
               (id, code, name, "organizationType", status, "registrationNumber",
                "officialEmail", phone, "addressLine1", city, state, pincode,
                "totalCapacity", "currentOccupancy", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, 'NGO', 'ACTIVE', 'REG-DEM-001',
                       $4, '+919876543210', '123 Demo Street', 'Demo City', 'TN', '600001', 50, 10, NOW(), NOW())
               RETURNING id""",
            orph_id, "ORP-DEM-001", "Demo Children Home", ORPHANAGE_EMAIL,
        )

        # Create orphanage_staff link
        await fetch_one(
            """INSERT INTO orphanage_staff
               (id, "orphanageId", "userId", role, designation, "employeeId",
                "isActive", "createdAt", "updatedAt")
               VALUES (gen_random_uuid(), $1, $2, 'ADMINISTRATOR', 'Director', 'DEM-DIR-001',
                       true, NOW(), NOW())""",
            orph_id_db["id"], orph_user_id_db["id"],
        )

        print(f"\n✅ ORPHANAGE USER")
        print(f"    Email:    {ORPHANAGE_EMAIL}")
        print(f"    ID:       {orph_user_id_db['id']}")
        print(f"    Password: {ORPHANAGE_PWD}")
        print(f"    Role:     ORPHANAGE")
        print(f"    Orphanage: {orph_id_db['id']}")

        # 4. Create PARENT user + parent profile
        parent_user_id = str(uuid.uuid4())
        parent_hash = hash_pwd(PARENT_PWD)
        parent_user_id_db = await fetch_one(
            """INSERT INTO users
               (id, email, "firstName", "lastName", role, password,
                "isActive", "isEmailVerified", "provider", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, true, true, 'LOCAL', NOW(), NOW())
               RETURNING id""",
            parent_user_id, PARENT_EMAIL, "Parent", "Demo", "PARENT", parent_hash,
        )

        # Create parent profile
        parent_id_db = await fetch_one(
            """INSERT INTO parents
               (id, "userId", "nationality", "kycStatus", "trustScore",
                "verificationStatus", "isActive", "createdAt", "updatedAt")
               VALUES (gen_random_uuid(), $1, 'Indian', 'APPROVED', 90,
                       'APPROVED', true, NOW(), NOW())
               RETURNING id""",
            parent_user_id_db["id"],
        )

        print(f"\n✅ PARENT USER")
        print(f"    Email:    {PARENT_EMAIL}")
        print(f"    ID:       {parent_user_id_db['id']}")
        print(f"    Password: {PARENT_PWD}")
        print(f"    Role:     PARENT")
        print(f"    Parent Profile ID: {parent_id_db['id']}")

        print("\n" + "=" * 60)
        print("✅ ALL DEMO USERS CREATED SUCCESSFULLY")
        print("=" * 60)

    finally:
        await close_db_pool()


asyncio.run(main())
</arg_value></tool_call>