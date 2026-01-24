'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, CircularProgress, keyframes } from '@mui/material';
import { useTranslations, useLocale} from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTarotAI } from 'src/hooks/useTarotAI';
import { supabase } from 'src/lib/supabase/supabaseClient';
import dynamic from 'next/dynamic';

import { redirectToStripe } from 'src/lib/checkout/redirectToStripe';
import { FramedTitle } from './ui/FramedTitle';
import { RoundedInput } from './ui/RoundedInput';
import { GradientButton } from './ui/GradientButton';
import { validateQuestionInput } from 'src/validations/validateQuestionInput';
import toast from 'react-hot-toast';

// Динамические импорты для ускорения загрузки:
const HistoryPanel = dynamic(() => import('./History/HistoryPanel'), {
  ssr: false,
});
const PurchaseModal = dynamic(() => import('./PurchaseModal'), { ssr: false });
const TipsList = dynamic<{ tips: string[] }>(
  () => import('./TipsList').then((mod) => mod.TipsList),
  { ssr: false },
);
const CardDisplay = dynamic(
  () => import('./Cards/CardDisplay').then((mod) => mod.CardDisplay),
  { ssr: false },
);

const DynamicFollowUpButtons = dynamic(
  () => import('./FollowUpButtons').then((mod) => mod.FollowUpButtons),
  { ssr: false },
);
const DynamicPurchaseButton = dynamic(() => import('./PurchaseButton'), {
  ssr: false,
});
const DynamicMagicLoader = dynamic(() => import('./MagicLoader'), {
  ssr: false,
});
const DynamicDeckSelector = dynamic(() => import('./Deck/DeckSelector'), {
  ssr: false,
});
const DynamicDeckCover = dynamic(() => import('./Deck/DeckCover'), {
  ssr: false,
});
const DynamicSaveHistoryNotice = dynamic(
  () => import('./History/SaveHistoryNotice'),
  { ssr: false },
);
const DynamicNotAuthorizedNotice = dynamic(
  () =>
    import('./ui/NotAuthorizedNotice').then((mod) => mod.NotAuthorizedNotice),
  { ssr: false },
);

interface Props {
  userQuestion: string;
  onReset: () => void;
}

const pulseBorder = keyframes`
  0% { box-shadow: 0 0 10px rgba(255,215,0,0.4), 0 0 20px rgba(255,215,0,0.3); border-color: rgba(255,215,0,0.6); }
  50% { box-shadow: 0 0 20px rgba(255,215,0,0.7), 0 0 30px rgba(255,215,0,0.5); border-color: rgba(255,215,0,1); }
  100% { box-shadow: 0 0 10px rgba(255,215,0,0.4), 0 0 20px rgba(255,215,0,0.3); border-color: rgba(255,215,0,0.6); }
`;

