# Unknot — Future Roadmap

Items deferred from MVP, to be revisited in v1.1+.

## Auth
- [ ] Google OAuth provider (Auth.js + Google credentials)
- [ ] Email/password auth (credentials provider + bcrypt + password reset flow)

## Audio & Voice
- [ ] ElevenLabs TTS integration for vocabulary pronunciation
- [ ] Audio generation worker (`audio.job.ts`)
- [ ] Audio playback on flashcard + vocabulary views
- [ ] Signed R2 URL delivery via `audio.getUrl` tRPC endpoint

## AI & Processing
- [ ] Background job queue (BullMQ + Redis worker) for heavy unknotting
- [ ] Batch unknotting — select multiple notes and process together
- [ ] Duplicate detection — detect vocab items the user has already captured
- [ ] Merge duplicate flashcards intelligently (keep best example sentence, etc.)

## Flashcards & Study
- [ ] Thumbs up/down feedback on flashcards for quality tracking
- [ ] Study statistics dashboard (streak, cards reviewed, accuracy, etc.)
- [ ] Flashcard management page — bulk archive, merge, edit cards
- [ ] Export to Anki / Quizlet / Google Sheets

## Sessions & Organization
- [ ] Full session CRUD — first-class grouping entity (e.g., "German B2 - Unit 4")
- [ ] Migrate from simple `language` + `label` to session-based grouping

## Design
- [ ] Proper design system / component library definition
- [ ] Design review with a designer
- [ ] Custom illustrations / branding
- [ ] Onboarding flow / tutorial for new users

## Capture
- [ ] Image-to-note (OCR from whiteboard/textbook photos)
- [ ] Browser extension — highlight text on any website to send to buffer

## Infrastructure
- [ ] Dockerize the full app for production (app + worker containers)
- [ ] CI/CD pipeline
- [ ] Mobile native app (React Native / Expo) — v2
