import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Compliance from "@/components/Compliance";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Stats />
      <div className="section-divider max-w-4xl mx-auto" />
      <Features />
      <div className="section-divider max-w-4xl mx-auto" />
      <HowItWorks />
      <Compliance />
      <CTA />
      <Footer />
    </>
  );
}
