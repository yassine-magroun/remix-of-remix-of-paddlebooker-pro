import { Layout } from "@/components/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

const FAQPage = () => {
  const { t } = useLanguage();

  const faqs = [
    { q: t.faq1q, a: t.faq1a },
    { q: t.faq2q, a: t.faq2a },
    { q: t.faq3q, a: t.faq3a },
    { q: t.faq4q, a: t.faq4a },
    { q: t.faq5q, a: t.faq5a },
    { q: t.faq6q, a: t.faq6a },
    { q: t.faq7q, a: t.faq7a },
    { q: t.faq8q, a: t.faq8a },
  ];

  return (
    <Layout>
      <section className="py-20">
        <div className="container max-w-2xl">
          <div className="text-center mb-16">
            <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{t.faq}</p>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">{t.faqTitle}</h1>
            <p className="font-ui text-lg text-muted-foreground">{t.faqDesc}</p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-2xl border border-foreground/5 bg-card shadow-salt px-6 data-[state=open]:shadow-salt-lg transition-all"
              >
                <AccordionTrigger className="font-ui text-base font-semibold py-5 hover:no-underline text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="font-ui text-sm text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </Layout>
  );
};

export default FAQPage;
