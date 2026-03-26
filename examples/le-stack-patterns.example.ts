/**
 * LE STACK — ILLUSTRATIVE EXAMPLES (www-le-customer + svc-payment + svc-order)
 * =============================================================================
 *
 * This file does NOT run in the bananagrams repo. It teaches the *shape* of
 * patterns from your `le_repos` clones. Names like `requestUtils`, `API_CALL`,
 * and `router.post({ operationId })` mirror those codebases conceptually.
 *
 * Prerequisites you already have: JS promises, async/await, HTTP verbs, JSON.
 */

// -----------------------------------------------------------------------------
// A. HTTP on the frontend — the "requestUtils" idea (fetch + base URL + JSON)
// -----------------------------------------------------------------------------
//
// Real file: www-le-customer/src/client/api/requestUtils.ts
//
// - default export: { get, post, patch, put, delete, upload }
// - prepends config.API_HOST (browser) or SERVER_SIDE_API_HOST (SSR)
// - serializes object bodies to JSON + Content-Type
// - throws parsed JSON on status >= 400
// - authOptions(accessToken?) → Bearer header OR credentials: 'include' (cookies)

// --- Example: pretend minimal implementation (for mental model only) ---
const pretendConfig = { SCHEME: 'https', API_HOST: 'api.example.com' }
const baseUrl = `${pretendConfig.SCHEME}://${pretendConfig.API_HOST}`

async function pretendPost<TResponse, TBody>(
  path: string,
  body: TBody,
  init: RequestInit = {},
): Promise<TResponse> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init.headers as object) },
    body: JSON.stringify(body),
    credentials: 'include', // session cookie flow — common in their customer app
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw err // their code throws structured API errors, not always `new Error()`
  }
  return res.json() as Promise<TResponse>
}

/** Example response / body types (real code often imports these from @luxuryescapes/contract-*) */
interface CalculateEarnResponse {
  result: { points: number }
}
interface CalculateEarnBody {
  publicPrice: number
  currency: string
  customerId: string
}

async function exampleDomainApiCall(): Promise<void> {
  const data = await pretendPost<CalculateEarnResponse, CalculateEarnBody>(
    '/api/lux-loyalty/points/calculate-earn',
    { publicPrice: 199, currency: 'AUD', customerId: 'cust_123' },
  )
  console.log('points:', data.result.points)
}

// -----------------------------------------------------------------------------
// B. Domain API module — one file per area (maps UI ↔ wire format)
// -----------------------------------------------------------------------------
//
// Real example: www-le-customer/src/client/api/loyalty/requestLoyaltyEarnPointsCalculation.ts
//
// Conventions:
// 1. Map rich UI state → JSON payload (mapper functions).
// 2. call requestUtils.post<ResponseType, BodyType>(path, body, options).
// 3. Map JSON → UI-friendly return value.

function mapUiToPayload(price: number, currency: string): CalculateEarnBody {
  return { publicPrice: price, currency, customerId: 'from-redux-or-context' }
}

export async function requestPointsCalculation(
  price: number,
  currency: string,
): Promise<number> {
  const payload = mapUiToPayload(price, currency)
  const res = await pretendPost<CalculateEarnResponse, CalculateEarnBody>(
    '/api/lux-loyalty/points/calculate-earn',
    payload,
  )
  return res.result.points
}

// -----------------------------------------------------------------------------
// C. Redux: API_CALL + middleware (async in middleware, not in the reducer)
// -----------------------------------------------------------------------------
//
// Real files:
// - www-le-customer/src/client/middlewares/apiMiddleware.ts
// - www-le-customer/src/client/actions/actionConstants.ts (API_CALL, etc.)
//
// Pattern: the action carries a *function* that returns a Promise, not the
// Promise itself. Middleware invokes it once, then dispatches SUCCESS/FAILURE.

const API_CALL = 'API_CALL'
const API_CALL_REQUEST = 'API_CALL_REQUEST'
const API_CALL_SUCCESS = 'API_CALL_SUCCESS'
const API_CALL_FAILURE = 'API_CALL_FAILURE'

const FETCH_POINTS = 'FETCH_POINTS' // real code: constants in apiActionConstants.ts

/** What you dispatch from a thunk */
function exampleFetchPointsAction() {
  return {
    type: API_CALL,
    api: FETCH_POINTS,
    request: () => requestPointsCalculation(199, 'AUD'),
  }
}

/** Simplified middleware behavior */
function describeApiMiddlewareFlow(): void {
  const action = exampleFetchPointsAction()
  if (action.type !== API_CALL) return

  // 1. dispatch API_CALL_REQUEST  → reducer sets fetching: true
  console.log('dispatch', API_CALL_REQUEST, action.api)

  action
    .request()
    .then((data) => {
      // 2. dispatch API_CALL_SUCCESS → reducer stores data
      console.log('dispatch', API_CALL_SUCCESS, data)
    })
    .catch((error) => {
      // 3. dispatch API_CALL_FAILURE → reducer stores error (client only in theirs)
      console.log('dispatch', API_CALL_FAILURE, error)
    })
}

// -----------------------------------------------------------------------------
// D. svc-payment style route — @luxuryescapes/router (declarative)
// -----------------------------------------------------------------------------
//
// Real example: svc-payment/src/api/v2/stripe/paymentIntents/index.ts
//
// Each route is an object: url, operationId, schema, preHandlers, handlers.
// operationId ties into OpenAPI / Handler<operations, 'createPaymentIntent'>.

/*
import { RouterAbstraction } from '@luxuryescapes/router';
import * schema from './schema';
import * controller from './controller';
import { verifyUser } from '...';

const basePathV2 = '/api/payments/v2';

export const mount = (router: RouterAbstraction): void => {
  router.post({
    url: `${basePathV2}/stripe/payment-intents`,
    operationId: 'createPaymentIntent',
    isPublic: true,
    schema: schema.createPaymentIntent,
    preHandlers: [verifyUser()],
    handlers: [controller.createPaymentIntent],
    summary: 'Creates a Stripe Payment Intent',
  });
};
*/

// -----------------------------------------------------------------------------
// E. svc-order style route — express.Router (imperative)
// -----------------------------------------------------------------------------
//
// Real: svc-order/src/server.js → app.use('/api', apiV1)
//      svc-order/src/api/v1/routes.js → router.get/post + auth + controllers

/*
const express = require('express');
const router = express.Router();
const auth = require('@luxuryescapes/lib-auth-middleware');

router.post(
  '/orders/:orderId/items',
  auth.verifyUser({ fetchUserDetails: true }),
  validateBody(someSchema),
  itemsController.createItem,
);

module.exports = router;
*/

// -----------------------------------------------------------------------------
// F. End-to-end story (one sentence per hop)
// -----------------------------------------------------------------------------
//
// 1. User clicks "Pay" in React → thunk dispatches API_CALL with request: () => api.post(...)
// 2. requestUtils issues POST https://API_HOST/... (gateway may route to svc-payment)
// 3. svc-payment router validates schema → preHandlers (auth) → controller → Stripe/DB
// 4. SUCCESS action updates Redux → UI shows confirmation
//
// svc-order is the same idea: customer hits `/api/…` paths; gateway sends traffic
// to the order service; Express routes + controllers do the work.

void exampleDomainApiCall
void describeApiMiddlewareFlow
