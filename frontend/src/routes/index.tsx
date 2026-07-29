import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/home/hero";
import { TechStackBadges } from "@/components/home/tech-stack-badges";
import { ServicesPreview } from "@/components/home/services-preview";
import { WhyChooseUs } from "@/components/home/why-choose";
import { FeaturedProject } from "@/components/home/featured-project";
import { PortfolioGrid } from "@/components/home/portfolio-grid";
import { TestimonialsSlider } from "@/components/home/testimonials";
import { PricingSection } from "@/components/home/pricing-section";
import { FaqSection } from "@/components/home/faq-section";
import { ContactCta } from "@/components/home/contact-cta";
import { ExpertAssistanceForm } from "@/components/home/expert-assistance-form";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Netweavesolutions — Premium Software Development Agency" },
      {
        name: "description",
        content:
          "Websites, apps and custom software crafted by a senior team. Transforming ideas into powerful digital solutions.",
      },
      { property: "og:title", content: "Netweavesolutions" },
      { property: "og:description", content: "Premium software development agency." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <Hero />
      <TechStackBadges />
      <ServicesPreview />
      <WhyChooseUs />
      <FeaturedProject />
      <PortfolioGrid />
      <TestimonialsSlider />
      <PricingSection compact />
      <FaqSection />
      <ContactCta />
      <ExpertAssistanceForm />
    </>
  );
}

