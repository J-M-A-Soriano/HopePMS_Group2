# Entity Relationship Diagram (ERD) - HopePMS

This documentation outlines the database schema architecture for the ProdSync application implemented within Supabase (PostgreSQL).

## ERD Diagram

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned_to

    USERS {
        uuid id PK
        string email
        string full_name
        timestamp created_at
    }

    ROLES {
        int id PK
        string role_name "admin, manager, staff"
        string description
    }

    USER_ROLES {
        uuid user_id FK
        int role_id FK
    }

    PRODUCT ||--o{ PRICE_HISTORY : tracks
    USERS ||--o{ PRODUCT : created_by

    PRODUCT {
        uuid id PK
        string sku
        string name
        text description
        numeric current_price
        int stock_quantity
        string category
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
        boolean is_deleted "Soft delete flag"
    }

    PRICE_HISTORY {
        uuid id PK
        uuid product_id FK
        numeric old_price
        numeric new_price
        uuid changed_by FK
        timestamp changed_at
    }
```

## Schema Details
- **USERS**: Managed directly by Supabase Auth (`auth.users`), augmented with triggers for public profiles.
- **PRODUCT**: Implements soft-delete via `is_deleted` flag for Sprint 2. Protected by Row Level Security (RLS).
- **PRICE_HISTORY**: Automatically logs changes to `current_price` from the `PRODUCT` table to support Sprint 2 auditing requirements.
