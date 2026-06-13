# PROMPTS.md

Every meaningful AI prompt used during this assignment, with notes on what I changed or decided differently.

---

## Task 1 — Auth

**Prompt:** "angular 17 auth service with signals, store user in sessionstorage, redirect based on role after login"

Worked mostly as expected. AI used `toSignal()` from an observable — I replaced it with a plain `signal<User | null>` because I didn't need the observable at all, just wanted to set it directly on login success.

---

**Prompt:** "how to make canActivate guard that saves returnUrl and redirects to login if not authenticated"

The guard it gave was class-based (`implements CanActivate`). Changed to functional `CanActivateFn` — Angular 17 doesn't need the class pattern.

---

**Prompt:** "mock jwt token for angular app, what should I store in sessionstorage"

Gave me the idea of storing the full user object (base64-style). I stored it as plain JSON in sessionStorage with a `pc_session` key. Simple enough for a mock.

---

## Task 2 — Admin Products

**Prompt:** "primeng datatable angular 17 with server side pagination and debounce search"

The generated code had `HttpParams` built inside the component. Moved API logic to `ProductService` and store logic to `ProductStoreService` — component should only call methods, not build HTTP params itself.

---

**Prompt:** "optimistic delete in angular — remove from list first, rollback on api error"

This one was clean. Only change: AI stored the old index using `findIndex` before removing — I passed the index directly from the template `(click)="confirmDelete(product, i)"` since PrimeNG table already gives me the index.

---

**Prompt:** "simulate websocket with rxjs interval that randomly updates stock for visible products"

Used almost as-is. Added it to `ProductStoreService` constructor so it runs once and shares across components — AI had put it inside the component which would create a new interval per component mount.

---

## Task 2 — Admin Orders (this took the longest)

**Prompt:** "angular orders component fetch from api and display in table with status filter"

First attempt used signals + `computed()` for filtered list + `OnPush` detection. Table showed 0 results. Spent a lot of time debugging this.

**What I figured out:** `computed()` was reading `searchCtrl.value` which is not a signal, so Angular never knew to re-run it. Changed `filteredOrders` from `computed()` to a plain array updated manually.

Still didn't work. Loading spinner was stuck.

---

**Prompt (follow-up):** "takeUntilDestroyed causing http subscribe next callback to not fire"

Found that calling `takeUntilDestroyed(this.destroyRef)` inside `ngOnInit` (not at construction time) was blocking the subscription. Removed it, used a plain subscribe. Orders finally loaded.

---

**Prompt (follow-up):** "angular changedetectorref detectchanges vs markforcheck when to use which"

Used `detectChanges()` as a final fix — immediately runs CD rather than scheduling it. `markForCheck()` would have been cleaner but `detectChanges()` was more predictable given the OnPush issues I was already fighting.

---

**Prompt:** "forkjoin two http requests users and carts api angular"

`forkJoin` caused one of the two requests to hang (DummyJSON `/users` with `limit=0` was slow). Dropped `forkJoin` entirely — fetched only `/carts` and used mock names array instead of real user names. Simpler and faster.

---

## Task 2 — Analytics

**Prompt:** "analytics dashboard angular with total orders revenue products users from api"

Straightforward. AI returned a component with `forkJoin` again — same issue as orders. Changed to three separate `subscribe()` calls so one slow response doesn't block the others.

---

## Task 3 — Catalogue

**Prompt:** "angular catalogue component with category filter search and pagination, save filters in url query params"

AI used `queryParamsHandling: 'preserve'`. Changed to `'merge'` — preserve would have kept stale params from previous routes, merge only updates what changed.

---

**Prompt:** "performanceobserver lcp and cls angular component"

Used as-is with one addition: wrapped in `if (!('PerformanceObserver' in window))` check. Probably unnecessary for Chrome but good practice.

---

## Task 3 — Product Detail

**Prompt:** "angular route resolver fetch product before navigation, no loading skeleton on detail page"

AI's resolver had `tap()` to store in a service. Didn't need that — just return the observable directly and read from `route.snapshot.data['product']` in the component. Simpler.

---

## Task 3 — Checkout

**Prompt:** "angular dynamic form from json config with validators and visibleWhen condition"

This was mostly good. AI used `eval()` to parse validators from strings — replaced that with a manual `if/else` chain. `eval()` is a security risk even in a mock app.

---

**Prompt:** "luhn algorithm angular validator for credit card number"

The algorithm was correct. Extracted `luhnCheck` as a separate exported function so I could unit test it without going through a `FormControl`. AI had everything inside the validator function.

---

**Prompt:** "checkout step guard angular prevent direct url access to step 2 and 3"

AI used a shared service to track completed steps. Used `sessionStorage` instead — no need for an injectable service just to track a number. Also clears automatically when cart is emptied.

---

**Prompt:** "angular pure pipe for cart total calculation subtotal tax grand total"

Pipe was clean. One change: called it via `computed()` in the component instead of directly in the template, so it only recalculates when the items signal actually changes.

---

## Misc

**Prompt:** "angular @defer on router outlet with loading placeholder"

AI put it in `app.component.html` which deferred everything including admin. Moved it to `ShopLayoutComponent` so only the shop bundle gets deferred, admin loads normally.

---

**Prompt:** "unit tests jasmine for luhn validator angular"

Tests were good but one case was wrong — `'0000000000000000'` actually passes Luhn (sum = 0, 0 % 10 = 0). Removed that test case and replaced with a number that genuinely fails checksum.
