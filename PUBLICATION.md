# Publication verification — 2026-09-13

- Published companion build: 8a69852, findastra/openai-discord-presence main.
- Live website: https://findastra.github.io/openai-discord-presence/
- Windows ZIP: https://findastra.github.io/openai-discord-presence/downloads/openai-presence-windows.zip
- Verified HTTP 200 for the page, JavaScript, stylesheet, swirl image, and Windows ZIP.
- Live ZIP SHA-256 matched the local packaged build exactly. ZIP contains 16 allowlisted files, including automatic startup setup, and no local configuration.
- Reloaded the public page and visually verified its styled interface and download controls.
- Eight automated tests passed. The user's running companion acknowledged actual Discord activity with the current project, and the Windows sign-in launcher was exercised successfully.
- Other users need Windows, Node.js 24+, Discord desktop, their own application connection setup, and optional one-time startup setup. Browser preview alone does not publish Discord activity.
- Automatic detection follows recent primary Astra task metadata, not foreground focus. Shared project names come from workspace folder names unless overridden. Animated imagery is not enabled; the icon is the original text-free swirl.
