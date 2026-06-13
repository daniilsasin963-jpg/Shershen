import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import BottomNav from "@/components/BottomNav";
import TodayPage from "@/pages/Today";
import ModePage from "@/pages/Mode";
import IdeasPage from "@/pages/Ideas";
import CreativePage from "@/pages/Creative";
import ProgressPage from "@/pages/Progress";
import NotFound from "@/pages/not-found";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <div style={{ background: "#0D0D0D", minHeight: "100dvh" }}>
          <Switch>
            <Route path="/" component={TodayPage} />
            <Route path="/mode" component={ModePage} />
            <Route path="/ideas" component={IdeasPage} />
            <Route path="/creative" component={CreativePage} />
            <Route path="/progress" component={ProgressPage} />
            <Route component={NotFound} />
          </Switch>
          <BottomNav />
        </div>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}
