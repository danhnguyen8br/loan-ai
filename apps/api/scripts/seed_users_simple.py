"""
Simple script to create test users
Bypasses bcrypt issues by using SQL directly
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import SessionLocal

# Pre-hashed passwords (bcrypt hashed with bcrypt==4.0.1)
# test123456 hashed
TEST_USER_HASH = "$2b$12$ze5jgIHr0RJaznLfRO0aE.VcKM9SPKN1Bq2Cj10n5EMYugrBOsH0e"
# admin123456 hashed
ADMIN_USER_HASH = "$2b$12$ehLqJDgzBE3F0tHBA5GADeLa4BwZOPIk2McDhA82ReIKWjIYn7Phu"

def seed_users():
    """Create test users"""
    db = SessionLocal()

    try:
        print("Creating test users...")

        # Insert users directly
        db.execute(text("""
            INSERT INTO users (id, email, hashed_password, full_name, phone, created_at, updated_at)
            VALUES
                (gen_random_uuid(), 'test@example.com', :test_hash, 'Test User', '0901234567', NOW(), NOW()),
                (gen_random_uuid(), 'admin@loanai.vn', :admin_hash, 'System Administrator', '0909876543', NOW(), NOW())
            ON CONFLICT (email) DO NOTHING
        """), {"test_hash": TEST_USER_HASH, "admin_hash": ADMIN_USER_HASH})

        db.commit()

        # Check results
        result = db.execute(text("SELECT email, full_name FROM users"))
        users = result.fetchall()

        print(f"\n✓ Created {len(users)} test users:")
        for user in users:
            print(f"  - {user[0]} ({user[1]})")

        print("\n" + "="*60)
        print("✓ USER SEEDING COMPLETED")
        print("="*60)
        print("\nTest Credentials:")
        print("  Email: test@example.com")
        print("  Password: test123456")
        print()
        print("  Email: admin@loanai.vn")
        print("  Password: admin123456")
        print()

    except Exception as e:
        print(f"✗ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

    return True

if __name__ == "__main__":
    success = seed_users()
    sys.exit(0 if success else 1)
