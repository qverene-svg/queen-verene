import { HeroSection } from "@/components/home/HeroSection";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { SocialSection } from "@/components/home/SocialSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesPreview />
      <SocialSection />
    </>
  );
}
