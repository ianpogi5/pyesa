export default function DesktopSidebar({ children }) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-80 lg:w-96 border-r border-surface bg-mantle h-full">
      <div className="flex-1 overflow-y-auto">{children}</div>
    </aside>
  );
}
