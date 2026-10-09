// ============================================================
//  Deeprowss site content — edit this file, not index.html.
// ============================================================
window.DEEPROWSS = {
  // Real APK link (e.g. a GitHub Release asset URL). Used by every download button.
  apkUrl: "https://archive.org/download/deeprowss-v-1-1_202610/Deeprowss_v1%5B1%5D.apk",
  supportEmail: "deeprows@gmail.com",

  // Add screenshots as { src: "assets/shot-1.webp", alt: "Home screen" }.
  // With an empty list, labelled placeholders are shown.
  screenshots: [],

  // Matches: use a real kickoff date/time ("2026-10-10T20:00") or, for sample
  // data, `inDays` (days from today) + `time`. Past matches are hidden automatically.
  matches: [
    { home: "Team A", away: "Team B", inDays: 0, time: "20:00" },
    { home: "Team C", away: "Team D", inDays: 1, time: "18:30" },
    { home: "Team E", away: "Team F", inDays: 2, time: "21:00" }
  ],

  // Movies: add `image: "https://…/poster.jpg"` or `poster: "assets/poster.webp"` to show a poster.
  movies: [
    { title: "Movie Title One",   year: 2026 },
    { title: "Movie Title Two",   year: 2026 },
    { title: "Movie Title Three", year: 2026 },
    { title: "Movie Title Four",  year: 2026 }
  ]
};
