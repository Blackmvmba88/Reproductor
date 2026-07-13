const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};
const json = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": MIME[".json"],
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
};
const safeId = (value) => (/^[a-zA-Z0-9_-]+$/.test(value || "") ? value : null);

async function findLibraryRoot() {
  const candidates = [
    process.env.BLACKMAMBA_LIBRARY_ROOT,
    "/Volumes/ADATA SC740/01_MEDIA_AUDIO/BLACKMAMBA_PLAYER",
  ].filter(Boolean);
  for (const root of candidates)
    try {
      await fsp.access(path.join(root, "library.json"));
      return root;
    } catch {}
  return null;
}

async function createCatalog(root, appRoot, origin) {
  const tracks = [];
  const localById = new Map();
  if (root) {
    const library = JSON.parse(
      await fsp.readFile(path.join(root, "library.json"), "utf8"),
    );
    for (const item of library.tracks || []) {
      const audioPath = path.join(root, item.folder, item.audio || "audio.mp3");
      localById.set(item.id, audioPath);
      const coverPath = path.join(root, item.folder, item.cover || "cover.jpg");
      const lyricsPath = path.join(
        root,
        item.folder,
        item.lyrics || "lyrics.txt",
      );
      let lyrics = "";
      try {
        lyrics = await fsp.readFile(lyricsPath, "utf8");
      } catch {}
      tracks.push({
        id: item.id,
        title: item.title,
        artist: item.artist || "Iyari Gomez",
        file: `${origin}/api/media/${item.id}`,
        downloadUrl: `${origin}/api/download/${item.id}`,
        streamUrl: null,
        duration: `${Math.floor((item.durationSeconds || 0) / 60)}:${String(Math.floor((item.durationSeconds || 0) % 60)).padStart(2, "0")}`,
        tag: "USB local",
        cover: fs.existsSync(coverPath)
          ? `${origin}/api/cover/${item.id}`
          : null,
        lyrics,
        hasLyrics: Boolean(lyrics.trim()),
        localStatus: "available",
        localFormat: path.extname(audioPath).slice(1).toLowerCase(),
        source: "usb",
        availabilityStatus: "local",
        preferredSource: null,
        confidence: item.confidence ?? 0.8,
        evidence: [audioPath],
        warnings: item.warnings || [],
        fallbackReason: item.fallbackReason ?? null,
        ownership: item.ownership || null,
      });
    }
  }
  const auditPath = path.join(appRoot, "dist", "player", "source-audit.json");
  const remoteById = new Map();
  try {
    const audit = JSON.parse(await fsp.readFile(auditPath, "utf8"));
    for (const item of audit.records || [])
      if (item.localStatus === "recoverable") {
        remoteById.set(item.soundcloudId, item);
        const canStream = Boolean(process.env.SOUNDCLOUD_STREAM_API);
        const preferredSource = item.sunoCandidates?.length
          ? "suno"
          : "soundcloud";
        tracks.push({
          id: `sc-${item.soundcloudId}`,
          title: item.title,
          artist: "Iyari Gomez",
          file: "",
          streamUrl: canStream
            ? `${origin}/api/stream/${item.soundcloudId}`
            : null,
          sourceUrl: item.soundcloudUrl,
          duration: `${Math.floor(item.durationSeconds / 60)}:${String(item.durationSeconds % 60).padStart(2, "0")}`,
          tag: canStream
            ? "Stream SoundCloud"
            : preferredSource === "suno"
              ? "Recuperar WAV · Suno"
              : "Recuperar · SoundCloud",
          cover: null,
          panoramicCover: null,
          lyrics: "",
          hasLyrics: false,
          localStatus: "recoverable",
          localFormat: null,
          source: "soundcloud",
          availabilityStatus: canStream ? "stream" : "recoverable",
          preferredSource,
          preferredAction:
            preferredSource === "suno"
              ? "download_wav_from_suno"
              : "download_from_soundcloud",
          sunoCandidates: item.sunoCandidates || [],
          confidence: item.confidence,
          evidence: item.evidence,
          warnings: item.warnings,
          fallbackReason: item.fallbackReason,
        });
      }
  } catch {}
  return {
    tracks,
    localById,
    remoteById,
    confidence: root ? 0.98 : 0.65,
    evidence: root ? [`USB detectada: ${root}`] : [],
    warnings: root ? [] : ["USB no detectada"],
    fallbackReason: root
      ? null
      : "Se muestran metadatos y streaming remoto disponible",
  };
}

