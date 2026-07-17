import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageCircle, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { REVIEW_ROUTING } from '@/lib/constants';
import {
  fetchReviewRequestPrefill,
  markReviewRequestOpened,
  submitReview,
  isPositiveRating,
  type ReviewRequestPrefill,
  type ReviewRoutedTo,
} from '@/lib/reviews';

type Step = 'loading' | 'rate' | 'positive' | 'negative' | 'done';

const ACTIVITY_LABELS: Record<string, string> = {
  paddle: 'paddle',
  kayak: 'kayak',
  velo: 'paddle vélo',
  famille: 'paddle famille',
  wakeboard: 'wakeboard',
};

export default function ReviewPage() {
  const { token } = useParams<{ token?: string }>();
  const [step, setStep] = useState<Step>(token ? 'loading' : 'rate');
  const [prefill, setPrefill] = useState<ReviewRequestPrefill | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchReviewRequestPrefill(token).then((result) => {
      if (cancelled) return;
      setPrefill(result);
      setStep('rate');
      markReviewRequestOpened(token);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const chooseRating = (value: number) => {
    setRating(value);
    setStep(isPositiveRating(value) ? 'positive' : 'negative');
  };

  const finishPositive = async (routedTo: ReviewRoutedTo, url: string) => {
    setSubmitting(true);
    await submitReview({ rating, routedTo, token });
    window.open(url, '_blank', 'noopener,noreferrer');
    setSubmitting(false);
    setStep('done');
  };

  const submitNegative = async () => {
    setSubmitting(true);
    await submitReview({ rating, routedTo: 'internal', token, feedbackText, contactPhone });
    setSubmitting(false);
    setStep('done');
  };

  const activityLabel = prefill?.activity ? ACTIVITY_LABELS[prefill.activity] ?? prefill.activity : null;
  const greeting = prefill?.firstName
    ? `Bonjour ${prefill.firstName} !`
    : 'Bonjour !';
  const subGreeting = activityLabel
    ? `Comment était votre session de ${activityLabel} ?`
    : 'Comment était votre session chez Alo Paddle Zarzis ?';

  return (
    <Layout hideFooter>
      <section className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center font-ui text-muted-foreground"
              >
                Un instant…
              </motion.div>
            )}

            {step === 'rate' && (
              <motion.div
                key="rate"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
                className="text-center"
              >
                <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  {greeting}
                </p>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">
                  {subGreeting}
                </h1>
                <div className="flex justify-center gap-2 mb-4" role="radiogroup" aria-label="Note">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
                      onClick={() => chooseRating(value)}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 active:scale-90 transition-transform"
                    >
                      <Star
                        className="w-11 h-11 md:w-12 md:h-12 transition-colors"
                        fill={(hoverRating || rating) >= value ? 'hsl(var(--accent-gold, 38 55% 62%))' : 'none'}
                        strokeWidth={1.5}
                        style={{
                          color: (hoverRating || rating) >= value ? '#D4A574' : 'currentColor',
                        }}
                      />
                    </button>
                  ))}
                </div>
                <p className="font-ui text-sm text-muted-foreground">Touchez pour noter</p>
              </motion.div>
            )}

            {step === 'positive' && (
              <motion.div
                key="positive"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
                className="text-center"
              >
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
                  Merci ! 🌊
                </h1>
                <p className="font-ui text-muted-foreground mb-8">
                  Ça nous ferait très plaisir que vous partagiez ça publiquement — ça prend 30 secondes.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    size="lg"
                    disabled={submitting}
                    onClick={() => finishPositive('google', REVIEW_ROUTING.googleUrl)}
                    className="w-full"
                  >
                    Laisser un avis sur Google
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  {REVIEW_ROUTING.tripadvisorUrl && (
                    <Button
                      size="lg"
                      variant="outline"
                      disabled={submitting}
                      onClick={() => finishPositive('tripadvisor', REVIEW_ROUTING.tripadvisorUrl)}
                      className="w-full"
                    >
                      Laisser un avis sur TripAdvisor
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'negative' && (
              <motion.div
                key="negative"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
              >
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-2 text-center">
                  On peut faire mieux.
                </h1>
                <p className="font-ui text-muted-foreground mb-6 text-center">
                  Dites-nous ce qui n'a pas été — c'est envoyé directement à l'équipe, en privé.
                </p>
                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Qu'est-ce qu'on peut améliorer ? (optionnel)"
                  className="mb-3 min-h-[120px]"
                />
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Votre numéro, si vous voulez qu'on vous rappelle (optionnel)"
                  className="mb-6"
                />
                <Button size="lg" disabled={submitting} onClick={submitNegative} className="w-full">
                  Envoyer
                </Button>
              </motion.div>
            )}

            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <CheckCircle2 className="w-14 h-14 mx-auto mb-4 text-accent-turquoise" />
                <h1 className="font-display text-3xl font-bold mb-3">Merci beaucoup !</h1>
                <p className="font-ui text-muted-foreground">
                  {rating >= REVIEW_ROUTING.positiveThreshold
                    ? "Votre avis compte énormément pour nous."
                    : "Un membre de l'équipe va prendre connaissance de votre message."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </Layout>
  );
}
