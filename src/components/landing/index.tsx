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

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/react";

import { TryOnDemo } from "./try-on-demo";

const easing = [0.16, 1, 0.3, 1] as const;

const HeroSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <section className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 pt-20 pb-20 md:pt-24">
      {/* Hero-specific overlays (background is now global) */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Gradient fade to content at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />

        {/* Radial glow for hero area */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(ellipse at 50% 30%,
              color-mix(in oklch, var(--primary) 15%, transparent) 0%,
              transparent 50%
            )`,
          }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(var(--primary) 1px, transparent 1px),
              linear-gradient(90deg, var(--primary) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {/* Redesigned Editorial badge with shimmer */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex justify-center"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 1, ease: easing }}
        >
          <div className="group relative overflow-hidden">
            {/* Shimmer effect on hover */}
            <div className="-translate-x-full absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

            <div className="relative inline-flex items-center gap-3 border-primary border-l-2 bg-gradient-to-r from-accent/20 via-accent/10 to-transparent px-8 py-3 backdrop-blur-sm">
              {/* Animated sparkle icon */}
              <motion.div
                animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </motion.div>

              <span className="font-sans font-semibold text-primary text-xs uppercase tracking-[0.2em]">
                <Trans>AI-Powered Fashion</Trans>
              </span>

              {/* Decorative dot */}
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
            </div>
          </div>
        </motion.div>

        {/* Enhanced Main headline */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          transition={{ delay: 0.1, duration: 1, ease: easing }}
        >
          <h1 className="mx-auto max-w-5xl">
            {/* Subtitle line */}
            <span className="mb-4 block font-sans font-semibold text-muted-foreground text-sm uppercase tracking-[0.3em]">
              <Trans>Virtual Try-On Technology</Trans>
            </span>

            {/* Main headline */}
            <span className="block font-serif text-5xl text-foreground leading-[1.05] md:text-7xl lg:text-8xl">
              <Trans>See How Clothes</Trans>
            </span>

            {/* Italic accent line with enhanced gradient */}
            <span
              className="block font-light font-serif text-5xl italic md:text-7xl lg:text-8xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary) 0%, var(--chart-2) 50%, var(--chart-3) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              <Trans>Look On You</Trans>
            </span>
          </h1>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-12 max-w-2xl text-center text-lg text-muted-foreground md:text-xl"
          initial={{ opacity: 0, y: 30 }}
          transition={{ delay: 0.2, duration: 1, ease: easing }}
        >
          <Trans>
            Try on any garment virtually with our AI-powered technology. Powered
            by Google Gemini 3 Pro for photorealistic results.
          </Trans>
        </motion.p>

        {/* Redesigned CTA buttons */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row md:mb-24"
          initial={{ opacity: 0, y: 30 }}
          transition={{ delay: 0.3, duration: 1, ease: easing }}
        >
          {/* Primary CTA with glow effect */}
          <Button
            asChild
            className="group relative h-14 overflow-hidden rounded-full bg-primary px-10 font-medium text-base text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-primary/40 hover:shadow-xl"
          >
            <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
              {/* Shine effect on hover */}
              <div className="-translate-x-full absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />

              <span className="relative flex items-center gap-2">
                {isAuthenticated ? (
                  <Trans>Go to Dashboard</Trans>
                ) : (
                  <Trans>Get Started Free</Trans>
                )}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Button>

          {/* Secondary CTA with accent border */}
          <Button
            asChild
            className="group h-14 gap-2 rounded-full border-2 border-border bg-background/60 px-10 font-medium text-base text-foreground backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-accent/10"
            variant="outline"
          >
            <a href="#how-it-works">
              <Eye className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
              <Trans>See How It Works</Trans>
            </a>
          </Button>
        </motion.div>

        {/* Interactive Demo */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          transition={{ delay: 0.4, duration: 1, ease: easing }}
        >
          <TryOnDemo />
        </motion.div>
      </div>

      {/* Enhanced Scroll Indicator - Mouse style */}
      <motion.div
        animate={{ opacity: 1 }}
        className="-translate-x-1/2 absolute bottom-10 left-1/2"
        initial={{ opacity: 0 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <motion.a
          animate={{ y: [0, 8, 0] }}
          className="flex flex-col items-center gap-3 text-muted-foreground transition-colors hover:text-primary"
          href="#how-it-works"
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
        >
          <span className="font-medium font-sans text-[10px] uppercase tracking-[0.2em]">
            <Trans>Discover</Trans>
          </span>

          {/* Mouse-style indicator */}
          <div className="relative flex h-10 w-6 items-start justify-center rounded-full border-2 border-current p-1">
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [1, 0.5, 1] }}
              className="h-2 w-1 rounded-full bg-current"
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
      className="relative bg-muted/30 px-6 py-28 md:py-36"
      id="how-it-works"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section header with decorative elements */}
        <motion.div
          className="mb-24 text-center"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 1, ease: easing }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {/* Decorative line */}
          <div className="mx-auto mb-8 flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/50" />
            <div className="h-2 w-2 rotate-45 bg-primary/60" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/50" />
          </div>

          <span className="mb-4 block font-sans font-semibold text-muted-foreground text-xs uppercase tracking-[0.25em]">
            <Trans>Simple Process</Trans>
          </span>

          <h2 className="mb-4 font-serif text-4xl text-foreground md:text-6xl">
            <Trans>How It Works</Trans>
          </h2>

          <p className="mx-auto max-w-md font-serif text-lg text-muted-foreground italic">
            <Trans>From upload to try-on in four simple steps</Trans>
          </p>
        </motion.div>

        {/* Card-based layout */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-muted/50 to-card p-8 transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 md:p-10"
                initial={{ opacity: 0, y: 30 }}
                key={step.num}
                transition={{
                  delay: index * 0.15,
                  duration: 0.8,
                  ease: easing,
                }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                {/* Icon */}
                <div className="mb-8 inline-flex rounded-2xl border border-border bg-card p-4 transition-colors duration-500 group-hover:border-primary/40 group-hover:bg-accent/10">
                  <Icon
                    className="h-10 w-10 text-muted-foreground transition-colors duration-500 group-hover:text-primary"
                    strokeWidth={1}
                  />
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="font-serif text-3xl text-foreground italic">
                    {step.title}
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-primary/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
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
      className="relative overflow-hidden bg-background px-6 py-28 md:py-36"
      id="features"
    >
      {/* Background decorative element */}
      <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 opacity-20">
        <div className="h-full w-full rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          className="mb-20 flex flex-col items-start md:flex-row md:items-end md:justify-between"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 1, ease: easing }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div>
            <span className="mb-3 block font-sans font-semibold text-primary text-xs uppercase tracking-[0.25em]">
              <Trans>Platform</Trans>
            </span>
            <h2 className="font-serif text-4xl text-foreground md:text-6xl">
              <Trans>Features</Trans>
            </h2>
          </div>
          <p className="mt-4 max-w-sm text-muted-foreground md:mt-0 md:text-right">
            <Trans>
              Everything you need for the perfect virtual try-on experience
            </Trans>
          </p>
        </motion.div>

        {/* Featured items - larger cards */}
        <div className="mb-12 grid gap-8 md:grid-cols-2">
          {featured.map((feature, index) => (
            <motion.div
              className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-muted/50 to-card p-8 transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 md:p-10"
              initial={{ opacity: 0, y: 30 }}
              key={index}
              transition={{ delay: index * 0.1, duration: 0.8, ease: easing }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {/* Large icon */}
              <div className="mb-8 inline-flex rounded-2xl border border-border bg-card p-4 transition-colors duration-500 group-hover:border-primary/40 group-hover:bg-accent/10">
                <feature.icon
                  className="h-10 w-10 text-muted-foreground transition-colors duration-500 group-hover:text-primary"
                  strokeWidth={1}
                />
              </div>

              <h3 className="mb-3 font-serif text-3xl text-foreground italic">
                {feature.title}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Decorative corner */}
              <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-primary/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>

        {/* Remaining items - compact grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {remaining.map((feature, index) => (
            <motion.div
              className="group relative border-border border-t pt-6 transition-colors duration-500 hover:border-primary/60"
              initial={{ opacity: 0, y: 20 }}
              key={index}
              transition={{ delay: index * 0.1, duration: 0.8, ease: easing }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <feature.icon
                  className="h-5 w-5 text-muted-foreground transition-colors duration-500 group-hover:text-primary"
                  strokeWidth={1.5}
                />
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 opacity-0 transition-all duration-500 group-hover:text-primary group-hover:opacity-100" />
              </div>
              <h3 className="mb-2 font-serif text-foreground text-xl italic">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
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
    <section className="relative overflow-hidden py-32 md:py-40">
      {/* Dark overlay for this section */}
      <div className="absolute inset-0 bg-foreground/95" />

      {/* Neural pattern background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, var(--primary) 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, var(--accent) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          animation: "tech-neural-flow 30s linear infinite",
        }}
      />

      {/* Radial glow from center */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 50%,
            color-mix(in oklch, var(--primary) 15%, transparent) 0%,
            transparent 60%
          )`,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: easing }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <span className="inline-flex items-center gap-3 text-primary">
            <div className="h-px w-12 bg-primary" />
            <span className="font-semibold text-xs uppercase tracking-[0.3em]">
              <Trans>The Technology</Trans>
            </span>
            <div className="h-px w-12 bg-primary" />
          </span>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
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
              className="group relative h-full min-h-[400px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8"
              style={{
                transformStyle: "preserve-3d",
                animation: "tech-card-float 6s ease-in-out infinite",
              }}
            >
              {/* AI Core Visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Outer ring */}
                <div
                  className="absolute h-64 w-64 rounded-full border border-primary/30"
                  style={{ animation: "tech-ring-rotate 20s linear infinite" }}
                >
                  {/* Orbital dots */}
                  <div className="-translate-x-1/2 -translate-y-1/2 absolute top-0 left-1/2 h-2 w-2 rounded-full bg-primary/60" />
                  <div className="-translate-y-1/2 absolute top-1/2 right-0 h-2 w-2 translate-x-1/2 rounded-full bg-accent/60" />
                </div>
                {/* Middle ring */}
                <div
                  className="absolute h-48 w-48 rounded-full border border-primary/50"
                  style={{
                    animation: "tech-ring-rotate 15s linear infinite reverse",
                  }}
                >
                  <div className="-translate-x-1/2 absolute bottom-0 left-1/2 h-1.5 w-1.5 translate-y-1/2 rounded-full bg-primary/80" />
                </div>
                {/* Inner ring */}
                <div
                  className="absolute h-36 w-36 rounded-full border border-primary/20"
                  style={{ animation: "tech-ring-rotate 25s linear infinite" }}
                />
                {/* Inner core */}
                <div
                  className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/10"
                  style={{
                    animation: "tech-core-pulse 4s ease-in-out infinite",
                  }}
                >
                  <Cpu className="h-10 w-10 text-primary" />
                </div>
              </div>

              {/* Label */}
              <div className="absolute bottom-8 left-8">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">
                  <Trans>Gemini 3 Pro</Trans>
                </span>
                <h3 className="font-serif text-2xl text-white italic">
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
                className="group relative h-full min-h-[140px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 transition-all hover:border-primary/30"
                style={{
                  animation: `tech-stat-glow 4s ease-in-out infinite ${index * 0.5}s`,
                }}
              >
                <stat.icon className="mb-4 h-6 w-6 text-primary/60" />
                <h4 className="font-serif text-4xl text-primary italic">
                  {stat.value}
                </h4>
                <p className="mt-2 text-muted-foreground text-xs uppercase tracking-wider">
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
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8">
              <h2 className="mb-6 font-serif text-4xl text-white md:text-5xl">
                <span className="block">
                  <Trans>Next Gen</Trans>
                </span>
                <span className="text-primary italic">
                  <Trans>AI Models</Trans>
                </span>
              </h2>
              <p className="max-w-lg text-lg text-muted-foreground leading-relaxed">
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
    <section className="relative overflow-hidden bg-gradient-to-b from-muted/50 to-background px-6 py-32 md:py-40">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        {/* Radial gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--primary) 8%, transparent) 0%, transparent 70%)",
          }}
        />

        {/* Decorative vertical line */}
        <div className="absolute inset-x-0 top-0 flex justify-center">
          <div className="h-32 w-px bg-gradient-to-b from-primary/30 to-transparent" />
        </div>
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 1, ease: easing }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {/* Decorative quote mark */}
          <div className="mb-8 flex justify-center">
            <span className="font-serif text-6xl text-primary/30">"</span>
          </div>

          <h2 className="mb-6 font-serif text-5xl text-foreground md:text-7xl">
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

          <p className="mb-12 text-muted-foreground">
            <Trans>
              Join thousands of fashion enthusiasts who trust Drezzi
            </Trans>
          </p>

          {/* CTA Button with glow */}
          <Button
            asChild
            className="group relative h-16 overflow-hidden rounded-full bg-foreground px-12 text-background text-lg shadow-2xl shadow-foreground/20 transition-all hover:shadow-foreground/30"
          >
            <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
              <div className="-translate-x-full absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center gap-3">
                {isAuthenticated ? (
                  <Trans>Go to Dashboard</Trans>
                ) : (
                  <Trans>Get Started Free</Trans>
                )}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Button>

          {/* Trust signal */}
          <p className="mt-8 flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <CheckCircle className="h-4 w-4 text-primary" />
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
