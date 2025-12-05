import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Book,
  CheckCircle,
  Clock,
  Cpu,
  Eye,
  Layers,
  Shield,
  Shirt,
  Sparkles,
  User,
  Wand2,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/react";

const ACCENT = "#d4a574";
const ACCENT_LIGHT = "#e8c9a8";

const TryOnDemo = () => {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      {/* Main demo container */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted via-muted to-card p-1">
        <div className="relative overflow-hidden rounded-xl bg-background/50 p-8 md:p-12">
          {/* Animated grid background */}
          <div className="pointer-events-none absolute inset-0 opacity-20 dark:opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(${ACCENT}15 1px, transparent 1px), linear-gradient(90deg, ${ACCENT}15 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* Demo content */}
          <div className="relative flex flex-col items-center gap-8 md:flex-row md:gap-12">
            {/* Before - Body Profile */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="group relative"
              initial={{ opacity: 0, x: -30 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <div className="relative h-48 w-36 overflow-hidden rounded-xl border-2 border-border bg-gradient-to-b from-muted to-card shadow-2xl md:h-64 md:w-48">
                {/* Person silhouette placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <User
                    className="h-20 w-20 text-muted-foreground/50 md:h-24 md:w-24"
                    strokeWidth={1}
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-3">
                  <p className="font-medium text-foreground text-xs tracking-wide">
                    <Trans>Your Photo</Trans>
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ scale: 1, opacity: 1 }}
                className="-right-2 -top-2 absolute rounded-full border border-border bg-card p-2"
                initial={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.6 }}
              >
                <User className="h-4 w-4" style={{ color: ACCENT }} />
              </motion.div>
            </motion.div>

            {/* Plus sign */}
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card font-light text-2xl text-muted-foreground"
              initial={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              +
            </motion.div>

            {/* Garment */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="group relative"
              initial={{ opacity: 0, x: 30 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="relative h-48 w-36 overflow-hidden rounded-xl border-2 border-border bg-gradient-to-b from-muted to-card shadow-2xl md:h-64 md:w-48">
                {/* Garment placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shirt
                    className="h-20 w-20 text-muted-foreground/50 md:h-24 md:w-24"
                    strokeWidth={1}
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-3">
                  <p className="font-medium text-foreground text-xs tracking-wide">
                    <Trans>Any Garment</Trans>
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ scale: 1, opacity: 1 }}
                className="-right-2 -top-2 absolute rounded-full border border-border bg-card p-2"
                initial={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Shirt className="h-4 w-4" style={{ color: ACCENT }} />
              </motion.div>
            </motion.div>

            {/* Arrow */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center"
              initial={{ opacity: 0, x: -20 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <div className="hidden h-px w-8 bg-gradient-to-r from-transparent via-border to-border md:block" />
              <motion.div
                animate={{ x: [0, 5, 0] }}
                className="rounded-full border border-border bg-card p-3"
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              >
                <Wand2 className="h-5 w-5" style={{ color: ACCENT }} />
              </motion.div>
              <div className="hidden h-px w-8 bg-gradient-to-r from-border via-border to-transparent md:block" />
            </motion.div>

            {/* Result */}
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="group relative"
              initial={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <div
                className="relative h-48 w-36 overflow-hidden rounded-xl border-2 shadow-2xl md:h-64 md:w-48"
                style={{ borderColor: ACCENT }}
              >
                {/* Glowing effect */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `radial-gradient(circle at center, ${ACCENT} 0%, transparent 70%)`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-muted to-card" />
                {/* Combined result placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    className="relative"
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  >
                    <Sparkles
                      className="h-20 w-20 md:h-24 md:w-24"
                      strokeWidth={1}
                      style={{ color: ACCENT }}
                    />
                  </motion.div>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-3">
                  <p
                    className="font-semibold text-xs tracking-wide"
                    style={{ color: ACCENT }}
                  >
                    <Trans>AI Result</Trans>
                  </p>
                </div>
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    `0 0 0 0 ${ACCENT}00`,
                    `0 0 20px 10px ${ACCENT}30`,
                    `0 0 0 0 ${ACCENT}00`,
                  ],
                }}
                className="-right-2 -top-2 absolute rounded-full border bg-card p-2"
                style={{ borderColor: ACCENT }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                <CheckCircle className="h-4 w-4" style={{ color: ACCENT }} />
              </motion.div>
            </motion.div>
          </div>

          {/* Processing time badge */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            transition={{ delay: 1.2 }}
          >
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground text-xs tracking-wide">
              <Trans>~10 seconds processing with Gemini 3 Pro</Trans>
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const HeroSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <section className="relative min-h-[90vh] overflow-hidden px-6 pt-32 pb-20 md:pt-40">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        {/* Radial gradient */}
        <div
          className="-translate-x-1/2 -translate-y-1/2 absolute top-0 left-1/2 h-[800px] w-[800px] opacity-30"
          style={{
            background: `radial-gradient(circle, ${ACCENT}20 0%, transparent 70%)`,
          }}
        />
        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Editorial badge */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2"
            style={{
              borderColor: `${ACCENT}40`,
              backgroundColor: `${ACCENT}10`,
            }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: ACCENT }} />
            <span
              className="font-medium text-xs uppercase tracking-widest"
              style={{ color: ACCENT }}
            >
              <Trans>AI-Powered Fashion</Trans>
            </span>
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
          initial={{ opacity: 0, y: 30 }}
          transition={{ delay: 0.1, duration: 0.8 }}
        >
          <h1 className="mx-auto max-w-4xl font-serif text-4xl leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
            <span className="text-foreground">
              <Trans>See How Clothes</Trans>
            </span>
            <br />
            <span
              className="italic"
              style={{
                background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_LIGHT} 100%)`,
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
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Trans>
            Try on any garment virtually with our AI-powered technology. Powered
            by Google Gemini 3 Pro for photorealistic results.
          </Trans>
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Button
            asChild
            className="group h-12 gap-2 rounded-full px-8 font-medium text-base"
            style={{ backgroundColor: ACCENT }}
          >
            <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
              {isAuthenticated ? (
                <Trans>Go to Dashboard</Trans>
              ) : (
                <Trans>Get Started Free</Trans>
              )}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            asChild
            className="h-12 gap-2 rounded-full px-8 font-medium text-base"
            variant="outline"
          >
            <a href="#how-it-works">
              <Trans>See How It Works</Trans>
            </a>
          </Button>
        </motion.div>

        {/* Interactive Demo */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 40 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <TryOnDemo />
        </motion.div>
      </div>
    </section>
  );
};

const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: <Trans>Upload Your Photo</Trans>,
      description: (
        <Trans>
          Create a body profile with your reference photo. Your images are
          stored securely and never shared.
        </Trans>
      ),
      icon: User,
    },
    {
      number: "02",
      title: <Trans>Select a Garment</Trans>,
      description: (
        <Trans>
          Browse our catalog or upload your own clothing items. Any style, any
          brand.
        </Trans>
      ),
      icon: Shirt,
    },
    {
      number: "03",
      title: <Trans>AI Magic</Trans>,
      description: (
        <Trans>
          Gemini 3 Pro analyzes pose, lighting, and fabric physics to create
          your try-on.
        </Trans>
      ),
      icon: Cpu,
    },
    {
      number: "04",
      title: <Trans>See the Result</Trans>,
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
    <section className="relative px-6 py-24 md:py-32" id="how-it-works">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/50 to-transparent" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          className="mb-16 text-center md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="mb-4 font-serif text-3xl tracking-tight md:text-5xl">
            <Trans>How It Works</Trans>
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            <Trans>From upload to try-on in four simple steps</Trans>
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              key={step.number}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-card/50 p-6 transition-all duration-500 hover:border-border hover:bg-card">
                {/* Step number */}
                <div
                  className="mb-4 font-bold font-mono text-5xl opacity-10"
                  style={{ color: ACCENT }}
                >
                  {step.number}
                </div>

                {/* Icon */}
                <div
                  className="mb-4 inline-flex rounded-xl p-3"
                  style={{ backgroundColor: `${ACCENT}15` }}
                >
                  <step.icon className="h-5 w-5" style={{ color: ACCENT }} />
                </div>

                {/* Content */}
                <h3 className="mb-2 font-semibold text-lg">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>

                {/* Connector line (except last) */}
                {index < 3 && (
                  <div className="-right-3 absolute top-1/2 hidden h-px w-6 bg-gradient-to-r from-border to-transparent lg:block" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Processing time callout */}
        <motion.div
          className="mt-12 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card/50 px-6 py-3">
            <Zap className="h-4 w-4" style={{ color: ACCENT }} />
            <span className="text-sm">
              <Trans>Total processing time:</Trans>{" "}
              <span className="font-semibold" style={{ color: ACCENT }}>
                ~10 seconds
              </span>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: User,
      title: <Trans>Body Profiles</Trans>,
      description: (
        <Trans>
          Store multiple body profiles for different poses and occasions. Set
          your default for quick try-ons.
        </Trans>
      ),
    },
    {
      icon: Shirt,
      title: <Trans>Garment Catalog</Trans>,
      description: (
        <Trans>
          Browse curated collections or upload your own items. Supports any
          category from tops to accessories.
        </Trans>
      ),
    },
    {
      icon: Sparkles,
      title: <Trans>AI Try-On</Trans>,
      description: (
        <Trans>
          Gemini 3 Pro fuses images with advanced reasoning about pose,
          lighting, and fabric physics.
        </Trans>
      ),
    },
    {
      icon: Wand2,
      title: <Trans>Style Intelligence</Trans>,
      description: (
        <Trans>
          Get AI-generated styling tips for fit, color matching, and outfit
          suggestions.
        </Trans>
      ),
    },
    {
      icon: Book,
      title: <Trans>Lookbooks</Trans>,
      description: (
        <Trans>
          Save your favorite try-ons to lookbooks. Share them publicly or keep
          them private.
        </Trans>
      ),
    },
    {
      icon: Layers,
      title: <Trans>4K Resolution</Trans>,
      description: (
        <Trans>
          Get photorealistic results up to 4K resolution. Perfect for detailed
          fabric visualization.
        </Trans>
      ),
    },
  ];

  return (
    <section className="relative px-6 py-24 md:py-32" id="features">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          className="mb-16 text-center md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="mb-4 font-serif text-3xl tracking-tight md:text-5xl">
            <Trans>Everything You Need</Trans>
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            <Trans>
              A complete virtual try-on experience powered by the latest AI
            </Trans>
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              key={index}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:border-primary/30 hover:shadow-lg">
                {/* Hover gradient */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}08 0%, transparent 50%)`,
                  }}
                />

                {/* Icon */}
                <div
                  className="relative mb-4 inline-flex rounded-xl p-3 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${ACCENT}15` }}
                >
                  <feature.icon className="h-5 w-5" style={{ color: ACCENT }} />
                </div>

                {/* Content */}
                <h3 className="relative mb-2 font-semibold text-lg">
                  {feature.title}
                </h3>
                <p className="relative text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Decorative corner */}
                <div
                  className="-right-8 -top-8 pointer-events-none absolute h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20"
                  style={{ backgroundColor: ACCENT }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TechSection = () => {
  const badges = [
    { icon: Cpu, label: <Trans>Gemini 3 Pro</Trans> },
    { icon: Layers, label: <Trans>4K Output</Trans> },
    { icon: Shield, label: <Trans>SynthID Watermark</Trans> },
    { icon: Zap, label: <Trans>~10s Processing</Trans> },
  ];

  return (
    <section className="relative px-6 py-24 md:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/50 to-transparent" />

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p
            className="mb-4 font-medium text-sm uppercase tracking-widest"
            style={{ color: ACCENT }}
          >
            <Trans>Powered By</Trans>
          </p>
          <h2 className="mb-6 font-serif text-3xl tracking-tight md:text-5xl">
            <Trans>Google&apos;s Latest AI</Trans>
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-muted-foreground">
            <Trans>
              Built on Gemini 3 Pro&apos;s multi-image fusion capabilities. The
              model reasons through complex prompts to understand pose,
              lighting, and fabric physics before generating your try-on.
            </Trans>
          </p>
        </motion.div>

        {/* Tech badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {badges.map((badge, index) => (
            <div
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2"
              key={index}
            >
              <badge.icon className="h-4 w-4" style={{ color: ACCENT }} />
              <span className="font-medium text-sm">{badge.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const CTASection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <section className="relative px-6 py-24 md:py-32">
      <div className="relative mx-auto max-w-4xl">
        <motion.div
          className="relative overflow-hidden rounded-3xl border border-border p-8 md:p-16"
          initial={{ opacity: 0, y: 30 }}
          style={{
            background: `linear-gradient(135deg, ${ACCENT}10 0%, transparent 50%, ${ACCENT}05 100%)`,
          }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {/* Decorative elements */}
          <div
            className="-translate-y-1/2 pointer-events-none absolute top-0 right-0 h-64 w-64 translate-x-1/2 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: ACCENT }}
          />
          <div
            className="-translate-x-1/2 pointer-events-none absolute bottom-0 left-0 h-48 w-48 translate-y-1/2 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: ACCENT }}
          />

          <div className="relative text-center">
            <h2 className="mb-4 font-serif text-3xl tracking-tight md:text-5xl">
              <Trans>Ready to Try It On?</Trans>
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
              <Trans>
                Create your first virtual try-on in minutes. No credit card
                required.
              </Trans>
            </p>
            <Button
              asChild
              className="group h-12 gap-2 rounded-full px-8 font-medium text-base"
              style={{ backgroundColor: ACCENT }}
            >
              <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                {isAuthenticated ? (
                  <Trans>Go to Dashboard</Trans>
                ) : (
                  <Trans>Get Started Free</Trans>
                )}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
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
    <div className="relative">
      <HeroSection isAuthenticated={isAuthenticated} />
      <HowItWorksSection />
      <FeaturesSection />
      <TechSection />
      <CTASection isAuthenticated={isAuthenticated} />
    </div>
  );
};

export default Landing;
