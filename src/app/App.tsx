import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { GridFour } from "@phosphor-icons/react/GridFour";
import { ListBullets } from "@phosphor-icons/react/ListBullets";
import { SidebarSimple } from "@phosphor-icons/react/SidebarSimple";
import { SlidersHorizontal } from "@phosphor-icons/react/SlidersHorizontal";
import { Play } from "@phosphor-icons/react/Play";
import { Pause } from "@phosphor-icons/react/Pause";
import { Stop } from "@phosphor-icons/react/Stop";
import { SkipBack } from "@phosphor-icons/react/SkipBack";
import { SkipForward } from "@phosphor-icons/react/SkipForward";
import { Shuffle } from "@phosphor-icons/react/Shuffle";
import { DownloadSimple } from "@phosphor-icons/react/DownloadSimple";
import { AudioVisualizer } from "./AudioVisualizer";
import { loadCatalog } from "../api/catalog";

type Track = {
  id?: string;
  title: string;
  artist: string;
  file: string;
  downloadUrl?: string;
  streamUrl?: string | null;
  sourceUrl?: string | null;
  duration: string;
  tag: string;
  hashtags?: string[];
  permalink?: string;
  description?: string;
  subtitle?: string;
  privacy?: "public" | "private" | "followers";
  containsMusic?: boolean;
  postAuthor?: string;
  isrc?: string;
  composer?: string;
  releaseTitle?: string;
  purchaseMode?: "link" | "artist_store";
  purchaseUrl?: string;
  purchaseTitle?: string;
  albumTitle?: string;
  recordLabel?: string;
  releaseDate?: string;
  barcode?: string;
  iswc?: string;
  pLine?: string;
  explicit?: boolean;
  license?: "all_rights_reserved" | "creative_commons";
  cover?: string | null;
  panoramicCover?: string | null;
  lyrics?: string;
  hasLyrics?: boolean;
  warnings?: string[];
  localStatus?: "available" | "recoverable";
  localFormat?: "mp3" | "wav" | null;
  source?: "usb" | "soundcloud" | "suno";
  availabilityStatus?: "local" | "stream" | "recoverable" | "locate";
  preferredSource?: "suno" | "soundcloud" | null;
  preferredAction?: string;
  rating?: number;
  sunoCandidates?: Array<{
    id: string;
    title: string;
    duration: string;
    url: string;
    page?: number;
  }>;
  visualTheme?: VisualTheme;
  ownership?: { status?: ReviewStatus } | null;
  soundcloudUrl?: string | null;
  soundcloudId?: string | null;
};
type ReviewStatus = "belongs" | "reject" | "later";
type LayoutMode = "combined" | "grid" | "review" | "focus" | "winamp";
type MotionMode = "full" | "reduced" | "off";
type SortMode = "catalog" | "rating-desc" | "rating-asc" | "title-asc" | "title-desc" | "plays-desc" | "plays-asc" | "genre-asc" | "genre-desc";
type PlaybackHistoryEntry = {
  trackKey: string;
  title: string;
  artist: string;
  playedAt: number;
};
type VisualPreset = "sunset" | "dawn" | "violet" | "ember";
type VisualTheme = {
  preset: VisualPreset;
  accentA: string;
  accentB: string;
  accentC: string;
  glow: string;
  panelGlow: string;
  discGlow: string;
  buttonGlow: string;
  speed: number;
};
const CATALOG_IDENTITY = {
  artist: "Iyari Gomez",
  postAuthor: "Iyari Cancino Gomez",
  recordLabel: "BlackMamba RECORDS",
} as const;
const VISUAL_PRESETS: Record<VisualPreset, VisualTheme> = {
  sunset: {
    preset: "sunset",
    accentA: "#ff7a2f",
    accentB: "#ff4f8f",
    accentC: "#7f5bff",
    glow: "#ffb07c",
    panelGlow: "#ffb36a",
    discGlow: "#d65327",
    buttonGlow: "#ff6a2a",
    speed: 7.5,
  },
  dawn: {
    preset: "dawn",
    accentA: "#ffb36a",
    accentB: "#ff6f91",
    accentC: "#8f92ff",
    glow: "#ffd9ad",
    panelGlow: "#ffc888",
    discGlow: "#ea7b3b",
    buttonGlow: "#ff8a4b",
    speed: 6.5,
  },
  violet: {
    preset: "violet",
    accentA: "#7c6bff",
    accentB: "#d46bff",
    accentC: "#ff7ca8",
    glow: "#c7b7ff",
    panelGlow: "#b48cff",
    discGlow: "#8f6bff",
    buttonGlow: "#9b66ff",
    speed: 5.5,
  },
  ember: {
    preset: "ember",
    accentA: "#ff6a2a",
    accentB: "#ff9341",
    accentC: "#ff4f4f",
    glow: "#ffbb8a",
    panelGlow: "#ff9341",
    discGlow: "#ff4d2e",
    buttonGlow: "#ff4f4f",
    speed: 4.5,
  },
};
const themes = [
  {
    accent: "#cbff38",
    accent2: "#50e3c2",
    surface: "#151d16",
    glow: "#8dff36",
  },
  {
    accent: "#ff4fd8",
    accent2: "#8b5cff",
    surface: "#211327",
    glow: "#ff48e1",
  },
  {
    accent: "#ff7a36",
    accent2: "#ffd447",
    surface: "#241710",
    glow: "#ff9e3d",
  },
  {
    accent: "#35b8ff",
    accent2: "#6f72ff",
    surface: "#101a2b",
    glow: "#3fc8ff",
  },
  {
    accent: "#ff405e",
    accent2: "#ff8b6b",
    surface: "#251116",
    glow: "#ff506d",
  },
  {
    accent: "#b86cff",
    accent2: "#4de8ff",
    surface: "#191329",
    glow: "#bd72ff",
  },
  {
    accent: "#f7ef5a",
    accent2: "#6cff84",
    surface: "#20210f",
    glow: "#f7ef5a",
  },
  {
    accent: "#ff9bcf",
    accent2: "#75d5ff",
    surface: "#241827",
    glow: "#ff9bcf",
  },
];
const hashtagOptions = [
  "#reggae",
  "#dub",
  "#dancehall",
  "#rap",
  "#hiphop",
  "#cumbia",
  "#edm",
  "#electronic",
  "#electronica",
  "#electro",
  "#idm",
  "#industrial",
  "#ebm",
  "#psytrance",
  "#goatrance",
  "#trance",
  "#progressivetrance",
  "#upliftingtrance",
  "#hardtrance",
  "#techno",
  "#minimaltechno",
  "#melodictechno",
  "#acidtechno",
  "#hardtechno",
  "#house",
  "#deephouse",
  "#techhouse",
  "#progressivehouse",
  "#electrohouse",
  "#futurehouse",
  "#basshouse",
  "#tropicalhouse",
  "#afrohouse",
  "#discohouse",
  "#drumandbass",
  "#jungle",
  "#dubstep",
  "#brostep",
  "#riddim",
  "#trap",
  "#futurebass",
  "#breakbeat",
  "#ukgarage",
  "#hardstyle",
  "#hardcore",
  "#gabber",
  "#ambient",
  "#downtempo",
  "#triphop",
  "#synthwave",
  "#retrowave",
  "#vaporwave",
  "#chillwave",
  "#rock",
  "#metal",
  "#pop",
  "#cinematic",
  "#experimental",
  "#instrumental",
  "#vocal",
  "#acoustic",
  "#live",
];

