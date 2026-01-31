"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  Package,
  FolderOpen,
  Settings,
  LogOut,
  Target,
  Building2,
  ChevronDown,
  Check,
} from "lucide-react";
import { setCurrentStartup } from "@/app/actions/startup";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Prospects", href: "/prospects", icon: Target },
  { name: "Products", href: "/products", icon: Package },
  { name: "Materials", href: "/materials", icon: FolderOpen },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  user: {
    email: string;
    full_name: string | null;
    role: string;
  };
  startups: { id: string; name: string }[];
  currentStartup: { id: string; name: string } | null;
}

export function Sidebar({ user, startups, currentStartup }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleStartupChange = async (startupId: string) => {
    await setCurrentStartup(startupId);
    router.refresh();
  };

  // Get startup initials for logo placeholder
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-full w-16 md:w-64 flex-col bg-card border-r border-border transition-all">
      {/* Startup Selector */}
      <div className="border-b border-border">
        {startups.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-16 w-full items-center gap-3 px-3 md:px-4 hover:bg-accent/50 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm shrink-0">
                  {currentStartup ? getInitials(currentStartup.name) : "?"}
                </div>
                <div className="flex-1 min-w-0 text-left hidden md:block">
                  <p className="font-semibold text-sm truncate">
                    {currentStartup?.name || "Select Startup"}
                  </p>
                  <p className="text-xs text-muted-foreground">Switch workspace</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 hidden md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {startups.map((startup) => (
                <DropdownMenuItem
                  key={startup.id}
                  onClick={() => handleStartupChange(startup.id)}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs">
                    {getInitials(startup.name)}
                  </div>
                  <span className="flex-1">{startup.name}</span>
                  {currentStartup?.id === startup.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex h-16 items-center gap-3 px-3 md:px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm shrink-0">
              {currentStartup ? getInitials(currentStartup.name) : <Building2 className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0 hidden md:block">
              <p className="font-semibold text-sm truncate">
                {currentStartup?.name || "No Startup"}
              </p>
              <p className="text-xs text-muted-foreground">Workspace</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 md:px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors justify-center md:justify-start",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={item.name}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="hidden md:block">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-2 md:p-4">
        <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium shrink-0">
            {(user.full_name || user.email).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 hidden md:block">
            <p className="text-sm font-medium truncate">
              {user.full_name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center md:justify-start text-muted-foreground"
          onClick={handleLogout}
          title="Sign out"
        >
          <LogOut className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Sign out</span>
        </Button>
      </div>
    </div>
  );
}
