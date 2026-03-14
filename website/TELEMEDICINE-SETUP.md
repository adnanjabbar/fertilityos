# Telemedicine (video) setup

Video calls are powered by [Daily.co](https://daily.co). Staff can start or join a video call from an appointment that supports video (consultation, follow-up, or video).

## Flow

1. Open an appointment (type **Consultation**, **Follow-up**, or **Video call**).
2. Click **Start video call**. The first time, a Daily.co room is created and the room URL is stored on the appointment.
3. The meeting URL opens in a new tab. Share the same link with the patient so they can join.
4. Next time you open that appointment, the button shows **Join video call** and reuses the same room URL.

## Environment

| Variable        | Required | Description |
|----------------|----------|-------------|
| `DAILY_API_KEY` | Yes (for video) | API key from [Daily dashboard](https://dashboard.daily.co) → Developers. If unset, the "Start video call" button will still appear but the API returns 503 and the UI shows an error. |

## API

- **POST /api/app/appointments/[id]/video-room**  
  Creates a Daily.co room for the appointment (or returns the existing room URL). Requires staff session.  
  - If the appointment already has a `video_room_id`, returns `{ url }` without calling Daily.  
  - Otherwise creates a room with name `fertilityos-{appointmentId}`, privacy `private`, and 24h expiry; saves the returned URL on the appointment; returns `{ url }`.  
  - If `DAILY_API_KEY` is missing, returns 503.

## Schema

- **appointments.video_room_id** (varchar, nullable) – Stores the Daily.co meeting URL. Set by the video-room API when a room is first created. Migration: `0012_patient_portal_and_video.sql`.

## Security

- Room creation is server-side only; the API key is never exposed to the client.
- Rooms are created with `privacy: "private"` and an expiration (24 hours from creation). You can adjust expiry in the API route if needed.
