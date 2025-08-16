"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { ProjectCard } from "@/components/project-card";
import { ProjectModal } from "@/components/project-modal";
import { GradientText } from "@/components/textAnimations/gradient-text";
import { Project } from "@/components/projects/types";
import { DATA } from "@/data";

export const ArticlesSection = () => {
  const { work: articles, sectionTitle, sectionDescription } = DATA.articles;

  const [selectedArticle, setSelectedArticle] = useState<Project | null>(null);

  const handleOpenModal = (article: Project) => setSelectedArticle(article);
  const handleCloseModal = () => setSelectedArticle(null);

  const featuredArticle = articles[0];

  return (
    <section className="py-20 bg-background" id="articles-section">
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

        {featuredArticle && (
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <ProjectCard
              project={featuredArticle}
              onViewDetails={() => handleOpenModal(featuredArticle)}
            />
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-6">
          {articles.slice(1, 7).map((article, index) => (
            <motion.div
              key={article.id}
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
                project={article}
                onViewDetails={() => handleOpenModal(article)}
              />
            </motion.div>
          ))}
        </div>

        <ProjectModal
          isOpen={!!selectedArticle}
          project={selectedArticle}
          onClose={handleCloseModal}
        />
      </div>
    </section>
  );
};
