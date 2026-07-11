import Header from "./Header";
import BottomTabBar from "./BottomTabBar";
import Footer from "./Footer";

export default function Layout({ title, showBack, onBack, children }) {
  return (
    <div className="flex flex-col h-full">
      <Header title={title} showBack={showBack} onBack={onBack} />
      <div className="flex-1 overflow-hidden">{children}</div>
      {/* mb-14 keeps the footer flush above the fixed mobile tab bar */}
      <Footer />
      <BottomTabBar />
    </div>
  );
}
