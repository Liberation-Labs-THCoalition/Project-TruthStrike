# Community Layer — Design

Goal: give community organizers and local journalists shared eyes without
building a platform that can be captured, subpoenaed, or brigaded.

## Architecture: federated small instances, no mothership

There is no global TruthStrike server. Communities run their own relay
(`server/`): a local newsroom, a press association, a library system, a
university lab. The extension can subscribe to multiple instances; each is a
trust decision the user makes explicitly, like adding an RSS feed.

Why: a single global annotation database is a honeypot (legal and technical)
and a single moderation regime (political). Twenty newsroom-scale instances
are boring targets and can disagree with each other — which is healthy.

## Roles

- **Reader** (no key): sees annotations for pages they visit, if they've
  subscribed to an instance. Lookup is by URL hash.
- **Contributor** (client-side keypair): writes annotations with mandatory
  https sources; votes. Reputation is per-instance, attached to pubkey.
- **Trusted reporter** (badged pubkey): verified out-of-band by the instance
  operator — a phone call, a newsroom visit; deliberately human, deliberately
  local. Their annotations sort first and render with outlet attribution.
- **Operator**: runs the instance, sets moderation policy, verifies reporters.
  Operators are named humans with reputations, not a trust & safety org chart.

## Anti-capture properties

- **Brigading**: votes are per-pubkey per-annotation; instances can require
  proof-of-work on key registration or invite-graphs. Sorted-by-verified
  keeps a vote flood from displacing a badged local reporter.
- **Subpoena surface**: URL hashes, pubkeys, annotation text. No IPs in
  application logs, no emails, no browsing histories, page content never
  arrives. The worst full compromise reveals what was already public speech.
- **Moderation**: instance-local. An annotation removed on one instance may
  stand on another. The extension shows which instance said what.

## Whistleblower stance (final)

The relay **refuses submissions** and returns pointers to the SecureDrop
directory and Freedom of the Press Foundation training. A browser extension
sitting next to someone's logged-in workday browsing is the wrong device,
wrong network, and wrong custody chain for leaks. Doing this "conveniently"
would get a source hurt. Not negotiable.

## Annotation ≠ community notes theater

Rules learned from Birdwatch/Community Notes:

1. Sources are mandatory (https, max 5) — an annotation is a citation
   bundle, not a comment.
2. No reply threads. Annotations stand alone; disagreement is a competing
   annotation. Kills flame-war mechanics at the schema level.
3. Votes rank, they don't hide. Nothing is suppressed by downvotes;
   badged-reporter and score ordering is transparent.

## Rollout plan

1. **Pilot (1 instance)**: one partner newsroom, 5–10 verified reporters,
   readers from their existing community. Validate the verification workflow
   and moderation load.
2. **Server-side signature enforcement** (ed25519) — schema is ready.
3. **Instance directory**: a signed JSON list in the repo, curated by PR —
   the "add an instance" UX is paste-a-URL either way.
4. **Federation niceties later**: cross-instance annotation mirroring only
   if pilots demand it. Resist building ActivityPub for its own sake.
