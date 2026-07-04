# TruthStrike Community Relay (prototype)

The **optional** community layer. The extension never needs it — detection,
money trails, counter-narratives, and coordination analysis are all local.
This server exists so communities that *want* shared annotation can run their
own instance: a local newsroom, a press association, a university lab.

## What it does

- **Community annotations** on pages, addressed by SHA-256 of the URL (the
  server never sees URLs, only hashes; the client hashes locally)
- **Voting** with pseudonymous client-side keypairs
- **Trusted reporter badges** — instance operators verify local journalists
  out-of-band and badge their public key; verified annotations sort first
- **DP-noised trend aggregates** — opt-in daily "technique X was flagged"
  counts with Laplace noise (ε=1.0), so the community can see what's surging
  without anyone's browsing being reconstructable
- **Whistleblower pointers only** — submissions are *refused* and redirected
  to SecureDrop/GlobaLeaks. We will not roll our own leak platform.

## What it deliberately does not do

- No accounts, no emails, no IP logging in application code
- No page content ever arrives here
- No global instance: federation of small trusted instances, not a platform

## Run

```bash
pip install fastapi uvicorn
uvicorn app:app --port 8321
```

## Status

Prototype. Signature verification (ed25519 over annotation payloads) is
schema-ready but enforcement is client-side only in this version; server-side
verification is the first hardening task before any public deployment. See
`docs/COMMUNITY_LAYER.md` for the full design including moderation model and
federation plan.
