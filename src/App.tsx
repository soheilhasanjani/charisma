import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div>Real-Time Options</div>
      <ModeToggle />
    </ThemeProvider>
  );
}

export default App;
