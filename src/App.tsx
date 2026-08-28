import { AppLayout } from "@/components/layouts/app-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { DirectionProvider } from "@/components/ui/direction";
import { OptionsPage } from "@/features/options/pages/options-page";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <DirectionProvider direction="rtl">
        <AppLayout>
          {/* No React Router in this project. In a real app this would be a route, not a direct render. */}
          <OptionsPage />
        </AppLayout>
      </DirectionProvider>
    </ThemeProvider>
  );
}

export default App;
