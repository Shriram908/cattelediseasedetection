# Deployment readiness
- [x] Restrict private profile/role/report access and inspect signup initialization; repair missing existing farmer roles.
- [x] Authenticate and validate all AI endpoints; enforce cattle ownership.
- [x] Update vulnerable dependencies and add passing security regression tests.
- [x] Protect signed-in pages, clear account caches, fix launch copy and mobile usability.
- [x] Verify authenticated diagnosis/chat and saved records; document remaining launch checks in DEPLOYMENT_READINESS.md.
- [x] Review deep security findings and resolve identified issues.
- [ ] Report-by-email button (blocked: needs a sender email domain).
- [x] Add restricted admin diagnosis, signup and chatbot analytics.
- [x] Index disease references with full-dimension embeddings and switch diagnosis retrieval to semantic search.
- [ ] Verify authorization, semantic retrieval and the new screens.
- [x] Mobile number OTP login/signup alongside email (needs SMS provider turned on in Phone settings).
- [x] Keep code clean and modular (ongoing standard).

- [x] Razorpay ₹99 pay-per-diagnosis step on Report page (test mode)
- [x] Repair Razorpay order creation and verified recovery; ₹99 checkout, retry reuse and unpaid-order safeguards verified.
- [ ] Complete a manual Razorpay test payment through report unlock (requires customer checkout interaction); add webhook in Razorpay after Vercel redeploy.
- [x] Replace Lovable favicon with CattleCare icon (ships to Vercel via GitHub sync + redeploy)
