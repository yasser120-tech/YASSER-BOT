# YASSER TECH WhatsApp Bot

Simple WhatsApp bot using Baileys (Multi-Device). Includes sticker maker, YouTube download, group tools, and basic commands.

## Setup

1. Install **Node 18+**.
2. Clone this repository.
3. Run `npm install` to install dependencies.
4. Create a `.env` file (see `.env` example in repo).
5. Run the bot:
   - For development: `npm run dev`
   - For production: `npm start`
6. On first run, scan the QR code shown in the terminal (or logs on Render) to link your WhatsApp. Session will be saved automatically in `SESSION_FILE`.

## Deploy

Recommended platforms: **Render**, **Railway**, or any VPS.  
⚠️ Do not use Vercel for WhatsApp bots — it does not support long-running processes.

## Features

- Auto-reply greetings.
- `.help` command to list all commands.
- `.ping` to check bot is alive.
- `.say <text>` makes the bot repeat text.
- `.sticker` converts image/video to sticker (reply to media).
- `.yt <url>` downloads YouTube video.
- `.yta <url>` downloads YouTube audio (mp3).
- `.tagall` mentions all group members.
- `.kick <@number>` removes a member (bot must be admin).

## Notes

- Do **not** commit your `.env` or session files to public repositories.
- Session files are required for multi-device authentication.
