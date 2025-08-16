import { HeroSection } from "@/components/home/hero";
import { SkillsOverviewSection } from "@/components/home/skills-overview";
import { ArticlesSection } from "@/components/home/articles";
import { PressSection } from "@/components/home/press";
import { WorkSection } from "@/components/home/work";
import { WebsitesSection } from "@/components/home/websites";
import { LearningSection } from "@/components/home/learning";
import SkillMap from "@/components/SkillMap";
import { GradientText } from "@/components/textAnimations/gradient-text";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SkillsOverviewSection />
      <ArticlesSection />
      <PressSection />
      <WorkSection />
      <WebsitesSection />
      <LearningSection />
      <section className="py-20 bg-background" id="skill-map">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 space-y-4">
            <GradientText
              className="text-3xl md:text-4xl font-bold gradient"
              text="Interconnected Skill Map"
            />
            <p className="text-foreground-600 text-lg max-w-2xl mx-auto">
              Categories group my capabilities; lines show crossovers where skills reinforce each other.
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <SkillMap />
          </div>
          <ul className="mt-4 grid gap-2 text-sm text-slate-500 md:grid-cols-2">
            <li>
              <b>Core Problem Solving:</b> Learning Agility, Pattern Recognition, Adaptability, Knowledge Breadth
            </li>
            <li>
              <b>Technical Trades:</b> Masonry & Construction, Woodworking & Woodturning, Electrical Engineering Fundamentals
            </li>
            <li>
              <b>Engineering & Design:</b> CAD/CAM (Fusion 360, Aspire), PCB Design (Eagle, KiCad), Embedded Systems Programming
            </li>
            <li>
              <b>Digital & Creative:</b> Web Development (HTML/CSS/JS/Next.js), Adobe/DaVinci (Video & Design)
            </li>
            <li>
              <b>Business & Marketing:</b> SEO & Content Strategy, Brand Building & GTM
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
