import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/primitives/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" className="relative" />}
      >
        <Sun
          className={cn(
            "absolute size-[1.2rem] transition-all",
            theme === "light" ? "scale-100 rotate-0" : "scale-0 -rotate-90",
          )}
        />
        <Moon
          className={cn(
            "absolute size-[1.2rem] transition-all",
            theme === "dark" ? "scale-100 rotate-0" : "scale-0 rotate-90",
          )}
        />
        <Monitor
          className={cn(
            "absolute size-[1.2rem] transition-all",
            theme === "system" ? "scale-100 rotate-0" : "scale-0",
          )}
        />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
