# Vicity

## Elevate your situational awareness

Vicity is location-first social networking. Your feed and what you post are driven by what's happening around you, not who you follow.

## Use cases

- community event
- concert
- yard sale
- ice cream truck
- promotion
- lost and found
- wildlife citing
- lost pet citing
- long line
- accident
- construction
- road closure
- speed trap
- hazard
- police presence
- suspicious activity

## v1

- Anonymous reading of posts in your vicinity
- Real-time feed updates as you move
- Post creation for authenticated users
- Posts can include text and photos
  - Optional labels
  - Optional duration and radius overrides
- Feed filtering (labels)
- AI moderation covering spam, inappropriate, and illegal content

## vNext

- Premium tier to lift proximity limitation, unlock access to historic posts
- Blur faces, license plates, etc in photos
- Admin review tooling for flagged posts, photo moderation expansion, and abuse analytics
- Post location follows poster (eg, ice cream truck)
- Subscribe to alerts based on interests

## Stack

### Front

- Next.js App Router
- [Radix UI](https://www.radix-ui.com/)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- TypeScript
- Tailwind
- Zod

### Back

- Supabase with PostGIS for persistence and geospatial queries
- Supabase Auth for passwordless email-based auth
- Supabase Storage for photo uploads
- bigdatacloud.net API for location names
- OpenAI for moderation and spam review
