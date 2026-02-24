import "@/styles/portal.css";
import { TourProvider } from "@/components/tour/TourContext";
import OnboardingTour from "@/components/tour/OnboardingTour";
import { portalTourSteps } from "@/components/tour/tourSteps";
import { ToastProvider } from "@/components/Toast";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <TourProvider tourId="portal" steps={portalTourSteps}>
        <div data-theme="portal" className="portal-root min-h-screen">
          <main className="min-h-screen overflow-y-auto">{children}</main>
          <OnboardingTour />
        </div>
      </TourProvider>
    </ToastProvider>
  );
}
