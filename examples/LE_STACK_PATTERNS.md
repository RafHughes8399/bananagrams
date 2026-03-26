# How `www-le-customer`, `svc-payment`, and `svc-order` fit together

This is a **mental model** of the Luxury Escapes–style stack reflected in your `le_repos` folder. It is **tutorial**, not an importable library: names like `@luxuryescapes/router` are **their** packages.

---

## 1. Three layers, three jobs

| Repo | Role | What “routing” means here |
|------|------|---------------------------|
| **www-le-customer** | Browser app (React/TSX) + SSR | **URLs in the browser** (`/:regionCode/...`), plus **HTTP calls** to backends behind `API_HOST` |
| **svc-payment** | Payment microservice | **HTTP routes** on the payment API (e.g. `/api/payments/v2/...`) using a shared router abstraction |
| **svc-order** | Order microservice | **HTTP routes** on Express under `/api/...` — older “`express.Router()` + controllers” style |

The customer site does **not** talk to `svc-payment` or `svc-order` directly as random strings in components. It calls **paths on the public API host** (often a **gateway/BFF** that fans out to services). Your loyalty example calls `/api/lux-loyalty/...` — same idea: **one origin**, many path prefixes owned by different services upstream.

---

## 2. Frontend (www-le-customer): routes, HTTP, and Redux API calls

### 2.1 Browser routes (React Router)

The app uses **React Router v5** patterns (`react-router` / `react-router-dom`), not the newer v6 `createBrowserRouter` Data API.

- **Composition:** `Routes.tsx` wraps layout (header, footer, etc.) and mounts **`PageRoutes`** where the big `<Switch>` / `<Route>` tree lives.
- **Patterns you will see:**
  - `Route` + `path` matching URLs like `/:regionCode/...`
  - `loadable(...)` (code-splitting) for heavy pages
  - `connected-react-router` so **Redux** can dispatch `push` / `replace` and keep router state in the store
  - `withRouter`, `useLocation`, `useParams` for reading URL inside components

**Convention:** A “page” is usually a lazy-loaded component; **routing file ≠ API file**. TSX decides *what screen*; **`src/client/api/*`** decides *what HTTP*.

### 2.2 The HTTP layer: `requestUtils` (fetch wrapper)

The core HTTP client is **`src/client/api/requestUtils.ts`** (often imported as `api/requestUtils` via TS/webpack path aliases).

**What it does:**

1. **Base URL:** `config.SCHEME` + `config.API_HOST` in the browser; SSR can use `SERVER_SIDE_API_HOST`.
2. **Builds** `endpoint + path` (e.g. `https://api.example.com` + `/api/foo/bar`).
3. **Preprocessors / interceptors:** functions can tweak path/body/headers before the request, or wrap the response promise after.
4. **JSON bodies:** If `body` is a plain object, it sets `Content-Type: application/json` and `JSON.stringify`s it. `FormData` is special-cased (upload path uses `XMLHttpRequest` for progress).
5. **Errors:** status `>= 400` → tries to parse JSON error payload and **throws that object** (not necessarily an `Error` instance).
6. **Helpers exported as default:** `.get`, `.post`, `.patch`, `.put`, `.delete`, `.upload`, plus **`authOptions(accessToken?)`** — either `Authorization: Bearer …` or `{ credentials: 'include' }` for cookie sessions.

**Mental model:** Think of it as **your team’s `fetch` + base URL + JSON + auth + error parsing**.

### 2.3 API modules: thin functions per domain

Domain calls live under **`src/client/api/<domain>/`**. Example pattern (loyalty earn points):

