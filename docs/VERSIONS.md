
# System Version History

## [v1.0.0] - The Golden Version (Stable)
**Status**: ACTIVE / FROZEN
**Release Date**: 2024-05-22

### Core Features
- **Asset Management**: Full lifecycle tracking for Phones, Tablets, and Hardware.
- **Point of Sale**: Multi-payment checkout (M-Pesa, Bank, Cash).
- **Adobe-Grade PDF Engine**: Professional A4 high-fidelity Invoices and Receipts.

---

## [v2.0.0] - SaaS Evolution (Active Build)
**Status**: STABLE CORE / FEATURE-GUARDED
**Release Date**: 2024-06-15 (Simulated)

### Implemented Features
- **Multi-Tenancy**: Data isolation via `tenantId` across all modules.
- **Subscription Engine**: Tiered access (Free, Basic, Pro) with Legacy Pro protection.
- **Usage Meters**: Real-time tracking of Assets and Sales volume per workspace.
- **Super Admin Intelligence**: Platform-wide activity feed and GMV analytics (Phase 10).
- **Infrastructure Abstraction**: Unified Service Layer (Decoupled UI from DB).

---

## [v3.0.0] - Custom Backend Migration (Planned)
**Status**: DESIGN PHASE

### Roadmap
- [ ] **Middleware Implementation**: Introducing API routes to replace Dexie Cloud.
- [ ] **Auth Migration**: Moving from Firebase Client Auth to Server-side JWT.
- [ ] **Unified API Layer**: Final migration of Service Layer to external REST/GraphQL endpoints.
