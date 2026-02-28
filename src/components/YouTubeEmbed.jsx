import useOnlineStatus from "../hooks/useOnlineStatus";

function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

export default function YouTubeEmbed({ url }) {
  const isOnline = useOnlineStatus();
  const videoId = extractVideoId(url);

  if (!isOnline || !videoId) return null;

  return (
    <div className="relative w-full pt-[56.25%] rounded-xl overflow-hidden bg-surface mt-3">
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