```ts
// Conceptual — mirrors their style
import requestUtils from 'api/requestUtils'
// Types may come from OpenAPI-generated packages, e.g. @luxuryescapes/contract-svc-lux-loyalty
import type { paths } from '@luxuryescapes/contract-svc-lux-loyalty'

type Response = paths['/api/lux-loyalty/points/calculate-earn']['post']['responses']['200']['content']['application/json']
type Payload = paths['/api/lux-loyalty/points/calculate-earn']['post']['requestBody']['content']['application/json']

export async function requestLoyaltyEarnPointsCalculation(
  request: App.LoyaltyPointsEarnCalculationRequest,
  options: EarnPointsCalculationOptions,
): Promise<App.LoyaltyPointsEarnCalculation> {
  const payload = mapRequestToPayload(request, options)

  const response = await requestUtils.post<Response, Payload>(
    '/api/lux-loyalty/points/calculate-earn',
    payload,
    { credentials: 'include' },
  )

  return mapResponseToCalculation(request, response.result)
}
```

**Conventions:**

- **`requestUtils.post<ResponseType, BodyType>(path, body, options?)`** keeps TypeScript honest.
- **Mappers** (`mapRequestToPayload`, `mapResponseToCalculation`) keep **UI/domain shapes** separate from **wire JSON**.
- **Contracts:** Types often come from **`@luxuryescapes/contract-*`** so frontend and backend agree on paths and bodies.

### 2.4 Redux: `API_CALL` + `apiMiddleware`

Many features dispatch a special action shape; **`apiMiddleware`** runs the async work.

**Action shape (conceptually):**

```ts
{
  type: 'API_CALL',
  api: 'SOME_CONSTANT_FROM_apiActionConstants', // string id for reducers
  request: () => promiseFromApiLayer(),        // MUST return a Promise
  // …extra fields for reducers (keys, meta, etc.)
}
```

**What the middleware does:**

1. Dispatches **`API_CALL_REQUEST`** (client only) so reducers can set `fetching: true`.
2. Calls `request()` → gets a Promise.
3. On success: **`API_CALL_SUCCESS`** with `data` set to the resolved value.
4. On failure (client only): **`API_CALL_FAILURE`** with `error`.
5. On **SSR**, it avoids stashing failures / “fetching” in a way that would poison hydrated state.

**Flow diagram:**

```mermaid
sequenceDiagram
  participant UI as Component
  participant AC as Action creator (thunk)
  participant MW as apiMiddleware
  participant API as client/api/* + requestUtils
  participant Net as API_HOST (gateway)

  UI->>AC: dispatch(submitThing(...))
  AC->>MW: dispatch({ type: API_CALL, api, request: () => callApi() })
  MW->>MW: dispatch(API_CALL_REQUEST)
  MW->>API: request()
  API->>Net: fetch POST /api/...
  Net-->>API: 200 JSON
  API-->>MW: resolved data
  MW->>MW: dispatch(API_CALL_SUCCESS, data)
  Note over UI: reducers update; UI re-renders
```

**Practical takeaway:** Components often **don’t call `fetch` directly**; they dispatch actions that either use **`API_CALL`** or (in newer code) hooks / RTK Query–style patterns elsewhere. The **steady pattern** is still: **api module → `requestUtils` → gateway path**.

---

## 3. svc-payment: `@luxuryescapes/router` (contract-style HTTP API)

`svc-payment` builds the app in **`router.ts`** with **`buildRouter(app, { logger, swaggerBaseProperties, … })`** from **`@luxuryescapes/router`**. Routes are **not** scattered `app.get` calls; they’re **registered on a `RouterAbstraction`**.

**Mount tree (simplified):**

- `router.ts` → `routes.mount(router)` → `api/routes.ts` → `v2.mount(router)` → domain modules → e.g. `stripe/paymentIntents.mount(router)`.

**Single route registration** looks like:

```ts
// Conceptual — same shape as svc-payment stripe payment intents
router.post({
  url: `${basePathV2}/stripe/payment-intents`,
  operationId: 'createPaymentIntent',
  isPublic: true,
  schema: schema.createPaymentIntent,
  preHandlers: [verifySecurePayment, verifyUser(), verifyStripeV2Payment],
  handlers: [controller.createPaymentIntent],
  summary: 'Creates a Payment Intent',
})
```

