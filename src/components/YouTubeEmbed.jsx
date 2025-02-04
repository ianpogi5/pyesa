import "./YouTubeEmbed.css";

const YouTubeEmbed = ({ url }) => {
  const getYouTubeID = (url) => {
    const regExp =
      /(?:youtube\.com\/(?:[^\/]+\/[^\/]+|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeID(url);

  if (!videoId) {
    return <p>Invalid YouTube URL</p>;
  }

  return (
    <div className="video-wrapper">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube Video"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default YouTubeEmbed;