function streamFile(req, res, file, extraHeaders = {}) {
  if (!file || !fs.existsSync(file))
    return json(res, 404, { error: "media_not_found" });
  const stat = fs.statSync(file),
    range = req.headers.range;
  if (range) {
    const [a, b] = range.replace(/bytes=/, "").split("-");
    const start = Number(a),
      end = b ? Number(b) : stat.size - 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Type":
        MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      ...extraHeaders,
    });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": stat.size,
      "Accept-Ranges": "bytes",
      "Content-Type":
        MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      ...extraHeaders,
    });
    fs.createReadStream(file).pipe(res);
  }
}

async function startMediaServer(appRoot) {
  let catalog;
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.pathname === "/player/library.json") return json(res, 200, catalog);
    const media = url.pathname.match(/^\/api\/(media|cover)\/([^/]+)$/);
    if (media) {
      const id = safeId(media[2]);
      const audio = catalog.localById.get(id);
      const file =
        media[1] === "cover" && audio
          ? path.join(path.dirname(audio), "cover.jpg")
          : audio;
      return streamFile(req, res, file);
    }
    const download = url.pathname.match(/^\/api\/download\/([^/]+)$/);
    if (download) {
      const id = safeId(download[1]);
      const audio = catalog.localById.get(id);
      const track = catalog.tracks.find((item) => item.id === id);
      if (!audio || !track)
        return json(res, 404, { error: "download_not_available" });
      const extension = path.extname(audio).toLowerCase() || ".mp3";
      const filename = `${track.title}${extension}`;
      return streamFile(req, res, audio, {
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "X-Content-Type-Options": "nosniff",
      });
    }
    const remote = url.pathname.match(/^\/api\/stream\/([^/]+)$/);
    if (remote) {
      const id = safeId(remote[1]),
        base = process.env.SOUNDCLOUD_STREAM_API;
      if (!base)
        return json(res, 503, {
          error: "soundcloud_stream_backend_not_configured",
        });
      const upstream = await fetch(
        `${base.replace(/\/$/, "")}/tracks/${id}/stream`,
        { headers: { range: req.headers.range || "" } },
      );
      res.writeHead(upstream.status, Object.fromEntries(upstream.headers));
      if (!upstream.body) return res.end();
      const reader = upstream.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      return res.end();
    }
    let filePath = path.join(
      appRoot,
      "dist",
      url.pathname === "/" ? "index.html" : url.pathname,
    );
    if (!filePath.startsWith(path.join(appRoot, "dist")))
      return json(res, 403, { error: "forbidden" });
    try {
      const data = await fsp.readFile(filePath);
      res.writeHead(200, {
        "Content-Type":
          MIME[path.extname(filePath)] || "application/octet-stream",
      });
      res.end(data);
    } catch {
      try {
        const data = await fsp.readFile(
          path.join(appRoot, "dist", "index.html"),
        );
        res.writeHead(200, { "Content-Type": MIME[".html"] });
        res.end(data);
      } catch {
        json(res, 404, { error: "not_found" });
      }
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port,
    origin = `http://127.0.0.1:${port}`;
  catalog = await createCatalog(await findLibraryRoot(), appRoot, origin);
  return {
    server,
    origin,
    summary: {
      tracks: catalog.tracks.length,
      usb: catalog.localById.size,
      remote: catalog.remoteById.size,
      confidence: catalog.confidence,
      warnings: catalog.warnings,
    },
  };
}
module.exports = { startMediaServer, findLibraryRoot };
