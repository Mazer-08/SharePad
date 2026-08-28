# SharePad — Project Roadmap

An ephemeral, code-based sharing workspace. Two browsers open the same Share URL and behave like one synchronized workspace.

**Stack assumption:** Spring Boot backend, WebSockets for realtime, Cloudflare R2 for object storage.

---

## Roadmap overview

```
PHASE 1
Share creation + URL navigation
        ↓
PHASE 2
Realtime text synchronization
        ↓
PHASE 3
Realtime file synchronization
        ↓
PHASE 4
6-hour expiry + password
        ↓
PHASE 5
Performance, security & production hardening
```

The ordering is deliberate: prove the fundamental idea first (two browsers, one synchronized workspace), then layer the ephemeral/security concerns on top.

---

## Phase 1 — Share creation & navigation

### Home screen

```
┌──────────────────────────────────────┐
│                                      │
│              SharePad                │
│                                      │
│         [ Create New Share ]         │
│                                      │
│  ─────────────── OR ──────────────   │
│                                      │
│       [ Enter share code       ]     │
│              [ Open Share ]          │
│                                      │
└──────────────────────────────────────┘
```

Two actions: **New Share** and **Open Share**.

### New Share

```
POST /api/v1/newShare
```

Backend:

```
Generate unique code
       ↓
Create Share record
       ↓
Return code
```

Response:

```json
{
  "code": "aX72kp"
}
```

Frontend then navigates to:

```
/share/aX72kp
```

### Open Share

User enters a code (`aX72kp`). Frontend calls:

```
GET /api/v1/share/aX72kp
```

| Result | Behaviour |
| --- | --- |
| `200` | Navigate to `/share/aX72kp` |
| `404` | Show "Share not found" |

### Architectural note — separate API responsibility from navigation

The original design had both buttons calling redirect APIs. Instead, the API should return **data**, and the frontend should own **navigation**.

Creating:

```
Click "New Share"
        │
        ▼
POST /api/v1/newShare
        │
        ▼
{ "code": "aX72kp" }
        │
        ▼
Frontend navigates to
/share/aX72kp
```

Opening:

```
Enter code
     │
     ▼
GET /api/v1/share/aX72kp
     │
     ├── 200 → navigate to /share/aX72kp
     │
     └── 404 → show error
```

The backend doesn't need to perform the browser redirect itself. This separation pays off in later phases (the same endpoints will be consumed by the WebSocket handshake, and eventually by password-gated access).

### Phase 1 done when

- A new share can be created and its code returned.
- A valid code navigates to the share URL.
- An invalid code shows a clear error.

---

## Phase 2 — Realtime text

Once Phase 1 works, both screens can open the same URL:

```
/share/aX72kp
```

Then:

```
Screen 1
   │
   │ type text
   ▼
Backend
   │
   │ realtime event
   ▼
Screen 2
```

…and vice versa. This is where WebSockets are introduced.

### Goal

> Anything typed on Screen 1 appears on Screen 2, and anything typed on Screen 2 appears on Screen 1.

No files yet.

### Phase 2 done when

- A WebSocket connection is established per share code.
- Text edits propagate bidirectionally between clients on the same share.
- A client joining late receives the current text state.

---

## Phase 3 — Realtime files

Upload path:

```
Screen 1
   │
   │ Drop file
   ▼
Backend
   │
   │ presigned URL
   ▼
Screen 1
   │
   │ direct upload
   ▼
R2
```

Once the upload completes:

```
R2
 │
 ▼
Backend
 │
 │ WebSocket event
 ▼
Screen 2
```

Screen 2 renders:

```
📄 report.pdf
   180 MB

   [Download]
```

Downloads eventually go **directly from R2 → Screen 2**, not through Spring Boot. The application server only ever handles metadata and signing — never file bytes.

### Phase 3 done when

- A dropped file uploads directly to R2 via a presigned URL.
- The other screen receives a file event and shows name + size.
- Download streams from R2, not through the backend.

---

## Phase 4 — Expiry & password

Now the ephemeral/security layer goes on top of a working core.

- **6-hour expiry** — shares (and their R2 objects) are deleted after their lifetime elapses.
- **Password protection** — optional password set at creation; required before the share URL yields content.

Considerations:

- Expiry needs both a lazy check (on access) and a sweeper (to reclaim R2 storage).
- Password gating must apply to the WebSocket handshake too, not just the HTTP endpoints — otherwise the realtime channel is an open back door.

### Phase 4 done when

- An expired share returns "not found" and its objects are gone from R2.
- A password-protected share rejects HTTP *and* WebSocket access without valid credentials.

---

## Phase 5 — Performance, security & production hardening

- Rate limiting on share creation and upload signing.
- Code entropy / collision handling and brute-force resistance on share codes.
- Upload size limits and content-type handling.
- WebSocket connection limits, heartbeats, and reconnection with state resync.
- Observability: metrics, structured logging, error tracking.
- CORS, headers, and TLS configuration.
- Load testing on realtime fan-out and large-file paths.