**Meaning of fields:**

- **`url`:** Full path segment for this service (plus global base path / gateway prefix in prod).
- **`operationId`:** Stable name; often lines up with **OpenAPI / contract** and **handler types** (`Handler<operations, 'createPaymentIntent'>`).
- **`schema`:** Request validation (and often response typing) — **fail fast** before the controller.
- **`preHandlers`:** Express-style middleware chain: auth (`verifyUser()`), domain checks, admin gates, etc.
- **`handlers`:** Actual business logic; receives validated request and sends response.

**Convention:** **Declarative route table** + **typed controllers** + **Zod (or similar) schemas** per operation.

---

## 4. svc-order: classic Express `Router` under `/api`

`svc-order` **`server.js`** does:

- `express()` + JSON + request id (`x-request-id`) + `executeWithRequestContext`
- **`app.use("/api", apiV1)`** where `apiV1` is the big **`api/v1/routes`** module

That file **`express.Router()`** and wires hundreds of endpoints with:

- **`@luxuryescapes/lib-auth-middleware`** (`verifyUser`, `canBeAccessedBy`, …)
- **`validateSchemaMiddleware`** + **Zod schemas** for some newer endpoints
- **Controllers** imported from `./controllers/...`

**Mental model:** **Same HTTP ecosystem as payment**, but **route registration is imperative**: `router.get(...)`, `router.post(...)`, middleware per route or `router.use(...)`.

**Jobs / admin:** e.g. `mountJobRoutes` mounts **Bull Board** under `/api/orders/jobs` behind `verifyUser` + **admin** middleware.

---

## 5. How a single user action might cross all three

Example: “Create Stripe payment intent” at checkout.

1. **www-le-customer:** Checkout UI dispatches Redux **`API_CALL`** (or calls a hook that eventually uses **`requestUtils.post`**).
2. **HTTP** goes to **`API_HOST`** path that the **gateway** routes to **svc-payment** (not hard-coded in the browser as `svc-payment:8080`).
3. **svc-payment:** `router.post` on `…/stripe/payment-intents` runs **preHandlers** (secure token, logged-in user, provider checks), then **controller** talks to Stripe + DB.

Orders follow the same story with **`svc-order`** paths under **`/api/...`** on the order service host (again, usually reached via gateway URLs).

---

## 6. Mini “do it yourself” checklist (JS → production-shaped habits)

1. **One module per backend domain** (`api/orders.ts`, `api/payments.ts`) — thin wrappers around HTTP.
2. **One `requestUtils` equivalent** — base URL, JSON, auth, errors — **never** copy-paste `fetch` in 50 components.
3. **Types from contracts** where possible — avoids “field `orderId` vs `order_id`” drift.
4. **Separate:**
   - **Route (URL bar)** — React Router  
   - **Resource (REST path)** — `/api/...` on server  
5. **Server:** either **modern** (declarative router + `operationId` + schema) or **classic** Express Router — **svc-order vs svc-payment** shows both in one org.

---

## 7. File cheat sheet (paths in your clones)

| Idea | Where to look (approx.) |
|------|-------------------------|
| Browser routes | `www-le-customer/src/client/components/App/Routes/` |
| HTTP client | `www-le-customer/src/client/api/requestUtils.ts` |
| Domain API call | `www-le-customer/src/client/api/<domain>/*.ts` |
| Redux API wiring | `www-le-customer/src/client/middlewares/apiMiddleware.ts` |
| Payment route mount | `svc-payment/src/api/v2/**/index.ts` (e.g. `stripe/paymentIntents`) |
| Payment router bootstrap | `svc-payment/src/router.ts` |
| Order Express app | `svc-order/src/server.js` |
| Order route table | `svc-order/src/api/v1/routes.js` |

---

*This document is for learning; it summarizes patterns observed in your local `le_repos` copies and may drift if those repos change.*
