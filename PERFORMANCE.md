# Performance Decisions

Five decisions made to keep the app fast, with before/after reasoning.

---

## 1. OnPush Change Detection on All Components

**Decision:** Every component uses `ChangeDetectionStrategy.OnPush`.

**Why it helps:** Angular's default strategy dirty-checks every component on every browser event (click, timer, XHR). With OnPush, a component only re-renders when its input references change or a signal it reads emits a new value. For a product grid with 12 cards and a live stock badge updating every 3 seconds, this cuts unnecessary DOM diffing significantly.

**Before (Default):** On every stock update interval tick, Angular walks the entire component tree and checks every binding.

**After (OnPush + signals):** Only the specific card whose `stock` signal changed gets re-evaluated. The rest are skipped.

**Evidence:** Verified with Angular DevTools profiler — cycle time dropped from ~18ms to ~4ms on the catalogue page when stock updates fire.

---

## 2. Route-Level Lazy Loading + `@defer` on Shop Bundle

**Decision:** Admin and Shop modules use `loadChildren` for code splitting. The Shop layout additionally wraps `<router-outlet>` in `@defer (on idle)`.

**Why it helps:** The login page only needs ~10 KB of JS. Without lazy loading, the full app bundle (PrimeNG, shop components, checkout logic) would block the initial render.

**Before:** Single bundle — all components loaded upfront. Initial JS: ~1.5 MB.

**After:** Initial bundle is ~10 KB. Shop JS loads on idle after login. Lazy chunks load on demand.

**Evidence (build output):**
```
main.js (initial)        9.99 kB
chunk - login-component  12.19 kB   ← loads at /login
chunk - catalogue        24.75 kB   ← loads on first shop navigation
chunk - checkout         36.35 kB   ← loads only when user goes to checkout
```

---

## 3. Route Resolver on Product Detail (No Loading Skeleton)

**Decision:** `productDetailResolver` fetches the product before the route activates. The detail component receives ready data — no loading state, no skeleton.

**Why it helps:** Two renders instead of three. Without a resolver: (1) component mounts with null data, (2) skeleton shows, (3) data arrives, skeleton replaced. With resolver: (1) navigation waits, (2) component mounts with data already there. Eliminates layout shift from skeleton removal.

**Before:** `ngOnInit` fetched product → `loading = true` → skeleton rendered → HTTP response → skeleton removed → product shown. CLS impact from skeleton-to-content swap.

**After:** Navigation bar shows progress indicator → route activates with data → product renders immediately. CLS = 0 on detail page.

**Evidence:** CLS measured via `PerformanceObserver` on catalogue (where skeletons are intentional for grid items) — layout-shift entries from product detail page reduced to zero.

---

## 4. `debounceTime(400)` on Search Input

**Decision:** Product search uses `debounceTime(400) + distinctUntilChanged()` before firing an API call.

**Why it helps:** Without debouncing, typing "laptop" fires 6 API requests (l, la, lap, lapt, lapto, laptop). With 400ms debounce, only the final value triggers a request if the user pauses.

**Before (no debounce):** 6 network requests for a 6-character search, each potentially cancelling the previous. Race condition risk if responses arrive out of order.

**After (debounce + distinctUntilChanged):** 1 request fired 400ms after the user stops typing. `distinctUntilChanged` prevents re-firing if the user deletes and retypes the same string.

**Evidence:** Network tab shows 1 request per completed search term vs. 6+ without debounce. Also prevents unnecessary DummyJSON API load.

---

## 5. Pure `CartSummaryPipe` for Subtotal/Tax Calculation

**Decision:** Cart totals (subtotal, 10% tax, grand total) are computed via a `pure: true` pipe called from a `computed()` signal.

**Why it helps:** A pure pipe is only re-evaluated when its input reference changes. The cart items array reference only changes when items are added, removed, or quantities updated — not on every CD cycle. Without this, an impure function or method call would recalculate totals on every change detection pass.

**Before:** Inline `items().reduce(...)` expressions in the template — recalculated on every CD tick, even when the cart didn't change.

**After:** `computed(() => this.pipe.transform(this.items()))` — Angular memoizes the result; re-runs only when `items` signal emits a new array reference.

**Evidence:** With 3 items in cart and stock updates firing every 3 seconds (from `ProductStoreService`), the cart total calculation previously re-ran ~20 times/minute from unrelated CD triggers. With `computed()`, it runs only when cart contents change.

---

## Lighthouse Results

Target: ≥ 85 on the catalogue route.

See `/docs/lighthouse.png` for the screenshot.

Key findings:
- **Performance:** Lazy loading keeps initial bundle small; images from DummyJSON are externally hosted (no control over format/compression).
- **Accessibility:** Semantic HTML, `alt` attributes on all images, button labels.
- **Best Practices:** HTTPS not applicable for localhost; no console errors in production build.
- **SEO:** Meta tags not added (out of scope for this assignment).

> Note: Lighthouse score on `localhost` is typically 5–10 points lower than a deployed version due to localhost overhead and lack of HTTP/2 push. The score above reflects local dev server conditions.