const TarotDraw: React.FC<Props> = ({
  userQuestion: initialQuestionProp,
  onReset,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentQuestion, setCurrentQuestion] = useState(initialQuestionProp);

  const {
    greeting,
    selectedCard,
    data,
    loading,
    pendingPrompt,
    drawInitial,
    drawPending,
    prepareFollowUp,
    deckVersion,
    setDeckVersion,
    setUserQuestion,
  } = useTarotAI(initialQuestionProp);

  const [user, setUser] = useState<any | null | undefined>(undefined);
  const [cardCredits, setCardCredits] = useState(0);
  const [subscriptionCredits, setSubscriptionCredits] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [customFollowUp, setCustomFollowUp] = useState('');
  const [isCustomFollowUpActive, setIsCustomFollowUpActive] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [historyRecorded, setHistoryRecorded] = useState(false);
  const [dbHistory, setDbHistory] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [displayedGreeting, setDisplayedGreeting] = useState('');
  const [showGreetingLoader, setShowGreetingLoader] = useState(false);

  const customFollowUpInputRef = useRef<HTMLInputElement | null>(null);
  const initialQuestionInputRef = useRef<HTMLInputElement | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentQuestion(initialQuestionProp);
  }, [initialQuestionProp]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  useEffect(() => {
    const cards = Number(searchParams.get('cards') || 0);
    if (cards > 0 && user) {
      (async () => {
        const { data: row } = await supabase
          .from('card_credits')
          .select('credits')
          .eq('user_id', user.id)
          .maybeSingle();
        const current = row?.credits || 0;
        await supabase
          .from('card_credits')
          .upsert({ user_id: user.id, credits: current + cards });
        const url = new URL(window.location.href);
        url.searchParams.delete('cards');
        window.history.replaceState({}, '', url);

        window.dispatchEvent(new Event('refresh-card-credits'));
      })();
    }
  }, [searchParams, user]);

  // +++++++++++++++++ ДОБАВЛЕНО: Функция, гарантирующая выдачу стартовых 3 кредитов ДО чтения балансов
  async function ensureStarterCredits(userId: string) {
    try {
      const { data: oneTimeCreditsData } = await supabase
        .from('card_credits')
        .select('credits')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('subscription_credits_remaining')
        .eq('user_id', userId)
        .maybeSingle();

      // Если у пользователя нет ни разовых кредитов (строки нет), ни подписки — выдаём стартовые 3
      if (!oneTimeCreditsData && !subscriptionData) {
        await supabase.from('card_credits').insert({ user_id: userId, credits: 4 });
        toast.success(t('youHaveFreeCards')); 
      }
    } catch (e) {
      console.error('ensureStarterCredits error', e);
    }
  }

 
  // +++++++++++++++++ ИЗМЕНЕНО: основной эффект загрузки кредитов — сначала ensureStarterCredits, потом чтение балансов
  useEffect(() => {
    if (!user) return;
    const handleRefreshCredits = async () => {
      await fetchCredits();
    };
    window.addEventListener('refresh-card-credits', handleRefreshCredits);

    const fetchCredits = async () => {
      // 1) Гарантируем начальные 3 кредита (если нужно)
      await ensureStarterCredits(user.id);

      // 2) Читаем актуальные балансы
      const { data: row, error } = await supabase
        .from('card_credits')
        .select('credits')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && (error as any).code !== 'PGRST116') {
        console.error( error);
      }
      setCardCredits(row?.credits || 0);

      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('subscription_credits_remaining')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError && (subError as any).code !== 'PGRST116') {
        console.error( subError);
      }
      setSubscriptionCredits(subData?.subscription_credits_remaining ?? 0);

      const { data: historyData } = await supabase
        .from('session_history')
        .select('item')
        .eq('session_id', user.id)
        .order('id', { ascending: false })
        .limit(50);
      setDbHistory(historyData?.map((row) => row.item) || []);

      setIsDataLoaded(true);
    };

    fetchCredits();
    return () => {
      window.removeEventListener('refresh-card-credits', handleRefreshCredits);
    };
  }, [user, historyRecorded]);

  // +++++++++++++++++ УДАЛЕНО: старый закомментированный useEffect с card_usage (оставляем только новый)

  useEffect(() => {
    if (user && selectedCard && data && !historyRecorded) {
      (async () => {
        await supabase.from('session_history').insert({
          session_id: user.id,
          item: {
            user_id: user.id,
            question: currentQuestion,
            card: selectedCard,
            response: data,
            language: locale,
            timestamp: new Date().toISOString(),
          },
        });
        setHistoryRecorded(true);
      })();
    }
  }, [user, selectedCard, data, currentQuestion, historyRecorded, locale]);

  const scrollToDeck = () => {
    if (deckRef.current) {
      deckRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  useEffect(() => {
    if (deckVersion && !selectedCard && !loading) {
      scrollToDeck();
    }
  }, [deckVersion, selectedCard, loading, data]);

  useEffect(() => {
    if (
      currentQuestion === '' &&
      deckVersion &&
      !selectedCard &&
      !loading &&
      initialQuestionInputRef.current
    ) {
      initialQuestionInputRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      initialQuestionInputRef.current.focus();
    }
  }, [currentQuestion, deckVersion, selectedCard, loading]);

  useEffect(() => {
    if (isCustomFollowUpActive && customFollowUpInputRef.current) {
      customFollowUpInputRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      customFollowUpInputRef.current.focus();
    }
  }, [isCustomFollowUpActive]);

  // НОВЫЙ useEffect для greeting (без изменений в этой части)
  useEffect(() => {
    if (deckVersion && !selectedCard && loading && !greeting) {
      setShowGreetingLoader(true);
      setDisplayedGreeting('');
    } else if (greeting && !loading) {
      setShowGreetingLoader(false);
      let i = 0;
      const typingInterval = setInterval(() => {
        setDisplayedGreeting((prev) => prev + greeting.charAt(i));
        i++;
        if (i === greeting.length) {
          clearInterval(typingInterval);
        }
      }, 30);
      return () => clearInterval(typingInterval);
    } else {
      setShowGreetingLoader(false);
      setDisplayedGreeting('');
    }
  }, [deckVersion, selectedCard, loading, greeting]);

  // +++++++++++++++++ ИЗМЕНЕНО: handleDraw — ВСЕГДА списываем 1 кредит (подписка → разовые), без usageLimit/card_usage
  const handleDraw = async (isPending: boolean) => {
    if (!user) {
      setErrorMessage(t('notAuthorized'));
      return;
    }

    const available = subscriptionCredits + cardCredits;
    if (available <= 0) {
      setErrorMessage(t('noMoreDraws'));
      return;
    }

    // Пытаемся списать из подписки
    if (subscriptionCredits > 0) {
      const { error: updateSubError } = await supabase
        .from('subscriptions')
        .update({ subscription_credits_remaining: subscriptionCredits - 1 })
        .eq('user_id', user.id);

      if (updateSubError) {
        // console.error( updateSubError);
        setErrorMessage(t('errorProcessingDraw'));
        return;
      }
    } else {
      // Иначе списываем разовые
      const { error: updateCardError } = await supabase
        .from('card_credits')
        .update({ credits: cardCredits - 1 })
        .eq('user_id', user.id);

      if (updateCardError) {
        // console.error('Ошибка при списании разовых кредитов:', updateCardError);
        setErrorMessage(t('errorProcessingDraw'));
        return;
      }
    }

    setHistoryRecorded(false);
    window.dispatchEvent(new Event('refresh-card-credits'));

    isPending ? drawPending() : drawInitial();
  };

  if (user === null) {
    return (
      <DynamicNotAuthorizedNotice
        title={t('notAuthorized')}
        description={t('pleaseLoginToDraw')}
        buttonLabel={t('login')}
      />
    );
  }
  if (user === undefined || !isDataLoaded) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', color: 'white' }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  // +++++++++++++++++ ИЗМЕНЕНО: считаем только реальные кредиты
  const totalCredits = cardCredits + subscriptionCredits;

  // +++++++++++++++++ ИЗМЕНЕНО: если нет кредитов вообще — предлагаем купить (без totalUsed/usageLimit)
  if (totalCredits <= 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4, color: 'white' }}>
        <Typography
          variant="subtitle1"
          sx={{
            mb: 2,
            color: '#F1E7DF',
            fontFamily: 'Cormorant Garamond, serif',
            textAlign: 'center',
          }}
        >
          {t('noMoreDraws')}
        </Typography>
        <DynamicPurchaseButton onClick={() => setShowModal(true)} />
        {showModal && (
          <PurchaseModal
            open={showModal}
            onClose={() => setShowModal(false)}
            onPurchase={async (count) => {
              setShowModal(false);
              await redirectToStripe(count);
            }}
          />
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: 'center', p: 4, color: 'white' }}>
      {!deckVersion && (
        <>
          <FramedTitle text={t('chooseDeck')} />
          <DynamicDeckSelector
            onSelect={setDeckVersion}
            selected={deckVersion}
            disabled={false}
            loading={false}
          />
        </>
      )}

      {deckVersion &&
        !selectedCard &&
        !loading &&
        !greeting &&
        !pendingPrompt && (
          <Box sx={{ mt: 3, position: 'relative', p: 2 }}>
            <FramedTitle text={t('askYourQuestion')} />
            <RoundedInput
              value={currentQuestion}
              inputRef={initialQuestionInputRef}
              placeholder={t('askYourQuestionPlaceholder')}
              onChange={(e) => {
                setCurrentQuestion(e.target.value);
                setUserQuestion(validateQuestionInput(e.target.value, 250));
              }}
              inputProps={{ maxLength: 250 }}
            />
            <Typography
              variant="body2"
              sx={{
                mt: 1,
                color: '#F1E7DF',
                fontFamily: 'Cormorant Garamond, serif',
                textAlign: 'center',
              }}
            >
              {`${currentQuestion.length} / 250`}
            </Typography>
            <GradientButton
              onClick={() => handleDraw(false)}
              disabled={!currentQuestion.trim()}
            >
              {t('drawCard')}
            </GradientButton>
          </Box>
        )}

      {deckVersion && greeting && (
        <Typography align="justify" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
          {displayedGreeting}
        </Typography>
      )}

      {deckVersion &&
        !selectedCard &&
        !loading &&
        (greeting || pendingPrompt) && (
          <Box sx={{ mb: 4 }} ref={deckRef}>
            <DynamicDeckCover
              onClick={() => handleDraw(Boolean(pendingPrompt))}
              disabled={loading}
              shuffling
              deckVersion={deckVersion}
            />
          </Box>
        )}

      {selectedCard && <CardDisplay card={selectedCard} />}
      {selectedCard && loading && (
        <Box
          sx={{
            mt: 2,
            width: 120,
            height: 120,
            mx: 'auto',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <DynamicMagicLoader />
        </Box>
      )}

      {data && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6">{t('cardMeaning')}</Typography>
          <Typography align="justify" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
            {data.interpretation}
          </Typography>
          {data?.tips?.length > 0 && <TipsList tips={data.tips} />}
          {data?.followUps?.length > 0 && (
            <>
              <DynamicFollowUpButtons
                followUps={data.followUps}
                onFollowAction={(q: string) => {
                  prepareFollowUp(q);
                  setCurrentQuestion(q);
                  setHistoryRecorded(false);
                }}
                onNewQuestionAction={() => {
                  setIsCustomFollowUpActive(true);
                }}
                onNewSessionAction={() => {
                  onReset();
                  setCurrentQuestion('');
                  setIsCustomFollowUpActive(false);
                }}
              />
              {isCustomFollowUpActive && (
                <Box sx={{ mt: 3, position: 'relative', p: 2 }}>
                  <FramedTitle text={t('askYourFollowUp')} />
                  <RoundedInput
                    value={customFollowUp}
                    inputRef={customFollowUpInputRef}
                    placeholder={t('askYourFollowUp')}
                    onChange={(e) =>
                      setCustomFollowUp(
                        validateQuestionInput(e.target.value, 250),
                      )
                    }
                    inputProps={{ maxLength: 250 }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      color: '#F1E7DF',
                      fontFamily: 'Cormorant Garamond, serif',
                      textAlign: 'center',
                    }}
                  >
                    {`${customFollowUp.length} / 250`}
                  </Typography>
                  <GradientButton
                    onClick={() => {
                      prepareFollowUp(customFollowUp.trim());
                      setCurrentQuestion(customFollowUp.trim());
                      setIsCustomFollowUpActive(false);
                      setCustomFollowUp('');
                      setHistoryRecorded(false);
                    }}
                    disabled={!customFollowUp.trim()}
                  >
                    {t('confirm')}
                  </GradientButton>
                </Box>
              )}
            </>
          )}
          <DynamicSaveHistoryNotice history={dbHistory} />
        </Box>
      )}
      <HistoryPanel history={dbHistory} />
      {errorMessage && (
        <Typography color="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Typography>
      )}
    </Box>
  );
};

export default TarotDraw;
