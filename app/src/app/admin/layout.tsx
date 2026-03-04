import AdminSidebar from "@/components/AdminSidebar";
import { TourProvider } from "@/components/tour/TourContext";
import OnboardingTour from "@/components/tour/OnboardingTour";
import { adminTourSteps } from "@/components/tour/tourSteps";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider tourId="admin" steps={adminTourSteps}>
      <div className="min-h-screen">
        <AdminSidebar />
        <main className="md:mr-60 min-h-screen overflow-y-auto pt-20 md:pt-6">{children}</main>
        <OnboardingTour />
      </div>
    </TourProvider>
  );
}
