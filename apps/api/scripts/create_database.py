"""
Script to create the database and user for LoanAI
Run this before running migrations
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys

# Connection parameters for the default postgres database
POSTGRES_USER = "postgres"
POSTGRES_PASSWORD = ""  # Try empty password first
POSTGRES_HOST = "localhost"
POSTGRES_PORT = "5432"
POSTGRES_DB = "postgres"

# New database parameters
NEW_USER = "loan"
NEW_PASSWORD = "loan"
NEW_DATABASE = "loan_ai"


def create_database_and_user():
    """Create database and user if they don't exist"""

    # Try different connection methods
    connection_attempts = [
        {"user": "postgres", "password": ""},
        {"user": "postgres", "password": "postgres"},
        {"user": POSTGRES_USER, "password": POSTGRES_PASSWORD, "host": POSTGRES_HOST},
    ]

    conn = None
    for attempt in connection_attempts:
        try:
            print(f"Attempting to connect with user: {attempt.get('user', 'postgres')}...")
            conn = psycopg2.connect(
                dbname=POSTGRES_DB,
                host=POSTGRES_HOST,
                port=POSTGRES_PORT,
                **attempt
            )
            print("✓ Connected to PostgreSQL")
            break
        except psycopg2.OperationalError as e:
            print(f"  Connection attempt failed: {str(e)[:100]}")
            continue

    if conn is None:
        print("\n✗ Could not connect to PostgreSQL")
        print("\nTry one of these:")
        print("1. Connect manually: psql -U postgres -h localhost")
        print("2. Check Docker container: docker ps")
        print("3. Use existing database with correct credentials")
        sys.exit(1)

    try:
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Check if user exists
        cursor.execute(
            "SELECT 1 FROM pg_roles WHERE rolname=%s",
            (NEW_USER,)
        )
        user_exists = cursor.fetchone() is not None

        if not user_exists:
            print(f"Creating user '{NEW_USER}'...")
            cursor.execute(
                f"CREATE USER {NEW_USER} WITH PASSWORD %s",
                (NEW_PASSWORD,)
            )
            print(f"✓ User '{NEW_USER}' created")
        else:
            print(f"✓ User '{NEW_USER}' already exists")

        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname=%s",
            (NEW_DATABASE,)
        )
        db_exists = cursor.fetchone() is not None

        if not db_exists:
            print(f"Creating database '{NEW_DATABASE}'...")
            cursor.execute(f"CREATE DATABASE {NEW_DATABASE} OWNER {NEW_USER}")
            print(f"✓ Database '{NEW_DATABASE}' created")
        else:
            print(f"✓ Database '{NEW_DATABASE}' already exists")

        # Grant privileges
        print("Granting privileges...")
        cursor.execute(f"GRANT ALL PRIVILEGES ON DATABASE {NEW_DATABASE} TO {NEW_USER}")
        print("✓ Privileges granted")

        cursor.close()
        conn.close()

        print("\n" + "="*60)
        print("✓ DATABASE SETUP COMPLETE")
        print("="*60)
        print(f"\nDatabase: {NEW_DATABASE}")
        print(f"User: {NEW_USER}")
        print(f"Password: {NEW_PASSWORD}")
        print(f"Host: {POSTGRES_HOST}")
        print(f"Port: {POSTGRES_PORT}")
        print("\nConnection string:")
        print(f"postgresql+psycopg2://{NEW_USER}:{NEW_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{NEW_DATABASE}")
        print()

        return True

    except Exception as e:
        print(f"\n✗ Error: {e}")
        if conn:
            conn.close()
        return False


if __name__ == "__main__":
    success = create_database_and_user()
    sys.exit(0 if success else 1)