const initialTracks: Track[] = [
  {
    title: "Mundo Entero",
    artist: CATALOG_IDENTITY.artist,
    file: "/music/mundo-entero.mp3",
    duration: "3:20",
    tag: "Single",
  },
  {
    title: "Ganja Love",
    artist: CATALOG_IDENTITY.artist,
    file: "/music/ganja-love.mp3",
    duration: "2:57",
    tag: "Original",
  },
  {
    title: "Raquel HF",
    artist: CATALOG_IDENTITY.artist,
    file: "/music/raquel-hf.mp3",
    duration: "3:15",
    tag: "Studio",
  },
  {
    title: "Fancy Boy (Flight Mode)",
    artist: CATALOG_IDENTITY.artist,
    file: "/music/fancy-boy.mp3",
    duration: "3:20",
    tag: "Studio",
  },
  {
    title: "Studio Selection 12",
    artist: CATALOG_IDENTITY.artist,
    file: "/music/studio-selection-12.mp3",
    duration: "4:04",
    tag: "Session",
  },
];

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
};
import { loadProfile, saveRatings } from "../storage/local-profile";

const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();

export function App() {
  const audio = useRef<HTMLAudioElement>(null);
  const trackRows = useRef(new Map<string, HTMLDivElement>());
  const themeReady = useRef(false);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [volume, setVolume] = useState(0.8);
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState<
    "all" | "pending" | ReviewStatus
  >("all");
  const [sortMode, setSortMode] = useState<SortMode>("catalog");
  const [openLyrics, setOpenLyrics] = useState<string | null>(null);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Track>>({});
  const [themeIndex, setThemeIndex] = useState(1);
  const [layout, setLayout] = useState<LayoutMode>("combined");
  const [motion, setMotion] = useState<MotionMode>("full");
  const [downloadingTrack, setDownloadingTrack] = useState<Record<string, number>>({});
  const [visibleCount, setVisibleCount] = useState(60);
  const [reviews, setReviews] = useState<Record<string, ReviewStatus>>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("blackmamba-vitrine-reviews") ?? "{}",
      );
    } catch {
      return {};
    }
  });
  const [ratings, setRatings] = useState<Record<string, number>>(() => loadProfile().ratings);
  const [playbackHistory, setPlaybackHistory] = useState<
    PlaybackHistoryEntry[]
  >(() => {
    try {
      return JSON.parse(
        localStorage.getItem("blackmamba-playback-history") ?? "[]",
      );
    } catch {
      return [];
    }
  });
  const trackKey = (item: Track) => item.id ?? item.file;
  
  const playCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of playbackHistory) {
      counts[entry.trackKey] = (counts[entry.trackKey] || 0) + 1;
    }
    return counts;
  }, [playbackHistory]);

  const filtered = useMemo(() => {
    const matchingTracks = tracks.filter((item) => {
      const matchesQuery = normalizeSearch(
        `${item.title} ${item.artist} ${item.file} ${item.sourceUrl ?? ""} ${(item.hashtags ?? []).join(" ")} ${item.description ?? ""} ${item.albumTitle ?? ""} ${item.composer ?? ""} ${item.isrc ?? ""} ${item.lyrics ?? ""}`,
      ).includes(normalizeSearch(deferredQuery));
      const status = reviews[trackKey(item)];
      return (
        matchesQuery &&
        (reviewFilter === "all" ||
          (reviewFilter === "pending" ? !status : status === reviewFilter))
      );
    });
    if (sortMode === "catalog") return matchingTracks;
    return matchingTracks
      .map((item, index) => ({ item, index }))
      .sort((left, right) => {
        if (sortMode === "title-asc" || sortMode === "title-desc") {
          const diff = left.item.title.localeCompare(right.item.title);
          if (diff === 0) return left.index - right.index;
          return sortMode === "title-asc" ? diff : -diff;
        }
        if (sortMode === "plays-asc" || sortMode === "plays-desc") {
          const leftPlays = playCounts[trackKey(left.item)] || 0;
          const rightPlays = playCounts[trackKey(right.item)] || 0;
          const diff = leftPlays - rightPlays;
          if (diff === 0) return left.index - right.index;
          return sortMode === "plays-asc" ? diff : -diff;
        }
        if (sortMode === "genre-asc" || sortMode === "genre-desc") {
          const diff = (left.item.tag || "").localeCompare(right.item.tag || "");
          if (diff === 0) return left.index - right.index;
          return sortMode === "genre-asc" ? diff : -diff;
        }
        const difference =
          (ratings[trackKey(left.item)] ?? 0) -
          (ratings[trackKey(right.item)] ?? 0);
        if (difference === 0) return left.index - right.index;
        return sortMode === "rating-desc" ? -difference : difference;
      })
      .map(({ item }) => item);
  }, [deferredQuery, sortMode, ratings, reviewFilter, reviews, tracks, playCounts]);
  const visibleTracks = filtered.slice(0, visibleCount);
  const track = tracks[current];
  const visualTheme = track?.visualTheme;
  const theme = visualTheme
    ? {
        accent: visualTheme.accentA,
        accent2: visualTheme.accentB,
        surface: "#17101d",
        glow: visualTheme.glow,
      }
    : themes[themeIndex];
  const counts = useMemo(
    () =>
      tracks.reduce(
        (total, item) => {
          const status = reviews[trackKey(item)];
          total[status ?? "pending"] += 1;
          return total;
        },
        { belongs: 0, reject: 0, later: 0, pending: 0 },
      ),
    [reviews, tracks],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadCatalog<Track>(controller.signal)
      .then((library) => {
        if (Array.isArray(library.tracks) && library.tracks.length) {
          let savedMetadata: Record<string, Partial<Track>> = {};
          try {
            savedMetadata = JSON.parse(
              localStorage.getItem("blackmamba-track-metadata") ?? "{}",
            );
          } catch {
            savedMetadata = {};
          }
          setTracks(
            (library.tracks as Track[]).map((item) => ({
              ...item,
              ...(savedMetadata[trackKey(item)] ?? {}),
              ...CATALOG_IDENTITY,
            })),
          );
          const featuredIndex = (library.tracks as Track[]).findIndex((item) =>
            item.title.toLowerCase().includes("ganja love"),
          );
          if (featuredIndex >= 0) setCurrent(featuredIndex);
          setReviews((currentReviews) => {
            const next = { ...currentReviews };
            for (const item of library.tracks as Track[])
              if (item.ownership?.status === "belongs" && !next[trackKey(item)])
                next[trackKey(item)] = "belongs";
            return next;
          });
          setRatings((currentRatings) => {
            const next = { ...currentRatings };
            for (const item of library.tracks as Track[])
              if (item.rating && !next[trackKey(item)])
                next[trackKey(item)] = item.rating;
            return next;
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);
  useEffect(() => {
    localStorage.setItem("blackmamba-vitrine-reviews", JSON.stringify(reviews));
  }, [reviews]);
  useEffect(() => {
    localStorage.setItem(
      "blackmamba-playback-history",
      JSON.stringify(playbackHistory),
    );
  }, [playbackHistory]);
  useEffect(() => {
    saveRatings(ratings);
  }, [ratings]);
  useEffect(() => {
    if (!themeReady.current) {
      themeReady.current = true;
      return;
    }
    setThemeIndex(
      (index) =>
        (index + 1 + Math.floor(Math.random() * (themes.length - 1))) %
        themes.length,
    );
  }, [current]);
  useEffect(() => {
    const timer = window.setInterval(
      () =>
        setThemeIndex(
          (index) =>
            (index + 1 + Math.floor(Math.random() * (themes.length - 1))) %
            themes.length,
        ),
      24000,
    );
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!audio.current) return;
    audio.current.load();
    setTime(0);
    if (playing) audio.current.play().catch(() => setPlaying(false));
    // Playback intent is sampled only when the selected track changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);
  useEffect(() => {
    const selected = tracks[current];
    if (!selected) return;
    const index = filtered.findIndex(
      (item) => trackKey(item) === trackKey(selected),
    );
    if (index < 0) return;
    setVisibleCount((count) => Math.max(count, index + 30));
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        trackRows.current
          .get(trackKey(selected))
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      ),
    );
    return () => cancelAnimationFrame(frame);
  }, [current, filtered, tracks]);

  const toggle = () => {
    if (!audio.current) return;
    if (audio.current.paused) {
      recordPlayback(track);
      audio.current.play().then(() => setPlaying(true));
    } else {
      audio.current.pause();
      setPlaying(false);
    }
  };
  const playTrack = (selected: Track) => {
    if (
      (!selected.file && !selected.streamUrl) ||
      (selected.localStatus === "recoverable" && !selected.streamUrl)
    )
      return;
    const index = tracks.indexOf(selected);
    if (index === current) toggle();
    else {
      recordPlayback(selected);
      flushSync(() => {
        setCurrent(index);
        setPlaying(true);
      });
      audio.current?.load();
      audio.current?.play().catch(() => setPlaying(false));
    }
  };
  const move = (amount: number) =>
    setCurrent((index) => {
      if (shuffle && amount > 0 && tracks.length > 1) {
        let next = index;
        while (next === index) next = Math.floor(Math.random() * tracks.length);
        return next;
      }
      return (index + amount + tracks.length) % tracks.length;
    });
  const seek = (amount: number) => {
    if (!audio.current) return;
    const nextTime = Math.max(
      0,
      Math.min(audio.current.duration || 0, audio.current.currentTime + amount),
    );
    audio.current.currentTime = nextTime;
    setTime(nextTime);
  };
  const stop = () => {
    if (!audio.current) return;
    audio.current.pause();
    audio.current.currentTime = 0;
    setTime(0);
    setPlaying(false);
  };
  const recordPlayback = (playedTrack: Track) => {
    setPlaybackHistory((history) =>
      [
        {
          trackKey: trackKey(playedTrack),
          title: playedTrack.title,
          artist: playedTrack.artist,
          playedAt: Date.now(),
        },
        ...history,
      ].slice(0, 100),
    );
  };
  const playFromHistory = (entry: PlaybackHistoryEntry) => {
    const item = tracks.find(
      (candidate) => trackKey(candidate) === entry.trackKey,
    );
    if (!item) return;
    setQuery("");
    setReviewFilter("all");
    playTrack(item);
  };
  const review = (item: Track, status: ReviewStatus) =>
    setReviews((currentReviews) => ({
      ...currentReviews,
      [trackKey(item)]: status,
    }));
  const openTrackEditor = (item: Track) => {
    setEditingTrack(item);
    setEditDraft({
      title: item.title,
      artist: CATALOG_IDENTITY.artist,
      tag: item.tag,
      hashtags: item.hashtags ?? [],
      permalink: item.permalink ?? item.sourceUrl ?? "",
      description: item.description ?? "",
      subtitle: item.subtitle ?? "",
      privacy: item.privacy ?? "public",
      containsMusic: item.containsMusic ?? true,
      postAuthor: CATALOG_IDENTITY.postAuthor,
      isrc: item.isrc ?? "",
      composer: item.composer ?? "",
      releaseTitle: item.releaseTitle ?? "",
      purchaseMode: item.purchaseMode ?? "link",
      purchaseUrl: item.purchaseUrl ?? "",
      purchaseTitle: item.purchaseTitle ?? "Comprar",
      albumTitle: item.albumTitle ?? "",
      recordLabel: CATALOG_IDENTITY.recordLabel,
      releaseDate: item.releaseDate ?? "",
      barcode: item.barcode ?? "",
      iswc: item.iswc ?? "",
      pLine: item.pLine ?? "",
      explicit: item.explicit ?? false,
      license: item.license ?? "all_rights_reserved",
      cover: item.cover ?? "",
      panoramicCover: item.panoramicCover ?? "",
      lyrics: item.lyrics ?? "",
      visualTheme: item.visualTheme ?? VISUAL_PRESETS.violet,
    });
  };
  const toggleHashtag = (hashtag: string) =>
    setEditDraft((draft) => ({
      ...draft,
      hashtags: (draft.hashtags ?? []).includes(hashtag)
        ? (draft.hashtags ?? []).filter((item) => item !== hashtag)
        : [...(draft.hashtags ?? []), hashtag],
    }));
  const applyVisualPreset = (preset: VisualPreset) =>
    setEditDraft((draft) => ({
      ...draft,
      visualTheme: { ...VISUAL_PRESETS[preset] },
    }));
  const updateVisualTheme = (
    field: keyof VisualTheme,
    value: string | number,
  ) =>
    setEditDraft((draft) => ({
      ...draft,
      visualTheme: {
        ...(draft.visualTheme ?? VISUAL_PRESETS.violet),
        [field]: value,
      },
    }));
  const saveTrackEditor = () => {
    if (!editingTrack) return;
    const key = trackKey(editingTrack);
    const normalizedDraft = { ...editDraft, ...CATALOG_IDENTITY };
    setTracks((currentTracks) =>
      currentTracks.map((item) =>
        trackKey(item) === key
          ? {
              ...item,
              ...normalizedDraft,
              hasLyrics: Boolean(normalizedDraft.lyrics?.trim()),
            }
          : item,
      ),
    );
    let stored: Record<string, Partial<Track>> = {};
    try {
      stored = JSON.parse(
        localStorage.getItem("blackmamba-track-metadata") ?? "{}",
      );
    } catch {
      stored = {};
    }
    localStorage.setItem(
      "blackmamba-track-metadata",
      JSON.stringify({ ...stored, [key]: normalizedDraft }),
    );
    setEditingTrack(null);
  };
  const initials = (item: Track) =>
    item.title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "BM";
  const availabilityLabel = (item: Track) => {
    const key = trackKey(item);
    if (downloadingTrack[key] !== undefined) {
      return `DOWNLOADING · ${downloadingTrack[key]}%`;
    }
    // USB tracks from the original library.json may lack localStatus
    if (item.localStatus === "available" || (!item.localStatus && item.file))
      return `LOCAL · ${(item.localFormat ?? "MP3").toUpperCase()}`;
    if (item.streamUrl) return "STREAM · SOUNDCLOUD";
    if (item.preferredSource === "suno") return "DOWNLOAD WAV · SUNO";
    if (item.preferredSource === "soundcloud" || item.soundcloudUrl)
      return "DOWNLOAD · SOUNDCLOUD";
    return "LOCALIZAR AUDIO";
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isPlayable = (item: Track) =>
    Boolean(item.file || item.streamUrl);
  const downloadTrack = (item: Track) => {
    const key = trackKey(item);
    // Local file available — trigger browser download
    if ((item.localStatus === "available" || (!item.localStatus && item.file)) && item.file) {
      const link = document.createElement("a");
      link.href = item.downloadUrl ?? item.file;
      link.download = `${item.title}.${item.localFormat ?? "mp3"}`;
      document.body.append(link);
      link.click();
      link.remove();
      return;
    }
    
    // Non-local track — trigger visual download animation
    if (downloadingTrack[key] === undefined) {
      let progress = 0;
      setDownloadingTrack((prev) => ({ ...prev, [key]: 0 }));
      
      const interval = window.setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
          progress = 100;
          window.clearInterval(interval);
          
          // Complete download: add local path simulation
          setTracks((currentTracks) =>
            currentTracks.map((t) =>
              trackKey(t) === key
                ? {
                    ...t,
                    localStatus: "available",
                    availabilityStatus: "local",
                    localFormat: "mp3",
                    file: `/player/${t.id || "downloaded"}.mp3`,
                  }
                : t
            )
          );
          setTimeout(() => {
            setDownloadingTrack((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
          }, 1500);
        } else {
          setDownloadingTrack((prev) => ({ ...prev, [key]: progress }));
        }
      }, 300);
    }
  };
  const downloadLabel = (item: Track) => {
    const key = trackKey(item);
    if (downloadingTrack[key] !== undefined) {
      return `Cargando (${downloadingTrack[key]}%)`;
    }
    if (item.localStatus === "available" || (!item.localStatus && item.file))
      return "Descargar archivo";
    if (item.preferredSource === "suno") return "Download WAV en Suno";
    if (item.soundcloudUrl || item.preferredSource === "soundcloud")
      return "Download desde SoundCloud";
    return "Localizar audio";
  };
  const exportReviews = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      catalogSize: tracks.length,
      counts,
      decisions: tracks
        .filter((item) => reviews[trackKey(item)] || ratings[trackKey(item)])
        .map((item) => ({
          id: trackKey(item),
          title: item.title,
          status: reviews[trackKey(item)] ?? null,
          rating: ratings[trackKey(item)] ?? null,
        })),
    };
    const url = URL.createObjectURL(
      new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "blackmamba-review-decisions.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.code === "Space") {
        event.preventDefault();
        toggle();
      }
      if (event.code === "ArrowLeft") seek(-10);
      if (event.code === "ArrowRight") seek(10);
      if (event.code === "Escape") stop();
      if (/^[1-5]$/.test(event.key))
        setRatings((currentRatings) => ({
          ...currentRatings,
          [trackKey(track)]: Number(event.key),
        }));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() =>
    window.blackMambaDesktop?.onTransport((action) => {
      if (action === "toggle") toggle();
      if (action === "previous") move(-1);
      if (action === "next") move(1);
      if (action === "stop") stop();
    }),
  );

  return (
    <main
      className={`dynamic-theme layout-${layout} motion-${motion}`}
      style={
        {
          "--acid": theme.accent,
          "--accent-2": theme.accent2,
          "--theme-surface": theme.surface,
          "--theme-glow": theme.glow,
          "--theme-accent-c": visualTheme?.accentC ?? theme.accent2,
          "--theme-panel-glow": visualTheme?.panelGlow ?? theme.glow,
          "--theme-disc-glow": visualTheme?.discGlow ?? theme.glow,
          "--theme-button-glow": visualTheme?.buttonGlow ?? theme.accent,
          "--theme-speed": `${(visualTheme?.speed ?? 6) * 3}s`,
        } as React.CSSProperties
      }
    >
      <nav>
        <a
          className="brand"
          href="#top"
          aria-label="BlackMamba Records, inicio"
        >
          <span>BM</span> BLACKMAMBA <i>RECORDS</i>
        </a>
        <div className="nav-links">
          <a href="#music">Música</a>
          <a href="#about">Nosotros</a>
        </div>
        <a className="pill" href="#music">
          Escuchar ahora
        </a>
      </nav>

      {layout === "focus" && (
        <section className="hero" id="top">
          <div className="signal" aria-hidden="true">
            {[
              18, 40, 67, 93, 58, 32, 76, 98, 54, 26, 62, 86, 44, 70, 24, 50,
            ].map((height, i) => (
              <b key={i} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="eyebrow">SONIDO INDEPENDIENTE · MÉXICO</div>
          <h1>
            Donde el ritmo
            <br />
            muerde <em>fuerte.</em>
          </h1>
          <p className="lede">
            Música original de BlackMamba Records. Directo del estudio, sin
            intermediarios.
          </p>
          <button className="hero-play" onClick={toggle}>
            <span>{playing ? "Ⅱ" : "▶"}</span>
            {playing ? "Pausar selección" : "Escuchar selección"}
          </button>
          <div className="hero-track">
            <small>SONANDO AHORA</small>
            <strong>{track.title}</strong>
            <span>{track.artist}</span>
          </div>
        </section>
      )}

      <section className="catalog" id="music">
        <div className="library-command">
          <div>
            <span className="eyebrow">BLACKMAMBA LIBRARY</span>
            <strong>
              {filtered.length} por revisar <small>de {tracks.length}</small>
            </strong>
          </div>
          <div className="layout-switcher" aria-label="Vistas de biblioteca">
            <button
              className={layout === "combined" ? "active" : ""}
              onClick={() => setLayout("combined")}
            >
              <SidebarSimple size={17} />
              Combined
            </button>
            <button
              className={layout === "grid" ? "active" : ""}
              onClick={() => setLayout("grid")}
            >
              <GridFour size={17} />
              Grid
            </button>
            <button
              className={layout === "review" ? "active" : ""}
              onClick={() => setLayout("review")}
            >
              <ListBullets size={17} />
              Console
            </button>
            <button
              className={layout === "focus" ? "active" : ""}
              onClick={() => setLayout("focus")}
            >
              <SlidersHorizontal size={17} />
              Focus
            </button>
            <button
              className={layout === "winamp" ? "active" : ""}
              onClick={() => setLayout("winamp")}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden="true" style={{ transform: 'scale(1.2)' }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
              </svg>
              Winamp Classic
            </button>
          </div>
          <label>
            Buscar canciones
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setReviewFilter("all");
                setVisibleCount(60);
              }}
              placeholder="Buscar canciones, artistas, letras…"
            />
          </label>
        </div>
        <div className="library-workspace">
          <aside className="library-sidebar">
            <span className="eyebrow">BIBLIOTECA</span>
            <button onClick={() => setReviewFilter("all")}>
              Todas <b>{tracks.length}</b>
            </button>
            <button onClick={() => setReviewFilter("pending")}>
              Por revisar <b>{counts.pending}</b>
            </button>
            <button onClick={() => setReviewFilter("belongs")}>
              Aprobadas <b>{counts.belongs}</b>
            </button>
            <button onClick={() => setReviewFilter("reject")}>
              Rechazadas <b>{counts.reject}</b>
            </button>
            <button onClick={() => setReviewFilter("later")}>
              Más tarde <b>{counts.later}</b>
            </button>
            <span className="eyebrow side-label">FILTROS</span>
            <p>Género</p>
            <p>Duración</p>
            <p>Calificación</p>
            <p>Con letra</p>
            <span className="eyebrow side-label">
              REPRODUCIDAS RECIENTEMENTE
            </span>
            <div className="playback-history">
              {playbackHistory.slice(0, 8).map((entry) => (
                <button
                  key={`${entry.trackKey}-${entry.playedAt}`}
                  onClick={() => playFromHistory(entry)}
                  title={new Date(entry.playedAt).toLocaleString()}
                >
                  <span>{entry.title}</span>
                  <small>
                    {new Date(entry.playedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </button>
              ))}
              {!playbackHistory.length && <p>Aún no hay reproducciones.</p>}
              {!!playbackHistory.length && (
                <button
                  className="clear-history"
                  onClick={() => setPlaybackHistory([])}
                >
                  Limpiar historial
                </button>
              )}
            </div>
          </aside>
          <div className="catalog-main">
            <div className="review-toolbar" aria-label="Filtros de revisión">
              <label className="rating-sort">
                <span>Ordenar</span>
                <select
                  value={sortMode}
                  onChange={(event) => {
                    setSortMode(event.target.value as SortMode);
                    setVisibleCount(60);
                  }}
                  aria-label="Ordenar canciones por calificación"
                >
                  <option value="catalog">Número de catálogo</option>
                  <option value="rating-desc">★★★★★ → ☆☆☆☆☆</option>
                  <option value="rating-asc">☆☆☆☆☆ → ★★★★★</option>
                  <option value="title-asc">Nombre (A-Z)</option>
                  <option value="title-desc">Nombre (Z-A)</option>
                  <option value="genre-asc">Género (A-Z)</option>
                  <option value="genre-desc">Género (Z-A)</option>
                  <option value="plays-desc">Más reproducidas</option>
                  <option value="plays-asc">Menos reproducidas</option>
                </select>
              </label>
              <button
                className={reviewFilter === "all" ? "selected" : ""}
                onClick={() => setReviewFilter("all")}
              >
                Todas <b>{tracks.length}</b>
              </button>
              <button
                className={reviewFilter === "pending" ? "selected" : ""}
                onClick={() => setReviewFilter("pending")}
              >
                Pendientes <b>{counts.pending}</b>
              </button>
              <button
                className={reviewFilter === "belongs" ? "selected" : ""}
                onClick={() => setReviewFilter("belongs")}
              >
                Sí pertenecen <b>{counts.belongs}</b>
              </button>
              <button
                className={reviewFilter === "reject" ? "selected" : ""}
                onClick={() => setReviewFilter("reject")}
              >
                No pertenecen <b>{counts.reject}</b>
              </button>
              <button
                className={reviewFilter === "later" ? "selected" : ""}
                onClick={() => setReviewFilter("later")}
              >
                Después <b>{counts.later}</b>
              </button>
              <button
                className="export-reviews"
                onClick={exportReviews}
                disabled={!Object.keys(reviews).length}
              >
                Exportar decisiones
              </button>
            </div>
            <div className="track-list">
              {visibleTracks.map((item, visibleIndex) => (
                <div
                  ref={(node) => {
                    if (node) trackRows.current.set(trackKey(item), node);
                    else trackRows.current.delete(trackKey(item));
                  }}
                  className={`track-row ${item === track ? "active" : ""} review-${reviews[trackKey(item)] ?? "pending"}`}
                  key={trackKey(item)}
                  title={item.warnings?.join(" · ")}
                  data-recoverable={item.localStatus === "recoverable" ? "true" : undefined}
                  style={{ animation: `row-in 0.26s ease-out ${Math.min(visibleIndex * 10, 260)}ms both` }}
                >
                  <button
                    className="track-main"
                    onClick={() => {
                      playTrack(item);
                      openTrackEditor(item);
                    }}
                  >
                    <span
                      className="track-number"
                      aria-label={`Canción número ${tracks.indexOf(item) + 1}`}
                    >
                      {tracks.indexOf(item) + 1}
                    </span>
                    <span
                      className="track-art"
                      aria-label={
                        item.cover
                          ? `Portada de ${item.title}`
                          : `Portada pendiente de ${item.title}`
                      }
                    >
                      {item.cover ? (
                        <img src={item.cover} alt="" />
                      ) : (
                        initials(item)
                      )}
                    </span>
                    <span className="row-play">
                      {item.localStatus === "recoverable"
                        ? "↪"
                        : item === track && playing
                          ? "Ⅱ"
                          : "▶"}
                    </span>
                    <span className="track-title">
                      <strong>{item.title}</strong>
                      <small>{item.artist}</small>
                      {!!item.hashtags?.length && (
                        <small className="track-hashtags">
                          {item.hashtags.join(" ")}
                        </small>
                      )}
                      <small
                        className="track-availability"
                        data-status={
                          item.localStatus === "recoverable"
                            ? "recoverable"
                            : item.streamUrl
                              ? "stream"
                              : "local"
                        }
                      >
                        {availabilityLabel(item)}
                      </small>
                    </span>
                    <span className="tag">
                      {reviews[trackKey(item)] === "belongs"
                        ? "Sí pertenece"
                        : reviews[trackKey(item)] === "reject"
                          ? "No pertenece"
                          : reviews[trackKey(item)] === "later"
                            ? "Después"
                            : item.tag}
                    </span>
                    <time>{item.duration}</time>
                  </button>
                  <div
                    className="review-actions"
                    aria-label={`Revisar ${item.title}`}
                  >
                    <div
                      className="star-rating"
                      role="group"
                      aria-label={`Calificación de ${item.title}`}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          className={
                            star <= (ratings[trackKey(item)] ?? 0)
                              ? "filled"
                              : ""
                          }
                          onClick={() =>
                            setRatings((currentRatings) => ({
                              ...currentRatings,
                              [trackKey(item)]: star,
                            }))
                          }
                          aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
                          aria-pressed={ratings[trackKey(item)] === star}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <button
                      className="lyrics-toggle"
                      onClick={() =>
                        setOpenLyrics(
                          openLyrics === trackKey(item) ? null : trackKey(item),
                        )
                      }
                      aria-expanded={openLyrics === trackKey(item)}
                      aria-label={`Letra de ${item.title}`}
                    >
                      {item.hasLyrics ? "Letra" : "Sin letra"}
                    </button>
                    <button
                      className={
                        reviews[trackKey(item)] === "belongs" ? "chosen" : ""
                      }
                      onClick={() => review(item, "belongs")}
                      aria-label="Sí pertenece"
                    >
                      ✓
                    </button>
                    <button
                      className={
                        reviews[trackKey(item)] === "reject" ? "chosen" : ""
                      }
                      onClick={() => review(item, "reject")}
                      aria-label="No pertenece"
                    >
                      ×
                    </button>
                    <button
                      className={
                        reviews[trackKey(item)] === "later" ? "chosen" : ""
                      }
                      onClick={() => review(item, "later")}
                      aria-label="Revisar después"
                    >
                      …
                    </button>
                  </div>
                  {openLyrics === trackKey(item) && (
                    <section
                      className="lyrics-panel"
                      aria-label={`Contenido de letra de ${item.title}`}
                    >
                      <span className="eyebrow">LETRA · {item.title}</span>
                      {item.hasLyrics ? (
                        <pre>{item.lyrics}</pre>
                      ) : (
                        <p>
                          Letra pendiente. Este espacio ya está reservado para
                          agregarla.
                        </p>
                      )}
                    </section>
                  )}
                </div>
              ))}
              {!filtered.length && (
                <p className="empty">No encontramos esa canción.</p>
              )}
            </div>
            {visibleCount < filtered.length && (
              <button
                className="load-more"
                onClick={() => setVisibleCount((count) => count + 60)}
              >
                Mostrar 60 más · {filtered.length - visibleCount} restantes
              </button>
            )}
          </div>
          <aside className="track-inspector">
            <div className="inspector-cover">
              {track.cover ? (
                <img src={track.cover} alt={`Portada de ${track.title}`} />
              ) : (
                <img
                  src="/ganja-love-cover.png"
                  alt="Portada editorial BlackMamba"
                />
              )}
            </div>
            <h3>{track.title}</h3>
            <p>{track.artist}</p>
            <div className="inspector-meta">
              <span>
                Duración <b>{track.duration}</b>
              </span>
              <span>
                Calificación <b>{ratings[trackKey(track)] ?? 0}/5</b>
              </span>
              <span>
                Estado{" "}
                <b>
                  {reviews[trackKey(track)] === "belongs"
                    ? "Aprobada"
                    : "Por revisar"}
                </b>
              </span>
              <span>
                Letra <b>{track.hasLyrics ? "Detectada" : "Pendiente"}</b>
              </span>
              <span>
                Audio <b>{availabilityLabel(track)}</b>
              </span>
            </div>
            <div className="inspector-actions">
              <button onClick={() => review(track, "belongs")}>Aprobar</button>
              <button onClick={() => review(track, "reject")}>Rechazar</button>
              <button onClick={() => review(track, "later")}>Más tarde</button>
              <button onClick={() => openTrackEditor(track)}>Editar letra / info</button>
              <button
                className="download-track"
                onClick={() => downloadTrack(track)}
              >
                ↓ {downloadLabel(track)}
              </button>
              {(track.soundcloudUrl ?? track.sourceUrl) &&
                track.localStatus === "recoverable" && (
                  <a
                    className="soundcloud-link"
                    href={(track.soundcloudUrl ?? track.sourceUrl) || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Escuchar en SoundCloud"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden="true">
                      <path d="M1.175 12.225c-.015 0-.03.01-.03.025l-.525 3.375.525 3.3c0 .015.015.025.03.025s.03-.01.03-.025l.6-3.3-.6-3.375c0-.015-.015-.025-.03-.025zm1.35-.675c-.015 0-.03.01-.03.025L2 15.6l.495 3.225c0 .015.015.025.03.025s.03-.01.03-.025l.555-3.225-.555-3.025c0-.015-.015-.025-.03-.025zm1.38-.375c-.02 0-.037.013-.038.03L3.33 15.6l.537 3.188c.001.017.018.03.038.03.02 0 .037-.013.038-.03L4.5 15.6l-.557-3.395c-.001-.017-.018-.03-.038-.03zm1.395-.3c-.022 0-.04.016-.04.038L4.73 15.6l.53 3.337c0 .022.018.038.04.038.022 0 .04-.016.04-.038L5.89 15.6l-.55-3.687c0-.022-.018-.038-.04-.038zM12 6.15c-.57 0-1.125.09-1.65.255C10.088 3.93 8.013 2.1 5.55 2.1c-.69 0-1.343.15-1.95.435V15.75c0 .03.015.06.038.075l.012.003H15.75c1.242 0 2.25-1.008 2.25-2.25S16.992 11.325 15.75 11.325c-.21 0-.413.028-.607.08A5.85 5.85 0 0 0 12 6.15z"/>
                    </svg>
                    Escuchar en SoundCloud
                  </a>
                )}
            </div>
          </aside>
        </div>
      </section>

      <section className="about" id="about">
        <span className="eyebrow">BLACKMAMBA RECORDS</span>
        <h2>
          Hecho desde abajo.
          <br />
          <em>Hecho para sonar.</em>
        </h2>
        <p>
          Un espacio independiente para producir, cuidar y compartir música
          propia. Cada canción de este catálogo sale de sesiones reales de
          BlackMamba.
        </p>
      </section>
      <footer>
        <div className="brand">
          <span>BM</span> BLACKMAMBA <i>RECORDS</i>
        </div>
        <p>© 2026 BlackMamba Records</p>
      </footer>

      {editingTrack && (
        <div
          className="track-editor-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditingTrack(null);
          }}
        >
          <section
            className="track-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="track-editor-title"
          >
            <header>
              <div>
                <span className="eyebrow">FICHA DE CANCIÓN</span>
                <h2 id="track-editor-title">{editingTrack.title}</h2>
              </div>
              <button
                onClick={() => setEditingTrack(null)}
                aria-label="Cerrar editor"
              >
                ×
              </button>
            </header>
            <div className="track-editor-covers">
              <div className="edit-square">
                {editDraft.cover ? (
                  <img src={editDraft.cover} alt="Vista previa cuadrada" />
                ) : (
                  <span>PORTADA 1:1</span>
                )}
              </div>
              <div className="edit-wide">
                {editDraft.panoramicCover ? (
                  <img
                    src={editDraft.panoramicCover}
                    alt="Vista previa panorámica"
                  />
                ) : (
                  <span>PORTADA PANORÁMICA 16:9</span>
                )}
              </div>
            </div>
            <div className="hashtag-editor">
              <span>GÉNERO Y ESTILO · CLIC PARA ANCLAR</span>
              <div>
                {hashtagOptions.map((hashtag) => {
                  const anchored = (editDraft.hashtags ?? []).includes(hashtag);
                  return (
                    <button
                      key={hashtag}
                      className={anchored ? "anchored" : ""}
                      onClick={() => toggleHashtag(hashtag)}
                      aria-pressed={anchored}
                    >
                      {hashtag}
                    </button>
                  );
                })}
              </div>
            </div>
            <fieldset className="visual-theme-editor">
              <legend>ESTUDIO VISUAL · TEMA DE ESTA CANCIÓN</legend>
              <div
                className="visual-presets"
                role="group"
                aria-label="Presets visuales"
              >
                {(Object.keys(VISUAL_PRESETS) as VisualPreset[]).map(
                  (preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={
                        editDraft.visualTheme?.preset === preset ? "active" : ""
                      }
                      onClick={() => applyVisualPreset(preset)}
                    >
                      {preset}
                    </button>
                  ),
                )}
              </div>
              <div className="visual-color-grid">
                {(
                  [
                    ["accentA", "Principal"],
                    ["accentB", "Secundario"],
                    ["accentC", "Tercero"],
                    ["glow", "Brillo"],
                    ["panelGlow", "Panel"],
                    ["discGlow", "Portada"],
                    ["buttonGlow", "Botón"],
                  ] as Array<
                    [
                      (
                        | "accentA"
                        | "accentB"
                        | "accentC"
                        | "glow"
                        | "panelGlow"
                        | "discGlow"
                        | "buttonGlow"
                      ),
                      string,
                    ]
                  >
                ).map(([field, label]) => (
                  <label key={field}>
                    {label}
                    <input
                      type="color"
                      value={
                        editDraft.visualTheme?.[field] ??
                        VISUAL_PRESETS.violet[field]
                      }
                      onChange={(event) =>
                        updateVisualTheme(field, event.target.value)
                      }
                    />
                  </label>
                ))}
                <label className="visual-speed">
                  Ritmo visual
                  <input
                    type="range"
                    min="3"
                    max="12"
                    step="0.1"
                    value={editDraft.visualTheme?.speed ?? 5.5}
                    onChange={(event) =>
                      updateVisualTheme("speed", Number(event.target.value))
                    }
                  />
                  <span>
                    {(editDraft.visualTheme?.speed ?? 5.5).toFixed(1)}s
                  </span>
                </label>
              </div>
            </fieldset>
            <div className="track-editor-fields">
              <label>
                Título
                <input
                  value={editDraft.title ?? ""}
                  onChange={(event) =>
                    setEditDraft((draft) => ({
                      ...draft,
                      title: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Artista
                <input
                  value={editDraft.artist ?? ""}
                  readOnly
                  title="Identidad fija del catálogo"
                />
              </label>
              <label>
                Categoría
                <input
                  value={editDraft.tag ?? ""}
                  onChange={(event) =>
                    setEditDraft((draft) => ({
                      ...draft,
                      tag: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                URL portada 1:1
                <input
                  value={editDraft.cover ?? ""}
                  onChange={(event) =>
                    setEditDraft((draft) => ({
                      ...draft,
                      cover: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="wide-field">
                URL portada panorámica
                <input
                  value={editDraft.panoramicCover ?? ""}
                  onChange={(event) =>
                    setEditDraft((draft) => ({
                      ...draft,
                      panoramicCover: event.target.value,
                    }))
                  }
                />
              </label>
              <fieldset className="metadata-section wide-field">
                <legend>INFORMACIÓN BÁSICA · SOUNDCLOUD</legend>
                <label>
                  Enlace
                  <input
                    value={editDraft.permalink ?? ""}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        permalink: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Subtítulo
                  <input
                    maxLength={140}
                    value={editDraft.subtitle ?? ""}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        subtitle: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Privacidad
                  <select
                    value={editDraft.privacy ?? "public"}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        privacy: event.target.value as Track["privacy"],
                      }))
                    }
                  >
                    <option value="public">Público</option>
                    <option value="private">Privado</option>
                    <option value="followers">Exclusiva para seguidores</option>
                  </select>
                </label>
                <label>
                  Contiene música
                  <select
                    value={editDraft.containsMusic ? "yes" : "no"}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        containsMusic: event.target.value === "yes",
                      }))
                    }
                  >
                    <option value="yes">Sí</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <label className="wide-field">
                  Descripción
                  <textarea
                    value={editDraft.description ?? ""}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>
              </fieldset>
              <fieldset className="metadata-section wide-field">
                <legend>METADATOS EDITORIALES</legend>
                <label>
                  ISRC
                  <input
                    placeholder="USS1Z1001234"
                    value={editDraft.isrc ?? ""}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        isrc: event.target.value.toUpperCase(),
                      }))
                    }
                  />
                </label>
                <label>
                  Compositor
                  <input
                    value={editDraft.composer ?? ""}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        composer: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Autor del post
                  <input
                    value={editDraft.postAuthor ?? ""}
                    readOnly
                    title="Identidad fija del catálogo"
                  />
                </label>
                <label>
                  Título del lanzamiento
                  <input
                    value={editDraft.releaseTitle ?? ""}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        releaseTitle: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Título del álbum
                  <input
                    value={editDraft.albumTitle ?? ""}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        albumTitle: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Sello discográfico
                  <input
                    value={editDraft.recordLabel ?? ""}
                    readOnly
                    title="Identidad fija del catálogo"
                  />
                </label>
                <label>
                  Fecha de lanzamiento
                  <input
                    type="date"
                    value={editDraft.releaseDate ?? ""}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        releaseDate: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Código de barras
                  <input
                    value={editDraft.barcode ?? ""}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        barcode: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  ISWC
                  <input
                    placeholder="T-034.524.680-1"
                    value={editDraft.iswc ?? ""}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        iswc: event.target.value.toUpperCase(),
                      }))
                    }
                  />
                </label>
                <label>
                  P Line
                  <input
                    placeholder="2026 BlackMamba Records"
                    value={editDraft.pLine ?? ""}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        pLine: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Contenido explícito
                  <select
                    value={editDraft.explicit ? "yes" : "no"}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        explicit: event.target.value === "yes",
                      }))
                    }
                  >
                    <option value="no">No</option>
                    <option value="yes">Sí</option>
                  </select>
                </label>
                <label>
                  Licencia
                  <select
                    value={editDraft.license ?? "all_rights_reserved"}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        license: event.target.value as Track["license"],
                      }))
                    }
                  >
                    <option value="all_rights_reserved">
                      Todos los derechos reservados
                    </option>
                    <option value="creative_commons">Creative Commons</option>
                  </select>
                </label>
              </fieldset>
              <fieldset className="metadata-section wide-field">
                <legend>COMPRA Y ESCAPARATE</legend>
                <label>
                  Tipo
                  <select
                    value={editDraft.purchaseMode ?? "link"}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        purchaseMode: event.target
                          .value as Track["purchaseMode"],
                      }))
                    }
                  >
                    <option value="link">Enlace de compra</option>
                    <option value="artist_store">Escaparate de artista</option>
                  </select>
                </label>
                <label>
                  Título del enlace
                  <input
                    value={editDraft.purchaseTitle ?? ""}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        purchaseTitle: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="wide-field">
                  Enlace de compra
                  <input
                    value={editDraft.purchaseUrl ?? ""}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        purchaseUrl: event.target.value,
                      }))
                    }
                  />
                </label>
              </fieldset>
              <label className="wide-field">
                Letra
                <textarea
                  value={editDraft.lyrics ?? ""}
                  onChange={(event) =>
                    setEditDraft((draft) => ({
                      ...draft,
                      lyrics: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <footer>
              <span>Los cambios se guardan localmente para esta canción.</span>
              <div>
                <button onClick={() => setEditingTrack(null)}>Cancelar</button>
                <button className="save-track" onClick={saveTrackEditor}>
                  Guardar cambios
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}

      <div className="player" aria-label="Reproductor de música">
        <audio
          ref={audio}
          src={track.streamUrl || track.file}
          preload="metadata"
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => move(1)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        <div className={`cover${playing ? " cover-playing" : ""}`}>
          {track.cover ? (
            <img src={track.cover} alt={`Portada de ${track.title}`} />
          ) : (
            initials(track)
          )}
        </div>
        <div className="now">
          <strong>{track.title}</strong>
          <small>{track.artist}</small>
          <div
            className="player-rating"
            role="group"
            aria-label={`Calificar mientras se reproduce ${track.title}`}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={
                  star <= (ratings[trackKey(track)] ?? 0) ? "filled" : ""
                }
                onClick={() =>
                  setRatings((currentRatings) => ({
                    ...currentRatings,
                    [trackKey(track)]: star,
                  }))
                }
                aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
                aria-pressed={ratings[trackKey(track)] === star}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <AudioVisualizer
          active={playing && motion !== "off"}
          color={theme.accent}
          reduced={motion === "reduced"}
          type={layout === "winamp" ? "sine" : "bar"}
        />
        <div className="transport">
          <div className="controls">
            <button
              className={`shuffle-control ${shuffle ? "active" : ""}`}
              onClick={() => setShuffle((enabled) => !enabled)}
              aria-label={
                shuffle
                  ? "Desactivar reproducción aleatoria"
                  : "Activar reproducción aleatoria"
              }
              aria-pressed={shuffle}
              title="Shuffle"
            >
              <Shuffle size={16} />
            </button>
            <button
              onClick={() => downloadTrack(track)}
              aria-label={downloadLabel(track)}
              title={downloadLabel(track)}
            >
              <DownloadSimple size={18} />
            </button>
            <button
              onClick={() => move(-1)}
              aria-label="Canción anterior"
              title="Canción anterior"
            >
              <SkipBack size={22} weight="bold" />
            </button>
            <button
              onClick={() => seek(-10)}
              aria-label="Retroceder 10 segundos"
              title="Retroceder 10 segundos"
            >
              −10
            </button>
            <button
              className="main-control"
              onClick={toggle}
              aria-label={playing ? "Pausar" : "Reproducir"}
              title={playing ? "Pausar" : "Reproducir"}
            >
              {playing ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
            </button>
            <button
              className="stop-control"
              onClick={stop}
              aria-label="Detener"
              title="Detener"
            >
              <Stop size={13} weight="fill" />
            </button>
            <button
              onClick={() => seek(10)}
              aria-label="Adelantar 10 segundos"
              title="Adelantar 10 segundos"
            >
              +10
            </button>
            <button
              onClick={() => move(1)}
              aria-label="Canción siguiente"
              title="Canción siguiente"
            >
              <SkipForward size={22} weight="bold" />
            </button>
          </div>
          <div className="timeline">
            <span>{formatTime(time)}</span>
            <input
              aria-label="Línea de tiempo de la canción"
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={time}
              style={
                {
                  "--progress": `${duration ? (time / duration) * 100 : 0}%`,
                } as React.CSSProperties
              }
              onChange={(e) => {
                if (audio.current)
                  audio.current.currentTime = Number(e.target.value);
                setTime(Number(e.target.value));
              }}
            />
            <span>−{formatTime(Math.max(0, duration - time))}</span>
          </div>
        </div>
        <label className="volume">
          VOL
          <input
            aria-label="Volumen"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </label>
        <div className="motion-mode" aria-label="Modo de movimiento">
          <button
            className={motion === "full" ? "active" : ""}
            onClick={() => setMotion("full")}
          >
            Completo
          </button>
          <button
            className={motion === "reduced" ? "active" : ""}
            onClick={() => setMotion("reduced")}
          >
            Reducido
          </button>
          <button
            className={motion === "off" ? "active" : ""}
            onClick={() => setMotion("off")}
          >
            Off
          </button>
        </div>
      </div>
    </main>
  );
}
