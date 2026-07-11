import { FiGithub, FiHeart } from "react-icons/fi";

const FACEBOOK_URL = "https://www.facebook.com/share/1DtVHgdJom/";
const GITHUB_URL = "https://github.com/ianpogi5/pyesa";

export default function Footer() {
  return (
    <footer className="flex-none flex items-center justify-center gap-2 py-1.5 px-3 mb-14 md:mb-0 text-[10px] text-overlay bg-mantle border-t border-surface">
      <span>Pyesa v{__APP_VERSION__}</span>
      <span aria-hidden>·</span>
      <span className="flex items-center gap-1">
        Made with <FiHeart size={9} className="text-red" aria-label="love" /> by{" "}
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-subtext hover:text-blue transition-colors"
        >
          PG Choir
        </a>
      </span>
      <span aria-hidden>·</span>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-subtext hover:text-blue transition-colors"
      >
        <FiGithub size={10} />
        GitHub
      </a>
    </footer>
  );
}
