"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { ProjectCard } from "@/components/project-card";
import { ProjectModal } from "@/components/project-modal";
import { GradientText } from "@/components/textAnimations/gradient-text";
import { Project } from "@/components/projects/types";
import { DATA } from "@/data";

export const LearningSection = () => {
  const { work: tutorials, sectionTitle, sectionDescription } = DATA.learning;

  const [selectedTutorial, setSelectedTutorial] = useState<Project | null>(null);

  const handleOpenModal = (tutorial: Project) => setSelectedTutorial(tutorial);
  const handleCloseModal = () => setSelectedTutorial(null);

  return (
    <section className="py-20 bg-background" id="learning-section">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <GradientText
            className="text-3xl md:text-4xl font-bold mb-4"
            text={sectionTitle}
          />
          <p className="text-foreground-600 text-lg max-w-2xl mx-auto">
            {sectionDescription}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-6">
          {tutorials.slice(0, 3).map((tutorial, index) => (
            <motion.div
              key={tutorial.id}
              className="w-full md:max-w-none"
              initial={{ opacity: 0, y: 20 }}
              transition={{
                delay: index * 0.2,
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <ProjectCard
                project={tutorial}
                onViewDetails={() => handleOpenModal(tutorial)}
              />
            </motion.div>
          ))}
        </div>

        <ProjectModal
          isOpen={!!selectedTutorial}
          project={selectedTutorial}
          onClose={handleCloseModal}
        />
      </div>
    </section>
  );
};

