# Architecture rules
- Keep private pages under RequireAuth and clear query caches on account changes to prevent stale cross-account data.
- All AI functions authenticate in code, validate bounded inputs, and use the caller-scoped data client so row policies enforce ownership.
- Keep reusable edge-function request handling and pure validators in _shared so deployed imports remain self-contained.
- Assign signup roles exclusively through the protected server trigger; never trust client role metadata.
- Validate cattle image types and sizes consistently across upload screens; hosted image URLs remain publicly shareable by existing design.
- Run focused security regression tests with the package test command before reporting readiness.
- Gate admin screens with the server is_admin check (RequireAdmin) and rely on row policies for data; never trust client role state.
- Phone OTP is passwordless sign-in/sign-up; the signup trigger copies the verified phone into profiles.
- Diagnosis reports start locked (reports.unlocked); only the razorpay-payment function unlocks them after verifying the Razorpay signature, so paid content is never readable client-side.
