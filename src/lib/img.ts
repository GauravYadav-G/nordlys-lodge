/**
 * Image resolver for standalone flagship websites.
 * Bundled photographs are inlined at build time.
 * If local file isn't bundled, resolves to curated high-resolution photography.
 */
const bundled = import.meta.glob<{ default: string }>("../assets/images/*.{jpg,jpeg,png}", {
  eager: true,
});

const lookup: Record<string, string> = {};
for (const path in bundled) {
  const file = path.split("/").pop();
  if (file) lookup[file] = bundled[path].default;
}

const FALLBACK_PICS: Record<string, string> = {
  // Pelagic deep-sea imagery
  "jelly-sunlit.jpg": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
  "jelly-moon.jpg": "https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=1200&q=80",
  "jelly-glow.jpg": "https://images.unsplash.com/photo-1545671913-b89ac1b4ac10?auto=format&fit=crop&w=1200&q=80",
  "jelly-spots.jpg": "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80",
  "jelly-deep.jpg": "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1200&q=80",

  // Nordlys fjord & cabin imagery
  "fjord-winter.jpg": "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1600&q=85",
  "fjord-summer.jpg": "https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?auto=format&fit=crop&w=1600&q=85",
  "fjord-cabin-blue.jpg": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
  "fjord-cabin-green.jpg": "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=85",
  "fjord-cabin-red.jpg": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=85",
  "fjord-aerial.jpg": "https://images.unsplash.com/photo-1516466723877-a4bc14b60f87?auto=format&fit=crop&w=1600&q=85",
  "fjord-mist.jpg": "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1600&q=85",
  "fjord-lake.jpg": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85",

  // Argile ceramics imagery
  "clay-rows.jpg": "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=85",
  "clay-bud.jpg": "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1200&q=85",
  "clay-ochre.jpg": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=85",
  "clay-ribbed.jpg": "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=85",
  "clay-duo.jpg": "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=1200&q=85",
  "clay-terra.jpg": "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1200&q=85",
  "clay-potter.jpg": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=85",
  "clay-detail.jpg": "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=85",
  "clay-studio.jpg": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=85",
};

/** A bundled image by filename (falls back to local /images/ or curated CDN). */
export function img(file: string): string {
  if (lookup[file]) return lookup[file];
  if (FALLBACK_PICS[file]) return FALLBACK_PICS[file];
  return `/images/${file}`;
}

/** A Pexels photo by id — bundled copy if present, remote URL otherwise. */
export function px(id: number, w = 800, h = 1200): string {
  return (
    lookup[`px-${id}.jpg`] ??
    `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=${h}&w=${w}`
  );
}
