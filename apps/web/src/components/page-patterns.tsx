"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, type LucideIcon } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { m, useReveal } from "./motion-primitives";

export function PageIntro({
  eyebrow,
  title,
  description,
  icon: Icon,
  visual,
  action,
  variant = visual ? "rich" : "text",
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  visual?: ReactNode;
  action?: { href: string; label: string };
  variant?: "text" | "compact" | "rich";
}) {
  const { t } = usePresentation();
  const reveal = useReveal({ rise: 0 });
  return (
    <m.header
      {...reveal}
      className={`page-intro page-intro-${variant}${visual ? " has-visual" : ""}`}
    >
      <div className="page-intro-copy">
        <span className="eyebrow">
          <Icon size={18} aria-hidden="true" /> {t(eyebrow)}
        </span>
        <h1>{t(title)}</h1>
        <p>{t(description)}</p>
        {action && (
          <Link className="button page-intro-action" href={action.href}>
            {t(action.label)} <ArrowRight size={20} aria-hidden="true" />
          </Link>
        )}
      </div>
      {visual && <div className="page-intro-visual">{visual}</div>}
    </m.header>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  action?: { href: string; label: string };
}) {
  const { t } = usePresentation();
  const reveal = useReveal({ rise: 10 });
  return (
    <m.div {...reveal} className="polish-section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{t(eyebrow)}</span>}
        <h2>{t(title)}</h2>
        {text && <p>{t(text)}</p>}
      </div>
      {action && (
        <Link className="text-link" href={action.href}>
          {t(action.label)} <ArrowRight size={18} aria-hidden="true" />
        </Link>
      )}
    </m.div>
  );
}

export type VisualStep = {
  title: string;
  text: string;
  icon: LucideIcon;
};

export function StepFlow({ steps }: { steps: VisualStep[] }) {
  const { t } = usePresentation();
  const reveal = useReveal({ rise: 10 });
  return (
    <m.ol {...reveal} className={`polish-steps count-${steps.length}`}>
      {steps.map(({ title, text, icon: Icon }, index) => (
        <li key={title}>
          <div className="polish-step-top">
            <span className="flow-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <Icon size={24} aria-hidden="true" />
          </div>
          <h3>{t(title)}</h3>
          <p>{t(text)}</p>
        </li>
      ))}
    </m.ol>
  );
}

export function CTASection({
  eyebrow,
  title,
  text,
  href,
  label,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  const { t } = usePresentation();
  const reveal = useReveal();
  return (
    <m.section {...reveal} className="polish-cta">
      <div>
        <span className="eyebrow">{t(eyebrow)}</span>
        <h2>{t(title)}</h2>
        <p>{t(text)}</p>
        <Link className="button" href={href}>
          {t(label)} <ArrowRight size={20} aria-hidden="true" />
        </Link>
      </div>
      <div className="polish-cta-art" aria-hidden="true">
        <Icon size={72} strokeWidth={1.3} />
      </div>
    </m.section>
  );
}

export function FAQSection({
  questions,
}: {
  questions: { question: string; answer: string }[];
}) {
  const { t } = usePresentation();
  return (
    <section className="polish-faq">
      <SectionHeader eyebrow="Полезно знать" title="Частые вопросы" />
      <div className="polish-faq-list">
        {questions.map(({ question, answer }) => (
          <details key={question}>
            <summary>
              <span>{t(question)}</span>
              <ChevronDown size={20} aria-hidden="true" />
            </summary>
            <p>{t(answer)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
