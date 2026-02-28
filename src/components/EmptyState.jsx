import { FiMusic } from "react-icons/fi";

export default function EmptyState({ icon: Icon = FiMusic, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
        <Icon size={28} className="text-overlay" />
      </div>
      <h3 className="text-base font-semibold text-text mb-1">{title}</h3>
      <p className="text-sm text-subtext max-w-xs">{message}</p>
    </div>
  );
}
