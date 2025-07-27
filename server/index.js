import { configDotenv } from "dotenv";

configDotenv();

const API_KEY = process.env.API_KEY;

const PLAYLIST_ID = "PLdpzxOOAlwvIKMhk8WhzN1pYoJ1YU8Csa";

async function fetchAllVideoIds(playlistId) {
  let videoIds = [];
  let nextPageToken = "";

  do {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${API_KEY}&pageToken=${nextPageToken}`
    );
    const data = await res.json();

    const ids = data.items.map((item) => item.contentDetails.videoId);
    videoIds.push(...ids);
    nextPageToken = data.nextPageToken || "";
  } while (nextPageToken);

  return videoIds;
}

async function fetchDurations(videoIds) {
  let durations = [];

  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk.join(
        ","
      )}&key=${API_KEY}`
    );
    const data = await res.json();

    const chunkDurations = data.items.map(
      (item) => item.contentDetails.duration
    );
    durations.push(...chunkDurations);
  }

  return durations;
}

function parseISODuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

async function getPlaylistDurations() {
  const videoIds = await fetchAllVideoIds(PLAYLIST_ID);
  const durationsISO = await fetchDurations(videoIds);
  const durationsSeconds = durationsISO.map(parseISODuration);
  const totalSeconds = durationsSeconds.reduce((a, b) => a + b, 0);

  console.log(
    "Video durations:",
    durationsSeconds.map((s) => `${Math.floor(s / 60)}m ${s % 60}s`)
  );
  console.log(
    `Total duration: ${Math.floor(totalSeconds / 3600)}h ${Math.floor(
      (totalSeconds % 3600) / 60
    )}m ${totalSeconds % 60}s`
  );
}

getPlaylistDurations().catch(console.error);
