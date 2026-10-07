# OpenAI Presence

A free Windows companion that shows the exact OpenAI model you’re using (GPT-6 Astra, GPT-5.6 Sol, …), the project folder you’re working in, the Astra spiral artwork, and an elapsed timer on your Discord profile. Its sibling, [Anthropic Presence](https://github.com/findastra/anthropic-discord-presence), does the same for Claude, and both can show at once.

**[Open the app](https://findastra.github.io/openai-discord-presence/)** · **[Download for Windows](https://findastra.github.io/openai-discord-presence/downloads/openai-presence-windows.zip)**

## Use it

1. Download and extract the ZIP. Install [Node.js 24 or later](https://nodejs.org/en/download) if it is not already installed.
2. Double-click **Start OpenAI Presence.cmd**. Your browser opens the local controls. No npm install is needed.
3. In the [Discord Developer Portal](https://discord.com/developers/applications), create an application with any name (Discord blocks some brand names). The card's bold title always reads **OpenAI**: the app sends it with each update, in place of the application name.
4. Upload `public/astra-galaxy.png` under **Rich Presence → Art Assets**, named **astra_galaxy**. Copy the Application ID from General Information.
5. In the local app, expand **Connect to Discord**, paste the Application ID, and save.
6. Open Discord desktop, sign in, and enable activity sharing in Discord's settings. Choose **Start session** or **Automatic** in OpenAI Presence.

No bot token, API key, paid API, card, hosting subscription, or Discord server bot is required. Application creation may require Discord's terms acceptance. This project doesn't accept terms for you.

## Modes

- **Manual:** Starts an elapsed timer and stays on until Stop sharing or Quit app. Works while using Astra anywhere.
- **Automatic:** An experimental local adapter checks the latest non-archived primary Codex CLI/desktop task's model and update timestamp every five seconds. Shares when that task was updated in the last five minutes and names its exact model, for example **Using GPT-6 Astra** or **Using GPT-5.6 Sol**; hovering the galaxy shows the raw id (`gpt-6-astra`). Switching models keeps the timer running. Stops when stale or detection fails. It doesn't track foreground focus or measure exact model computation time. Background metadata updates can extend the window; long silent reasoning or reading can exceed it. Use Manual when this heuristic doesn't suit you.
- **Off:** Disconnects immediately. The app starts with sharing off unless you enable Automatic on startup.

The timer measures this companion's continuous active session, starting at detection or your manual click. It survives Discord reconnects, but resets after stopping, inactivity, mode changes, or app restart. Closing the browser tab leaves the companion running; **Quit app** stops it.

## Public site versus desktop companion

Like [Ghost Protocol](https://findastra.github.io/ghost-protocol/), the public page uses GitHub Pages and relative asset URLs. Anyone can preview the timer and download the companion. Preview controls are explicitly labeled and never claim to update Discord.

A hosted website cannot access Discord's local IPC pipe. Each visitor runs their own companion and configures their own free Discord Application ID. The site doesn't contact localhost automatically; **Open companion** navigates there only after a click.

## Privacy

The companion binds to `127.0.0.1` only, validates exact Host/Origin for changes, and has no external telemetry. Automatic mode opens the newest `~/.codex/state_N.sqlite` read-only and selects `model` and `updated_at`, with filters to exclude subagents and archived tasks. When project sharing is enabled, it reads the task folder and saved Codex project name locally and keeps only the folder's last name. It never sends full paths or reads prompts, titles, or transcripts. This database is an internal implementation detail and may change; failure hides the activity.

The public Discord Application ID, image key, project-sharing preference, and optional custom project name are stored in `.local/config.json`, which is ignored by Git and excluded from the ZIP. Session state is kept in memory. The Discord IPC handshake may contain account information; it is neither logged nor retained. The outbound presence payload contains activity text with the model name, timestamp, asset key, and the project name when enabled.

## Development

```sh
node --test
node src/server.js
```

The control panel runs at `http://127.0.0.1:38761/`. Optional `OPENAI_PRESENCE_PORT` changes the port when running the server directly; the click-to-run launcher always uses the default port. Don't open `public/index.html` to control Discord: file mode is a styled public preview with a link to the companion.

`node scripts/package.js` copies the public UI to `docs/` in hosted mode and builds an allowlisted ZIP. GitHub Pages serves `main` → `/docs`. There are no package dependencies or hosted compute functions. Changes are explained in [DEVELOPMENT.md](DEVELOPMENT.md).

## Artwork and references

The image is a still capture of the actual 6-shaped star field on [OpenAI's Astra launch page](https://openai.com/index/gpt-6-astra/), cropped to remove navigation and page text. The site adds subtle motion to the still; it does not reproduce the original interactive particle simulation. OpenAI retains rights to its artwork and marks. This independent fan companion is not an official OpenAI or Discord app. The code license does not license the third-party artwork.

Protocol references: [Discord Rich Presence](https://docs.discord.com/developers/discord-social-sdk/development-guides/setting-rich-presence), [Discord's IPC protocol notes](https://github.com/discord/discord-rpc/blob/master/documentation/hard-mode.md). This lightweight implementation uses the documented legacy local IPC protocol; compatibility with future Discord releases is not guaranteed.

## Project sharing

Enable **Show my project on Discord** in the local connection settings. Leave Project name blank to use the name of the folder the latest Codex chat works in (for example `Mommy's 2`), or enter a fixed friendly label. The activity reads **Working on [project]**; it never shows the chat title or the full path. Chats without a chosen folder run in Codex's dated scratch folders, so those show the chat's saved Codex project name instead, or generic activity if there is none. It follows metadata updates rather than window focus. When several chats are active at once, the card shows each project for 15 seconds in turn. Detection becomes generic after five minutes without recent Astra metadata. Sharing is opt-in for each installation.

The Discord app icon uses the original swirl without text. Animated Rich Presence images require an external hosted image URL according to Discord's documentation; uploaded presence assets are static. This version uses the static asset.

## Hands-free startup

After completing the connection setup, double-click **Enable Automatic Startup.cmd** once. It adds an OpenAI Presence launcher to your Windows user Startup folder and enables Automatic on startup. At your next Windows sign-in, the companion runs quietly with no browser or console window. Keep the extracted app folder in place. Discord desktop must also be running; the companion retries connecting when Discord becomes available.

Automatic mode detects recent Codex task metadata, not merely whether Codex is open. It hides activity after five minutes without a recent update. You can still stop sharing or quit from the local app. To prevent launch at sign-in, remove **OpenAI Presence.vbs** from the Windows Startup folder (Win+R, shell:startup), or run `node scripts/startup.js --remove`. The **Run on Windows startup** checkbox directly installs or removes the Windows startup entry.
