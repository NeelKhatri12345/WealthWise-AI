"""
WealthWise AI — Database Seeder
Windows-compatible Python version of db_utils.sh seed command

Usage:
    python scripts/db/seed.py

Purpose:
  - Creates default roles: admin, analyst, user
  - Creates a default admin user (dev only)
  - Idempotent — safe to run multiple times

Run from project root:
    cd backend && python -m app.database.seed
    OR
    python scripts/db/seed.py
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

async def seed():
    from app.database.session import AsyncSessionLocal
    from app.database.base import Base
    from app.models.role import Role
    from app.models.user import User
    from app.core.security import hash_password
    
    default_roles = [
        {"name": "admin", "description": "Platform administrator with full access"},
        {"name": "analyst", "description": "Analytics access to aggregated data"},
        {"name": "user", "description": "Standard user with own data access"},
    ]
    
    default_admin = {
        "email": "admin@wealthwise.ai",
        "password": "Admin@123",
        "full_name": "System Administrator",
    }
    
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        
        print("🌱 Seeding database...")
        
        # Create roles
        for role_data in default_roles:
            existing = await session.scalar(select(Role).where(Role.name == role_data["name"]))
            if not existing:
                role = Role(**role_data)
                session.add(role)
                print(f"  ✅ Created role: {role_data['name']}")
            else:
                print(f"  ⏭️  Role exists: {role_data['name']}")
        
        await session.commit()
        
        # Create admin user
        admin_role = await session.scalar(select(Role).where(Role.name == "admin"))
        existing_admin = await session.scalar(select(User).where(User.email == default_admin["email"]))
        
        if not existing_admin and admin_role:
            admin = User(
                email=default_admin["email"],
                hashed_password=hash_password(default_admin["password"]),
                full_name=default_admin["full_name"],
                role_id=admin_role.id,
                is_active=True,
                is_verified=True,
            )
            session.add(admin)
            await session.commit()
            print(f"  ✅ Created admin user: {default_admin['email']}")
            print(f"  🔑 Default password: {default_admin['password']}")
            print(f"  ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!")
        else:
            print(f"  ⏭️  Admin user already exists")
        
        print("\n✅ Database seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
