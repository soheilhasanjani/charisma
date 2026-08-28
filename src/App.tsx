import { AppLayout } from "@/components/layouts/app-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { DirectionProvider } from "@/components/ui/direction";
import { OptionsPage } from "@/features/options/pages/options-page";
import { QueryProvider } from "@/lib/query/query-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryProvider>
        <DirectionProvider direction="rtl">
          <AppLayout>
            {/* No React Router in this project. In a real app this would be a route, not a direct render. */}
            <OptionsPage />
          </AppLayout>
        </DirectionProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

export default App;
