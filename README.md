# Tambayan Arcade

The home of every Pinoy browser game by Lemmuel Turaya. Tambay ka muna, laro tayo!

## Adding a game

Edit **`games.json`** only. The page builds itself from it: the featured game, the cards, the genre filters and "Bago!" badges (for two weeks after `added`).

1. Put a 1600×900 screenshot in `thumbs/<id>.webp`.
2. Add an entry to `games.json`:

```json
{
  "id": "my-game",
  "title": "My Game",
  "tagline": "One short line",
  "description": "One or two sentences.",
  "genre": "Arcade",
  "tags": ["Action"],
  "url": "https://my-game.vercel.app/",
  "mirror": null,
  "repo": "https://github.com/kon2raya24/my-game",
  "thumb": "thumbs/my-game.webp",
  "controls": "Keyboard · Touch",
  "status": "live",
  "added": "2026-10-01"
}
```

3. Run `node --test test/*.test.mjs`. It checks every entry is complete and its thumbnail exists.

`status` is `live` or `prototype`. Live games come first, newest first, and the newest live game is featured at the top.

## Support

The **Suportahan** button shows an InstaPay QR (`donate/qr.png`). The games are free either way.

## Run locally

```sh
python3 -m http.server 8000
```

Made by [Lemmuel Turaya](https://kon2raya.netlify.app).
