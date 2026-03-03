import "@/styles/portal.css";
import { TourProvider } from "@/components/tour/TourContext";
import OnboardingTour from "@/components/tour/OnboardingTour";
import { portalTourSteps } from "@/components/tour/tourSteps";
import { ToastProvider } from "@/components/Toast";
import PortalSidebar from "@/components/PortalSidebar";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <TourProvider tourId="portal" steps={portalTourSteps}>
        <div data-theme="portal" className="portal-root min-h-screen flex">
          <PortalSidebar />
          <main className="flex-1 min-h-screen overflow-y-auto md:mr-60 px-4 md:px-8 pt-6 pb-8">
            {children}
          </main>
          <OnboardingTour />
        </div>
      </TourProvider>
    </ToastProvider>
  );
}
