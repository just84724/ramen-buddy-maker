import { Link } from "@tanstack/react-router";
import { ShoppingBag, History } from "lucide-react";

export function SiteHeader({ cartCount }: { cartCount?: number }) {
  return (
    <header className="border-b border-border/60 bg-card/40 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <span className="font-display text-lg">麵</span>
          </div>
          <div>
            <p className="font-display text-[10px] tracking-[0.3em] text-muted-foreground">ICHIGO ICHIE</p>
            <h1 className="font-display text-lg font-bold">一期一會 拉麵屋</h1>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-secondary text-foreground" }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground"
          >
            <ShoppingBag className="h-4 w-4" /> 點餐
            {typeof cartCount === "number" && cartCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{cartCount}</span>
            )}
          </Link>
          <Link
            to="/history"
            activeProps={{ className: "bg-secondary text-foreground" }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground"
          >
            <History className="h-4 w-4" /> 訂單歷史
          </Link>
        </nav>
      </div>
    </header>
  );
}
