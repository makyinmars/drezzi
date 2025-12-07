import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Book,
  CheckCircle,
  Clock,
  Cpu,
  Eye,
  Layers,
  Maximize2,
  Shirt,
  Sparkles,
  Target,
  User,
  Wand2,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

import { NeuralBackground } from "@/components/common/neural-background";
import { Button } from "@/components/ui/button";
import { APP_TEXT_LOGO_URL } from "@/constants/app";
import { useTRPC } from "@/trpc/react";

import { TryOnDemo } from "./try-on-demo";

const easing = [0.16, 1, 0.3, 1] as const;

const HeroSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-6 py-20 md:py-24">
      {/* Hero-specific overlays (background is now global) */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Gradient fade to content at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90" />

        {/* Radial glow for hero area */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(ellipse at 50% 30%,
              color-mix(in oklch, var(--primary) 12%, transparent) 0%,
              transparent 60%
            )`,
          }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(var(--primary) 1px, transparent 1px),
              linear-gradient(90deg, var(--primary) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {/* Split-screen grid */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Brand & Content */}
          <div className="flex flex-col items-center">
            {/* Logo - positioned at top-left */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="mb-6"
              initial={{ opacity: 0, x: -20 }}
              transition={{ duration: 1, ease: easing }}
            >
              <div className="relative mx-auto inline-block">
                <div
                  className="pointer-events-none absolute inset-0 opacity-30 blur-2xl"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, var(--primary) 0%, transparent 70%)",
                  }}
                />
                <img
                  alt="Drezzi"
                  className="relative h-auto w-[400px] object-contain md:w-[450px]"
                  src={APP_TEXT_LOGO_URL}
                />
              </div>
            </motion.div>

            {/* Combined Tagline */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1, duration: 1, ease: easing }}
            >
              <div className="inline-flex items-center gap-2.5">
                <motion.div
                  animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </motion.div>
                <span className="font-medium font-sans text-[11px] text-primary uppercase tracking-[0.25em]">
                  <Trans>AI-Powered Virtual Try-On</Trans>
                </span>
              </div>
            </motion.div>

            {/* Headline - left aligned */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mb-5"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.2, duration: 1, ease: easing }}
            >
              <h1>
                <span className="block font-serif text-4xl text-foreground leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
                  <Trans>See How Clothes</Trans>
                </span>
                <span
                  className="block font-serif text-4xl italic leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--primary) 0%, var(--chart-2) 60%, var(--chart-3) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  <Trans>Look On You</Trans>
                </span>
              </h1>
            </motion.div>

            {/* Subheadline - compact */}
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 max-w-md text-base text-muted-foreground leading-relaxed md:text-lg"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3, duration: 1, ease: easing }}
            >
              <Trans>
                Try on any garment virtually. Powered by Google Gemini 3 Pro for
                photorealistic results.
              </Trans>
            </motion.p>

            {/* CTA buttons - left aligned */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.4, duration: 1, ease: easing }}
            >
              <Button
                asChild
                className="group relative h-12 overflow-hidden rounded-lg bg-primary px-8 font-medium text-base text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/35 hover:shadow-xl"
              >
                <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                  <div className="-translate-x-full absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                  <span className="relative flex items-center gap-2">
                    {isAuthenticated ? (
                      <Trans>Go to Dashboard</Trans>
                    ) : (
                      <Trans>Get Started Free</Trans>
                    )}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </Button>

              <Button
                asChild
                className="group h-12 gap-2 rounded-lg border border-border/80 bg-background/50 px-8 font-medium text-base text-foreground backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-primary/5"
                variant="outline"
              >
                <a href="#how-it-works">
                  <Eye className="h-4 w-4 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
                  <Trans>See How It Works</Trans>
                </a>
              </Button>
            </motion.div>
          </div>

          {/* Right Column - TryOnDemo */}
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="relative lg:pl-8"
            initial={{ opacity: 0, x: 30 }}
            transition={{ delay: 0.3, duration: 1, ease: easing }}
          >
            <TryOnDemo />
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator - hidden on mobile */}
      <motion.div
        animate={{ opacity: 1 }}
        className="-translate-x-1/2 absolute bottom-10 left-1/2 hidden md:block"
        initial={{ opacity: 0 }}
        transition={{ delay: 1.2, duration: 1 }}
      >
        <motion.a
          animate={{ y: [0, 6, 0] }}
          className="flex flex-col items-center gap-2 text-muted-foreground/70 transition-colors duration-300 hover:text-primary"
          href="#how-it-works"
          transition={{
            duration: 2.5,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
        >
          <span className="font-medium font-sans text-[9px] uppercase tracking-[0.3em]">
            <Trans>Discover</Trans>
          </span>
          <div className="relative flex h-8 w-5 items-start justify-center rounded-full border border-current p-1">
            <motion.div
              animate={{ y: [0, 10, 0], opacity: [1, 0.4, 1] }}
              className="h-1.5 w-0.5 rounded-full bg-current"
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            />
          </div>
        </motion.a>
      </motion.div>
    </section>
  );
};

const HowItWorksSection = () => {
  const steps = [
    {
      num: "01",
      title: <Trans>Upload</Trans>,
      subtitle: <Trans>Your Body Profile</Trans>,
      description: (
        <Trans>
          Create a body profile with your reference photo. Your images are
          stored securely and never shared.
        </Trans>
      ),
      icon: User,
    },
    {
      num: "02",
      title: <Trans>Select</Trans>,
      subtitle: <Trans>Any Garment</Trans>,
      description: (
        <Trans>
          Browse our catalog or upload your own clothing items. Any style, any
          brand.
        </Trans>
      ),
      icon: Shirt,
    },
    {
      num: "03",
      title: <Trans>Process</Trans>,
      subtitle: <Trans>AI Magic</Trans>,
      description: (
        <Trans>
          Gemini 3 Pro analyzes pose, lighting, and fabric physics to create
          your try-on.
        </Trans>
      ),
      icon: Cpu,
    },
    {
      num: "04",
      title: <Trans>Result</Trans>,
      subtitle: <Trans>Photorealistic</Trans>,
      description: (
        <Trans>
          Get photorealistic 4K results in seconds. Save favorites to your
          lookbook.
        </Trans>
      ),
      icon: Eye,
    },
  ];

  return (
    <section
      className="relative bg-muted/20 px-6 py-24 md:py-32"
      id="how-it-works"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section header with decorative elements */}
        <motion.div
          className="mb-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 1, ease: easing }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {/* Decorative line */}
          <div className="mx-auto mb-6 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" />
            <div className="h-1.5 w-1.5 rotate-45 bg-primary/50" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/40" />
          </div>

          <span className="mb-4 block font-medium font-sans text-[11px] text-muted-foreground uppercase tracking-[0.3em]">
            <Trans>Simple Process</Trans>
          </span>

          <h2 className="mb-4 font-serif text-4xl text-foreground tracking-tight md:text-5xl">
            <Trans>How It Works</Trans>
          </h2>

          <p className="mx-auto max-w-md font-serif text-base text-muted-foreground italic md:text-lg">
            <Trans>From upload to try-on in four simple steps</Trans>
          </p>
        </motion.div>

        {/* Card-based layout */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card/80 to-muted/30 p-7 transition-all duration-500 hover:border-primary/30 hover:shadow-primary/5 hover:shadow-xl md:p-8"
                initial={{ opacity: 0, y: 30 }}
                key={step.num}
                transition={{
                  delay: index * 0.12,
                  duration: 0.8,
                  ease: easing,
                }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                {/* Icon */}
                <div className="mb-6 inline-flex rounded-lg border border-border/60 bg-background/80 p-3.5 transition-all duration-500 group-hover:border-primary/30 group-hover:bg-primary/5">
                  <Icon
                    className="h-8 w-8 text-muted-foreground transition-colors duration-500 group-hover:text-primary"
                    strokeWidth={1.25}
                  />
                </div>

                {/* Content */}
                <div className="space-y-2.5">
                  <h3 className="font-serif text-2xl text-foreground italic md:text-3xl">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
                    {step.description}
                  </p>
                </div>

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-primary/8 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      title: <Trans>Body Profiles</Trans>,
      description: (
        <Trans>
          Store multiple profiles for different poses and body types. Perfect
          for seeing how clothes fit in various scenarios.
        </Trans>
      ),
      icon: User,
    },
    {
      title: <Trans>Garment Catalog</Trans>,
      description: (
        <Trans>
          Browse our curated collections or upload your own clothing items. Any
          style, any brand, any occasion.
        </Trans>
      ),
      icon: Shirt,
    },
    {
      title: <Trans>AI Try-On</Trans>,
      description: <Trans>Advanced physics and lighting analysis.</Trans>,
      icon: Sparkles,
    },
    {
      title: <Trans>Style Tips</Trans>,
      description: <Trans>Get AI-generated fashion advice.</Trans>,
      icon: Wand2,
    },
    {
      title: <Trans>Lookbooks</Trans>,
      description: <Trans>Organize and share your favorite outfits.</Trans>,
      icon: Book,
    },
    {
      title: <Trans>4K Quality</Trans>,
      description: <Trans>Crystal clear photorealistic results.</Trans>,
      icon: Layers,
    },
  ];

  // Split features for asymmetric layout
  const featured = features.slice(0, 2);
  const remaining = features.slice(2);

  return (
    <section
      className="relative overflow-hidden bg-background px-6 py-24 md:py-32"
      id="features"
    >
      {/* Background decorative element */}
      <div className="pointer-events-none absolute top-0 right-0 h-80 w-80 opacity-15">
        <div className="h-full w-full rounded-full bg-gradient-to-br from-primary/40 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          className="mb-16 flex flex-col items-start md:flex-row md:items-end md:justify-between"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 1, ease: easing }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div>
            <span className="mb-3 block font-medium font-sans text-[11px] text-primary uppercase tracking-[0.3em]">
              <Trans>Platform</Trans>
            </span>
            <h2 className="font-serif text-4xl text-foreground tracking-tight md:text-5xl">
              <Trans>Features</Trans>
            </h2>
          </div>
          <p className="mt-4 max-w-sm text-muted-foreground text-sm md:mt-0 md:text-right md:text-base">
            <Trans>
              Everything you need for the perfect virtual try-on experience
            </Trans>
          </p>
        </motion.div>

        {/* Featured items - larger cards */}
        <div className="mb-10 grid gap-6 md:grid-cols-2">
          {featured.map((feature, index) => (
            <motion.div
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card/80 to-muted/30 p-7 transition-all duration-500 hover:border-primary/30 hover:shadow-primary/5 hover:shadow-xl md:p-8"
              initial={{ opacity: 0, y: 30 }}
              key={index}
              transition={{ delay: index * 0.1, duration: 0.8, ease: easing }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {/* Large icon */}
              <div className="mb-6 inline-flex rounded-lg border border-border/60 bg-background/80 p-3.5 transition-all duration-500 group-hover:border-primary/30 group-hover:bg-primary/5">
                <feature.icon
                  className="h-8 w-8 text-muted-foreground transition-colors duration-500 group-hover:text-primary"
                  strokeWidth={1.25}
                />
              </div>

              <h3 className="mb-2.5 font-serif text-2xl text-foreground italic md:text-3xl">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
                {feature.description}
              </p>

              {/* Decorative corner */}
              <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-primary/8 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>

        {/* Remaining items - compact grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {remaining.map((feature, index) => (
            <motion.div
              className="group relative border-border/50 border-t pt-5 transition-colors duration-500 hover:border-primary/40"
              initial={{ opacity: 0, y: 20 }}
              key={index}
              transition={{ delay: index * 0.1, duration: 0.8, ease: easing }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <feature.icon
                  className="h-4.5 w-4.5 text-muted-foreground transition-colors duration-500 group-hover:text-primary"
                  strokeWidth={1.5}
                />
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 transition-all duration-500 group-hover:text-primary group-hover:opacity-100" />
              </div>
              <h3 className="mb-1.5 font-serif text-foreground text-lg italic md:text-xl">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TechSection = () => {
  const stats = [
    { value: "10s", label: <Trans>Processing</Trans>, icon: Zap },
    { value: "4K", label: <Trans>Resolution</Trans>, icon: Maximize2 },
    { value: "99%", label: <Trans>Accuracy</Trans>, icon: Target },
    { value: "24/7", label: <Trans>Available</Trans>, icon: Clock },
  ];

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Background overlay - adapts to light/dark mode */}
      <div className="absolute inset-0 bg-muted/50" />

      {/* Neural pattern background */}
      <NeuralBackground opacity={15} showGlow />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section header */}
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: easing }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <span className="inline-flex items-center gap-3 text-primary">
            <div className="h-px w-10 bg-primary/60" />
            <span className="font-medium text-[11px] uppercase tracking-[0.3em]">
              <Trans>The Technology</Trans>
            </span>
            <div className="h-px w-10 bg-primary/60" />
          </span>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
          {/* AI Core Card - Large card on left */}
          <motion.div
            className="md:col-span-5 md:row-span-2"
            initial={{ opacity: 0, x: -30 }}
            style={{ perspective: "1000px" }}
            transition={{ duration: 1, ease: easing }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <div
              className="group relative h-full min-h-[360px] overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card/60 to-muted/20 p-7 dark:from-background/30"
              style={{
                transformStyle: "preserve-3d",
                animation: "tech-card-float 6s ease-in-out infinite",
              }}
            >
              {/* AI Core Visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Outer ring */}
                <div
                  className="absolute h-56 w-56 rounded-full border border-primary/25"
                  style={{
                    animation: "tech-ring-rotate 20s linear infinite",
                    filter: "drop-shadow(0 0 6px var(--primary))",
                  }}
                >
                  {/* Orbital dots */}
                  <div className="-translate-x-1/2 -translate-y-1/2 absolute top-0 left-1/2 h-1.5 w-1.5 rounded-full bg-primary/60" />
                  <div className="-translate-y-1/2 absolute top-1/2 right-0 h-1.5 w-1.5 translate-x-1/2 rounded-full bg-primary/40" />
                </div>
                {/* Middle ring */}
                <div
                  className="absolute h-40 w-40 rounded-full border border-primary/40"
                  style={{
                    animation: "tech-ring-rotate 15s linear infinite reverse",
                    filter: "drop-shadow(0 0 4px var(--primary))",
                  }}
                >
                  <div className="-translate-x-1/2 absolute bottom-0 left-1/2 h-1 w-1 translate-y-1/2 rounded-full bg-primary/70" />
                </div>
                {/* Inner ring */}
                <div
                  className="absolute h-28 w-28 rounded-full border border-primary/15"
                  style={{
                    animation: "tech-ring-rotate 25s linear infinite",
                    filter: "drop-shadow(0 0 3px var(--primary))",
                  }}
                />
                {/* Inner core */}
                <div
                  className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5"
                  style={{
                    animation: "tech-core-pulse 4s ease-in-out infinite",
                  }}
                >
                  <Cpu className="h-8 w-8 text-primary" />
                </div>
              </div>

              {/* Label */}
              <div className="absolute bottom-7 left-7">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  <Trans>Gemini 3 Pro</Trans>
                </span>
                <h3 className="font-serif text-foreground text-xl italic dark:text-white">
                  <Trans>AI Core</Trans>
                </h3>
              </div>
            </div>
          </motion.div>

          {/* Stat Cards - 2x2 grid on right */}
          {stats.map((stat, index) => (
            <motion.div
              className="md:col-span-3 lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              key={stat.value}
              transition={{
                delay: 0.1 * index,
                duration: 0.8,
                ease: easing,
              }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div
                className="group relative h-full min-h-[120px] overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card/60 to-muted/20 p-5 transition-all duration-500 hover:border-primary/25 dark:from-background/30"
                style={{
                  animation: `tech-stat-glow 4s ease-in-out infinite ${index * 0.5}s`,
                }}
              >
                <stat.icon className="mb-3 h-5 w-5 text-primary/50" />
                <h4 className="font-serif text-3xl text-primary italic">
                  {stat.value}
                </h4>
                <p className="mt-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Description Card - spans bottom right */}
          <motion.div
            className="md:col-span-7"
            initial={{ opacity: 0, y: 30 }}
            transition={{ delay: 0.2, duration: 1, ease: easing }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card/60 to-muted/20 p-7 dark:from-background/30">
              <h2 className="mb-5 font-serif text-3xl text-foreground tracking-tight md:text-4xl dark:text-white">
                <span className="block">
                  <Trans>Next Gen</Trans>
                </span>
                <span className="text-primary italic">
                  <Trans>AI Models</Trans>
                </span>
              </h2>
              <p className="max-w-lg text-muted-foreground text-sm leading-relaxed md:text-base">
                <Trans>
                  Built on Gemini 3 Pro&apos;s multi-image fusion capabilities.
                  The model reasons through complex prompts to understand pose,
                  lighting, and fabric physics for photorealistic results.
                </Trans>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const CTASection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-muted/30 to-background px-6 py-24 md:py-32">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        {/* Radial gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--primary) 6%, transparent) 0%, transparent 60%)",
          }}
        />

        {/* Decorative vertical line */}
        <div className="absolute inset-x-0 top-0 flex justify-center">
          <div className="h-24 w-px bg-gradient-to-b from-primary/25 to-transparent" />
        </div>
      </div>

      <div className="relative mx-auto max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 1, ease: easing }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {/* Decorative quote mark */}
          <div className="mb-6 flex justify-center">
            <span className="font-serif text-5xl text-primary/25">"</span>
          </div>

          <h2 className="mb-5 font-serif text-4xl text-foreground tracking-tight md:text-5xl lg:text-6xl">
            <span className="block italic">
              <Trans>Your Style,</Trans>
            </span>
            <span
              className="block"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary) 0%, var(--chart-3) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              <Trans>Reimagined</Trans>
            </span>
          </h2>

          <p className="mb-10 text-muted-foreground text-sm md:text-base">
            <Trans>
              Join thousands of fashion enthusiasts who trust Drezzi
            </Trans>
          </p>

          {/* CTA Button with glow */}
          <Button
            asChild
            className="group relative h-14 overflow-hidden rounded-lg bg-foreground px-10 text-background text-base shadow-foreground/15 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-foreground/25"
          >
            <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
              <div className="-translate-x-full absolute inset-0 bg-gradient-to-r from-transparent via-primary/15 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
              <span className="relative flex items-center gap-2.5">
                {isAuthenticated ? (
                  <Trans>Go to Dashboard</Trans>
                ) : (
                  <Trans>Get Started Free</Trans>
                )}
                <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          </Button>

          {/* Trust signal */}
          <p className="mt-6 flex items-center justify-center gap-2 text-muted-foreground text-xs md:text-sm">
            <CheckCircle className="h-3.5 w-3.5 text-primary" />
            <Trans>No credit card required</Trans>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

const Landing = () => {
  const trpc = useTRPC();
  const sessionQuery = useQuery(trpc.auth.getSession.queryOptions());
  const isAuthenticated = Boolean(sessionQuery.data);

  return (
    <div className="relative bg-background text-foreground">
      <HeroSection isAuthenticated={isAuthenticated} />
      <HowItWorksSection />
      <FeaturesSection />
      <TechSection />
      <CTASection isAuthenticated={isAuthenticated} />
    </div>
  );
};

export default Landing;
