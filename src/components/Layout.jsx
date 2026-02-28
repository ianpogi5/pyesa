import Header from "./Header";
import BottomTabBar from "./BottomTabBar";

export default function Layout({ title, showBack, onBack, children }) {
  return (
    <div className="flex flex-col h-full">
      <Header title={title} showBack={showBack} onBack={onBack} />
      <div className="flex-1 overflow-hidden">{children}</div>
      <BottomTabBar />
    </div>
  );
}
