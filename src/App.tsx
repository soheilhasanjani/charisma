import { AppLayout } from "@/components/layouts/app-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { DirectionProvider } from "@/components/ui/direction";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <DirectionProvider direction="rtl">
        <AppLayout />
      </DirectionProvider>
    </ThemeProvider>
  );
}

export default App;
