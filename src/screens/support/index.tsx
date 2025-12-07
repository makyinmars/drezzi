import { Trans, useLingui } from "@lingui/react/macro";
import { MailIcon } from "lucide-react";
import PageHeader from "@/components/common/page-header";
import SubPageHeader from "@/components/common/sub-page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DREZZI_SUPPORT_EMAIL } from "@/constants/app";

const SupportScreen = () => {
  const { t } = useLingui();

  const faqs = [
    {
      question: t`How does virtual try-on work?`,
      answer: t`Upload a photo of yourself and select a garment you want to try on. Our AI will generate a realistic image of you wearing the clothing, helping you visualize how it looks before purchasing or styling.`,
    },
    {
      question: t`What is a lookbook?`,
      answer: t`A lookbook is a curated collection of outfits and styles. You can create lookbooks to organize your favorite try-on results, plan outfits for different occasions, or save inspiration for future styling ideas.`,
    },
    {
      question: t`How do I get the best try-on results?`,
      answer: t`For optimal results, use a well-lit photo where you're facing the camera directly. Wear form-fitting clothes and ensure your full body is visible. Avoid busy backgrounds and make sure the garment image is clear and high-quality.`,
    },
    {
      question: t`Can I save and share my try-ons?`,
      answer: t`Yes! All your try-on results are automatically saved to your profile. You can add them to lookbooks, download them, or share them directly with friends and family for feedback on your style choices.`,
    },
    {
      question: t`What types of garments can I try on?`,
      answer: t`Drezzi supports a wide variety of clothing including tops, dresses, jackets, and more. You can upload images of garments from any source or browse our curated collection to find pieces to virtually try on.`,
    },
    {
      question: t`How long does a try-on take to process?`,
      answer: t`Most try-ons complete within 30 seconds to a minute. Processing time may vary depending on image complexity. You'll receive a notification when your try-on is ready to view.`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description={t`Get help, access documentation, and find answers to common questions about Drezzi.`}
        title={t`Support`}
      />

      <SubPageHeader title={t`Frequently Asked Questions`} />

      <Card className="rounded-xl">
        <CardContent className="pt-2">
          <Accordion collapsible type="single">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <SubPageHeader title={t`Contact Us`} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1" variant="outline">
          <a href={`mailto:${DREZZI_SUPPORT_EMAIL}`}>
            <MailIcon className="mr-2 size-4" />
            <Trans>Email Support</Trans>
          </a>
        </Button>
      </div>
    </div>
  );
};

export default SupportScreen;
