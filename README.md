# Platform Commons — Angular Frontend Assignment

Angular 17+ SPA built against the [DummyJSON](https://dummyjson.com) mock API. Covers authentication with RBAC, an admin panel, and a user-facing storefront.

---

## Quick Start

```bash
npm install
ng serve
```

Open `http://localhost:4200`. The app redirects to `/login` by default.

### Demo Credentials

| Role  | Username      | Password        |
|-------|---------------|-----------------|
| Admin | `emilys`      | `emilyspass`    |
| Admin | `michaelw`    | `michaelwpass`  |
| User  | `sophiab`     | `sophiabpass`   |
| User  | `alexanderj`  | `alexanderjpass`|

Admins land on `/admin`, users land on `/shop`.

---

## Running Tests

```bash
ng test --watch=false --browsers=ChromeHeadless
```

24 tests, all passing. Coverage includes the Luhn card validator and the dynamic `visibleWhen` form predicate.

---

## Project Structure

```
src/app/
├── core/
│   ├── guards/          # authGuard, adminGuard, loginGuard
│   ├── models/          # User, Product, Cart, Order types
│   └── services/        # AuthService, CartService, ProductService, ProductStoreService
├── features/
│   ├── auth/login/      # Login page (OnPush, skeleton loader, 600ms mock delay)
│   ├── admin/
│   │   ├── products/    # CRUD table, optimistic delete, simulated WebSocket stock
│   │   ├── orders/      # Order list with side-panel detail, inline status update
│   │   └── analytics/   # Summary stats + top 5 selling products
│   └── shop/
│       ├── catalogue/   # Product grid, URL-synced filters, PerformanceObserver
│       ├── product-detail/ # Route resolver, related products
│       ├── cart/        # localStorage persistence, CartSummaryPipe (subtotal + tax)
│       ├── checkout/    # 3-step flow, dynamic JSON form, Luhn CVA, step guard
│       └── order-confirmation/
└── shared/
    ├── pipes/           # CartSummaryPipe (pure)
    ├── utils/           # isFieldVisible (visibleWhen predicate)
    └── validators/      # luhnValidator
```

---

## Architecture Decisions

### Auth — Signal-based singleton store
`AuthService` exposes `currentUser`, `role`, and `isAuthenticated` as Angular signals. No component holds a copy of the user object. Session is stored in `sessionStorage` and rehydrated on refresh. Mock users are kept in `/assets/users.json`; passwords are plain text in the asset but the pattern mirrors a hashed lookup — the DummyJSON token endpoint provides the real session token.

### Role-based routing
Two guards: `authGuard` (any authenticated user) and `adminGuard` (admin role only). Unauthenticated requests are redirected to `/login?returnUrl=<original-path>` and restored after login.

### Admin Products — Signal store + optimistic UI
`ProductStoreService` holds product state as signals. Deletes are applied immediately to the signal; the DELETE API call runs in the background. On failure, the row is re-inserted at its original index. A simulated WebSocket (`interval + Subject`) updates stock counts every 3 seconds without re-fetching the list.

### Admin Orders — Direct HTTP + ChangeDetectorRef
Orders are fetched directly with `HttpClient` and mapped from DummyJSON cart data with mock customer names. `ChangeDetectorRef.detectChanges()` is called explicitly because this component intentionally avoids a signal-based store to keep the code straightforward.

### Shop Catalogue — URL-synced filters
Category, search query, and page number are written to query params on every filter change. On load, the component reads params back from the URL, so deep-linking and browser back/forward preserve filter state.

### Product Detail — Route Resolver
`productDetailResolver` fetches the product before navigation completes. The detail component receives resolved data via `ActivatedRoute.snapshot.data` — there is no loading skeleton on the detail page; the navigation itself is the loading gate.

### Checkout — Dynamic form + step guard
Form fields are rendered from `/assets/checkout-form.json`. Each field carries a `type`, `validators` array, and an optional `visibleWhen` predicate. A `checkoutStepGuard` blocks direct URL access to steps 2 or 3; progression is tracked in `sessionStorage` and cleared when the cart is emptied.

### Cart totals — Pure pipe
`CartSummaryPipe` computes subtotal, 10% tax, and grand total from the items array. It is pure — Angular only re-evaluates it when the items reference changes.

### `@defer` at the shop route level
`ShopLayoutComponent` wraps its `<router-outlet>` with `@defer (on idle)`. The entire shop bundle is deferred until the browser is idle, with a spinner placeholder shown in the meantime. Combined with `loadChildren`, this means the shop JS is never parsed on the initial page load.

### Change detection strategy
All components use `OnPush`. Components that read signals get automatic invalidation. The orders component uses `ChangeDetectorRef.detectChanges()` as a targeted escape hatch rather than switching back to `Default`.

---

## Known Limitations

- **No real order persistence** — orders are read from DummyJSON `/carts`. A placed order appears in the confirmation page but won't show up in the admin orders list because both read independent API endpoints.
- **Mock WebSocket** — stock updates use `interval()` rather than a real WebSocket connection.
- **Auth passwords not hashed** — `users.json` stores plain-text passwords. A production implementation would hash these with bcrypt and compare server-side.
- **DummyJSON tokens expire** — the mock JWT from DummyJSON is real but short-lived. Session rehydration restores user state from `sessionStorage` without re-validating the token.
