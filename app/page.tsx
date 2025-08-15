import { HeroSection } from "@/components/home/hero";
import { SkillsOverviewSection } from "@/components/home/skills-overview";
import { WorkSection } from "@/components/home/work";
import { TestimonialsSection } from "@/components/home/testimonials";
import SkillMap from "@/components/SkillMap";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SkillsOverviewSection />
      <WorkSection />
      <TestimonialsSection />
      <section className="py-20 bg-background" id="skill-map">
        <div className="container mx-auto px-4 space-y-4">
          <h2 className="text-2xl font-bold">Interconnected Skill Map</h2>
          <p className="max-w-3xl text-slate-500">
            Domains orbit my core problem-solving center. Each skill connects to its domain and bridges others.
          </p>
          <SkillMap dark />
          <ul className="mt-4 grid gap-2 text-sm text-slate-500 md:grid-cols-2">
            <li>
              <b>Domains:</b> Core Problem Solving; Technical Trades; Engineering & Design; Digital & Creative; Business & Marketing
            </li>
            <li>
              <b>Sample skills:</b> Learning Agility; Embedded Systems Programming; Fusion 360; SEO & Content Strategy; Web Development
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
