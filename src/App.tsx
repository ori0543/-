/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle2, 
  AlertCircle, 
  Timer, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Download,
  BookOpen,
  Home,
  History,
  Settings,
  HelpCircle,
  Loader2,
  X,
  Eye,
  Accessibility,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { 
  generateQuiz, 
  extractTopics, 
  evaluateOpenAnswer,
  type QuizData, 
  type Question, 
  type QuestionType 
} from '@/src/lib/gemini';
import { jsPDF } from 'jspdf';

type Step = 'subject' | 'grade' | 'input' | 'topics' | 'quiz' | 'exam' | 'results' | 'history';

interface HistoryItem {
  id: string;
  date: string;
  subject: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  quizData: QuizData;
  userAnswers: Record<string, any>;
}

const SUBJECTS = [
  { id: 'math', name: 'מתמטיקה', icon: '📐', color: 'bg-blue-500' },
  { id: 'physics', name: 'פיזיקה', icon: '⚛️', color: 'bg-indigo-500' },
  { id: 'chemistry', name: 'כימיה', icon: '🧪', color: 'bg-emerald-500' },
  { id: 'biology', name: 'ביולוגיה', icon: '🌿', color: 'bg-green-500' },
  { id: 'hebrew', name: 'לשון', icon: '🟣', color: 'bg-purple-500' },
  { id: 'literature', name: 'ספרות', icon: '📚', color: 'bg-pink-500' },
  { id: 'history', name: 'היסטוריה', icon: '🏛️', color: 'bg-amber-500' },
  { id: 'english', name: 'אנגלית', icon: '🇬🇧', color: 'bg-red-500' },
  { id: 'other', name: 'מקצועות נוספים', icon: '✨', color: 'bg-slate-500' },
];

const GRADES = [
  { id: '1', name: 'כיתה א\'' },
  { id: '2', name: 'כיתה ב\'' },
  { id: '3', name: 'כיתה ג\'' },
  { id: '4', name: 'כיתה ד\'' },
  { id: '5', name: 'כיתה ה\'' },
  { id: '6', name: 'כיתה ו\'' },
  { id: '7', name: 'כיתה ז\'' },
  { id: '8', name: 'כיתה ח\'' },
  { id: '9', name: 'כיתה ט\'' },
  { id: '10', name: 'כיתה י\'' },
  { id: '11', name: 'כיתה י"א' },
  { id: '12', name: 'כיתה י"ב' },
  { id: 'academic', name: 'אקדמיה' },
];

const QUESTION_TYPES: { id: QuestionType; name: string }[] = [
  { id: 'multiple-choice', name: 'אמריקאיות' },
  { id: 'open', name: 'פתוחות' },
  { id: 'true-false', name: 'נכון/לא נכון' },
  { id: 'completion', name: 'השלמה' },
];

const AccessibilityMenu = ({ settings, setSettings }: any) => (
  <Sheet>
    <SheetTrigger render={
      <Button variant="outline" size="icon" className="fixed bottom-6 left-6 rounded-full shadow-lg z-50 bg-white hover:bg-gray-50 border-orange-200">
        <Accessibility className="w-6 h-6 text-orange-600" />
      </Button>
    } />
    <SheetContent side="left" className="w-80">
      <SheetHeader className="text-right mb-6">
        <SheetTitle className="text-2xl font-bold flex items-center justify-end gap-2">
          נגישות
          <Accessibility className="w-6 h-6 text-orange-600" />
        </SheetTitle>
        <SheetDescription>התאם את האתר לנוחותך</SheetDescription>
      </SheetHeader>
      <div className="space-y-8 text-right">
        <div className="space-y-4">
          <Label className="text-lg">גודל גופן</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant={settings.fontSize === 'normal' ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, fontSize: 'normal' })}
              className={settings.fontSize === 'normal' ? 'bg-orange-500' : ''}
            >
              רגיל
            </Button>
            <Button 
              variant={settings.fontSize === 'large' ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, fontSize: 'large' })}
              className={settings.fontSize === 'large' ? 'bg-orange-500' : ''}
            >
              גדול
            </Button>
            <Button 
              variant={settings.fontSize === 'xl' ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, fontSize: 'xl' })}
              className={settings.fontSize === 'xl' ? 'bg-orange-500' : ''}
            >
              ענק
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-lg">ניגודיות</Label>
          <div className="flex gap-2 justify-end">
            <Button 
              variant={settings.contrast === 'high' ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, contrast: settings.contrast === 'high' ? 'normal' : 'high' })}
              className={settings.contrast === 'high' ? 'bg-orange-500' : ''}
            >
              {settings.contrast === 'high' ? 'ניגודיות גבוהה פעילה' : 'הפעל ניגודיות גבוהה'}
            </Button>
          </div>
        </div>

        <div className="pt-6 border-t">
          <p className="text-sm text-gray-500 leading-relaxed">
            אנו פועלים להנגשת האתר לכלל האוכלוסייה. אם נתקלת בבעיה, נשמח לשמוע ממך.
          </p>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

const LegalDialog = ({ type }: { type: 'terms' | 'privacy' }) => {
  const date = new Date().toLocaleDateString('he-IL');
  
  return (
    <Sheet>
      <SheetTrigger render={
        <Button variant="link" size="sm" className="text-gray-400 hover:text-orange-600">
          {type === 'terms' ? 'תקנון שימוש' : 'מדיניות פרטיות'}
        </Button>
      } />
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader className="text-right mb-6">
          <SheetTitle className="text-2xl font-bold flex items-center justify-end gap-2">
            {type === 'terms' ? 'תקנון שימוש באתר' : 'מדיניות פרטיות'}
            {type === 'terms' ? <Scale className="w-6 h-6 text-orange-600" /> : <ShieldCheck className="w-6 h-6 text-orange-600" />}
          </SheetTitle>
          <SheetDescription>עודכן לאחרונה: {date}</SheetDescription>
        </SheetHeader>
        <div className="prose prose-orange max-w-none text-right leading-relaxed text-gray-700 space-y-6 pb-12">
          {type === 'terms' ? (
            <>
              <section>
                <h3 className="text-xl font-bold mb-2">1. כללי</h3>
                <p>ברוכים הבאים לאתר. השימוש באתר מהווה הסכמה מלאה לתנאי תקנון זה. אם אינך מסכים לתנאים – אין להשתמש באתר.</p>
                <p>האתר מספק כלי לימודי ליצירת שאלות, תרגולים ומבחנים ממקורות שונים כגון קבצי PDF או טקסט שהוזן על ידי המשתמש.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">2. שימוש מותר באתר</h3>
                <p>המשתמש מתחייב:</p>
                <ul className="list-disc list-inside">
                  <li>להשתמש באתר לצרכים חוקיים בלבד</li>
                  <li>לא להעלות תוכן פוגעני, לא חוקי או מפר זכויות</li>
                  <li>לא לבצע ניסיון לפגוע בפעילות האתר (פריצה, עומס מכוון וכו')</li>
                </ul>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">3. אחריות על תוכן</h3>
                <p>המשתמש אחראי לכל תוכן שהוא מעלה (כולל קבצי PDF וטקסטים). אין להעלות תוכן המפר זכויות יוצרים ללא אישור. הנהלת האתר אינה אחראית לתוכן שהוזן על ידי המשתמש.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">4. דיוק המידע</h3>
                <p>המערכת מבוססת טכנולוגיה מתקדמת ולכן ייתכנו טעויות. אין להסתמך על התוכן באופן בלעדי לצורך מבחנים רשמיים. האתר אינו מתחייב לדיוק מלא או להתאמה לתוכנית לימודים ספציפית.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">5. קניין רוחני</h3>
                <p>כל הזכויות באתר, בעיצוב, בקוד ובמערכת – שייכות לבעלי האתר. אין להעתיק, לשכפל או להפיץ ללא אישור מראש.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">6. הגבלת אחריות</h3>
                <p>האתר לא יהיה אחראי לנזקים ישירים או עקיפים משימוש במערכת, לאובדן מידע או לטעויות בתוכן הלימודי.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">7. זמינות השירות</h3>
                <p>האתר עשוי להיות לא זמין מעת לעת. הנהלת האתר רשאית להפסיק או לשנות את השירות בכל עת.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">8. שינויים בתקנון</h3>
                <p>האתר רשאי לעדכן את התקנון בכל זמן ללא הודעה מוקדמת.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">9. דין וסמכות שיפוט</h3>
                <p>הדין החל הוא הדין הישראלי בלבד. סמכות השיפוט תהיה בבתי המשפט המוסמכים בישראל.</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h3 className="text-xl font-bold mb-2">1. מידע שנאסף</h3>
                <p>בעת שימוש באתר ייתכן וייאסף המידע הבא:</p>
                <ul className="list-disc list-inside">
                  <li>פרטים מזהים (שם, אימייל וכו')</li>
                  <li>תוכן שהמשתמש מעלה (PDF, טקסט)</li>
                  <li>נתוני שימוש (פעילות באתר, תרגולים, תשובות)</li>
                  <li>מידע טכני (IP, סוג מכשיר, דפדפן)</li>
                </ul>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">2. שימוש במידע</h3>
                <p>המידע ישמש לצורך תפעול ושיפור השירות, התאמה אישית של תרגולים, ניתוח ביצועים ואבטחה.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">3. שימוש בטכנולוגיה</h3>
                <p>התוכן שהמשתמש מעלה עשוי להיות מעובד על ידי מערכות מתקדמות. ייתכן שימוש בשירותים חיצוניים לצורך עיבוד.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">4. שיתוף מידע עם צד שלישי</h3>
                <p>האתר לא ימכור מידע אישי. שיתוף מידע יתבצע רק לצורך תפעול השירות (ספקי ענן וכדומה), דרישה חוקית או הגנה על זכויות האתר.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">5. אבטחת מידע</h3>
                <p>האתר נוקט באמצעי אבטחה סבירים לשמירה על המידע, אך אין אבטחה מוחלטת.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">6. שמירת מידע</h3>
                <p>המידע יישמר כל עוד הוא נדרש לצורך מתן השירות, אלא אם המשתמש יבקש מחיקה.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">7. זכויות המשתמש</h3>
                <p>למשתמש יש זכות לעיין במידע שנשמר עליו, לבקש תיקון או מחיקה ולבטל הסכמה לשימוש במידע.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">8. קובצי Cookies</h3>
                <p>האתר משתמש ב-Cookies לצורך שיפור חוויית משתמש, שמירת העדפות וניתוח תנועה באתר.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-2">9. קטינים</h3>
                <p>אם אתה מתחת לגיל 18 – השימוש באתר באחריות הורה/אפוטרופוס.</p>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Decorative elements for children
const DecorativeElements = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <motion.div 
      animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
      transition={{ duration: 5, repeat: Infinity }}
      className="absolute top-20 -left-10 opacity-20"
    >
      <img src="https://picsum.photos/seed/rocket/200/200" alt="rocket" className="w-40 h-40 rounded-full" referrerPolicy="no-referrer" />
    </motion.div>
    <motion.div 
      animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
      transition={{ duration: 6, repeat: Infinity }}
      className="absolute bottom-20 -right-10 opacity-20"
    >
      <img src="https://picsum.photos/seed/planet/200/200" alt="planet" className="w-40 h-40 rounded-full" referrerPolicy="no-referrer" />
    </motion.div>
    <div className="absolute top-1/2 left-10 opacity-10 text-6xl">🎨</div>
    <div className="absolute bottom-1/4 right-20 opacity-10 text-6xl">🚀</div>
    <div className="absolute top-1/4 right-10 opacity-10 text-6xl">🧪</div>
    <div className="absolute bottom-10 left-20 opacity-10 text-6xl">📚</div>
  </div>
);

// Sub-components for better performance and organization
const SubjectSelection = memo(({ onSelect, currentSubject }: { onSelect: (id: string) => void, currentSubject: string }) => (
  <motion.div
    key="subject"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6"
  >
    <div className="text-center space-y-2 mb-8">
      <h2 className="text-3xl font-extrabold tracking-tight">בחר מקצוע לימודי</h2>
      <p className="text-gray-500">המערכת תתאים את סוג השאלות והרמה לפי המקצוע</p>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {SUBJECTS.map((s) => (
        <Card 
          key={s.id}
          className={`cursor-pointer hover:border-orange-500 transition-all hover:shadow-md ${currentSubject === s.id ? 'border-orange-500 bg-orange-50' : ''}`}
          onClick={() => onSelect(s.id)}
        >
          <CardContent className="flex flex-col items-center justify-center py-8 space-y-3">
            <span className="text-4xl">{s.icon}</span>
            <span className="font-bold">{s.name}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  </motion.div>
));

const InputStep = memo(({ onTextSubmit, onBack, inputText, setInputText, loading, error }: any) => (
  <motion.div
    key="input"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6"
  >
    <div className="text-center space-y-2 mb-8">
      <h2 className="text-3xl font-extrabold tracking-tight">צור שאלות תרגול חכמות</h2>
      <p className="text-gray-500">הזן טקסט כדי להתחיל</p>
    </div>

    <div className="max-w-xl mx-auto">
      <Card className="border-2 border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg">הזנת טקסט ידנית</CardTitle>
          <CardDescription>הדבק טקסט או הזן נושא ללימוד</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            placeholder="הזן כאן את התוכן שלך..." 
            className="min-h-[120px] resize-none"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <Button 
            className="w-full bg-orange-500 hover:bg-orange-600"
            onClick={onTextSubmit}
            disabled={!inputText.trim() || loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin ms-2" /> : <FileText className="w-4 h-4 ms-2" />}
            נתח תוכן
          </Button>
        </CardContent>
      </Card>
    </div>

    {error && (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        <p>{error}</p>
      </div>
    )}

    <div className="flex justify-center mt-4">
      <Button variant="ghost" onClick={onBack}>
        <ChevronRight className="w-4 h-4 ms-2" />
        חזור לבחירת כיתה
      </Button>
    </div>
  </motion.div>
));

export default function App() {
  const [step, setStep] = useState<Step>('subject');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Input state
  const [subject, setSubject] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  
  // Quiz options
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [level, setLevel] = useState<string>('10');
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>(['multiple-choice']);
  
  // Quiz data
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [openAnswerFeedback, setOpenAnswerFeedback] = useState<Record<string, any>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Exam state
  const [examStartTime, setExamStartTime] = useState<number | null>(null);
  const [examTimeLeft, setExamTimeLeft] = useState(0);
  const [isExamActive, setIsExamActive] = useState(false);
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    fontSize: 'normal',
    contrast: 'normal'
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('quiz_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('quiz_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (isExamActive && examTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setExamTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (examTimeLeft === 0 && isExamActive) {
      handleFinishExam();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isExamActive, examTimeLeft]);

  const handleTextSubmit = useCallback(async () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      setExtractedText(inputText);
      const extractedTopics = await extractTopics(inputText);
      setTopics(extractedTopics);
      setStep('topics');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'שגיאה בניתוח הטקסט. נסה שוב.');
    } finally {
      setLoading(false);
    }
  }, [inputText]);

  const handleGenerateQuiz = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateQuiz(extractedText, {
        subject,
        numQuestions,
        difficulty,
        level: level as any,
        questionTypes: selectedQuestionTypes,
        topic: selectedTopic === 'all' ? undefined : selectedTopic
      });
      setQuizData(data);
      setStep('quiz');
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setShowExplanation(false);
      setShowHint(false);
      setOpenAnswerFeedback({});
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'שגיאה ביצירת השאלות. נסה שוב.');
    } finally {
      setLoading(false);
    }
  }, [extractedText, subject, numQuestions, difficulty, level, selectedQuestionTypes, selectedTopic]);

  const handleEvaluateOpenAnswer = useCallback(async (questionId: string) => {
    if (!quizData) return;
    const question = quizData.questions[currentQuestionIndex];
    const userAnswer = userAnswers[questionId];
    
    if (!userAnswer) return;

    setIsEvaluating(true);
    try {
      const result = await evaluateOpenAnswer(question.question, question.correctAnswer, userAnswer);
      setOpenAnswerFeedback(prev => ({ ...prev, [questionId]: result }));
      setShowExplanation(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  }, [quizData, currentQuestionIndex, userAnswers]);

  const handleStartExam = useCallback(() => {
    setIsExamActive(true);
    setExamTimeLeft(numQuestions * 120); // 2 minutes per question
    setExamStartTime(Date.now());
    setStep('exam');
    setCurrentQuestionIndex(0);
    setUserAnswers({});
  }, [numQuestions]);

  const handleAnswer = useCallback((questionId: string, answer: any) => {
    if (isExamActive) {
      setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
    } else {
      setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
      setShowExplanation(true);
    }
  }, [isExamActive]);

  const exportToPDF = useCallback(() => {
    if (!quizData) return;
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });
    
    alert('ייצוא ל-PDF דורש הגדרת גופנים בעברית. התכונה תתווסף בקרוב.');
  }, [quizData]);

  const isCorrect = useCallback((q: Question) => {
    const userAns = userAnswers[q.id];
    if (userAns === undefined) return false;
    
    if (q.type === 'multiple-choice') {
      return String(userAns) === String(q.correctAnswer);
    }
    if (q.type === 'true-false') {
      const normalizedCorrect = q.correctAnswer === 'true' || q.correctAnswer === true;
      return userAns === normalizedCorrect;
    }
    if (q.type === 'open' || q.type === 'completion') {
      if (openAnswerFeedback[q.id]) return openAnswerFeedback[q.id].score >= 70;
      return String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
    }
    return false;
  }, [userAnswers, openAnswerFeedback]);

  const score = useMemo(() => {
    if (!quizData) return 0;
    let correct = 0;
    quizData.questions.forEach((q) => {
      if (isCorrect(q)) correct++;
    });
    return Math.round((correct / quizData.questions.length) * 100);
  }, [quizData, isCorrect]);

  const correctCount = useMemo(() => {
    if (!quizData) return 0;
    return quizData.questions.filter(q => isCorrect(q)).length;
  }, [quizData, isCorrect]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleFinishExam = useCallback(() => {
    setIsExamActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Save to history
    if (quizData) {
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toLocaleString('he-IL'),
        subject: SUBJECTS.find(s => s.id === subject)?.name || subject,
        score,
        correctCount,
        totalQuestions: quizData.questions.length,
        quizData,
        userAnswers
      };
      setHistory(prev => [newHistoryItem, ...prev]);
    }
    
    setStep('results');
  }, [quizData, subject, score, correctCount, userAnswers]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 text-[#1a1a1a] font-sans selection:bg-orange-100 relative
      ${accessibilitySettings.fontSize === 'large' ? 'text-lg' : accessibilitySettings.fontSize === 'xl' ? 'text-xl' : ''}
      ${accessibilitySettings.contrast === 'high' ? 'contrast-125 saturate-150' : ''}
    `} dir="rtl">
      <DecorativeElements />
      <AccessibilityMenu settings={accessibilitySettings} setSettings={setAccessibilitySettings} />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep('subject')}>
            <div className="bg-orange-500 p-2 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-blue-700">זמן למבחן</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setStep('subject')} className="text-gray-500">
              <Home className="w-4 h-4 ms-2" />
              מסך הבית
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setStep('history')} className="text-gray-500">
              <History className="w-4 h-4 ms-2" />
              היסטוריה
            </Button>
            {step !== 'subject' && (
              <Button variant="ghost" size="sm" onClick={() => setStep('subject')} className="text-gray-500">
                <RotateCcw className="w-4 h-4 ms-2" />
                התחל מחדש
              </Button>
            )}
            <Button variant="outline" size="icon" className="rounded-full">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {/* Step 0: Subject Selection */}
          {step === 'subject' && (
            <SubjectSelection 
              currentSubject={subject} 
              onSelect={(id) => {
                setSubject(id);
                setStep('grade');
              }} 
            />
          )}

          {/* Step 0.5: Grade Selection */}
          {step === 'grade' && (
            <motion.div
              key="grade"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-extrabold tracking-tight text-blue-600">באיזו כיתה אתה? 🎓</h2>
                <p className="text-gray-500 text-lg">נתאים את השאלות בדיוק לרמה שלך!</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {GRADES.map((g) => (
                  <Button
                    key={g.id}
                    variant={level === g.id ? "default" : "outline"}
                    className={`h-24 text-xl font-bold rounded-2xl transition-all hover:scale-105 ${level === g.id ? 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-200' : 'hover:border-blue-400'}`}
                    onClick={() => {
                      setLevel(g.id);
                      setStep('input');
                    }}
                  >
                    {g.name}
                  </Button>
                ))}
              </div>
              
              <div className="flex justify-center mt-8">
                <Button variant="ghost" onClick={() => setStep('subject')}>
                  <ChevronRight className="w-4 h-4 ms-2" />
                  חזור לבחירת מקצוע
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Input */}
          {step === 'input' && (
            <InputStep 
              onTextSubmit={handleTextSubmit}
              onBack={() => setStep('grade')}
              inputText={inputText}
              setInputText={setInputText}
              loading={loading}
              error={error}
            />
          )}

          {/* Step 2: Topics & Settings */}
          {step === 'topics' && (
            <motion.div
              key="topics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>הגדרות שאלון</CardTitle>
                  <CardDescription>בחר את הנושאים ורמת הקושי המבוקשת</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>בחר נושא מרכזי</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant={selectedTopic === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTopic('all')}
                        className={selectedTopic === 'all' ? 'bg-orange-500' : ''}
                      >
                        הכל
                      </Button>
                      {topics.map((topic, i) => (
                        <Button 
                          key={i}
                          variant={selectedTopic === topic ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTopic(topic)}
                          className={selectedTopic === topic ? 'bg-orange-500' : ''}
                        >
                          {topic}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>מספר שאלות</Label>
                      <Select value={numQuestions.toString()} onValueChange={(v) => setNumQuestions(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 שאלות</SelectItem>
                          <SelectItem value="10">10 שאלות</SelectItem>
                          <SelectItem value="15">15 שאלות</SelectItem>
                          <SelectItem value="20">20 שאלות</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>רמת קושי</Label>
                      <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">קל (ידע בסיסי)</SelectItem>
                          <SelectItem value="medium">בינוני (הבנה)</SelectItem>
                          <SelectItem value="hard">קשה (יישום)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>רמת לימוד</Label>
                      <Select value={level} onValueChange={(v: any) => setLevel(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADES.map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>סוגי שאלות</Label>
                    <div className="flex flex-wrap gap-2">
                      {QUESTION_TYPES.map((type) => (
                        <Button
                          key={type.id}
                          variant={selectedQuestionTypes.includes(type.id) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setSelectedQuestionTypes(prev => 
                              prev.includes(type.id) 
                                ? prev.filter(t => t !== type.id) 
                                : [...prev, type.id]
                            );
                          }}
                          className={selectedQuestionTypes.includes(type.id) ? 'bg-orange-500' : ''}
                        >
                          {type.name}
                        </Button>
                      ))}
                    </div>
                    {selectedQuestionTypes.length === 0 && (
                      <p className="text-xs text-red-500">יש לבחור לפחות סוג שאלה אחד</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <div className="flex gap-3 w-full">
                    <Button 
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                      onClick={handleGenerateQuiz}
                      disabled={loading || selectedQuestionTypes.length === 0}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin ms-2" /> : <Brain className="w-4 h-4 ms-2" />}
                      צור שאלות
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleStartExam}
                      disabled={loading}
                    >
                      <Timer className="w-4 h-4 ms-2" />
                      מצב מבחן
                    </Button>
                  </div>
                  <Button variant="ghost" onClick={() => setStep('input')} className="w-full">
                    <ChevronRight className="w-4 h-4 ms-2" />
                    חזור להזנת תוכן
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Quiz / Exam */}
          {(step === 'quiz' || step === 'exam') && quizData && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={() => setStep('topics')} className="h-8 w-8 p-0 rounded-full">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">{quizData.title}</h3>
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-gray-500">שאלה {currentQuestionIndex + 1} מתוך {quizData.questions.length}</p>
                    <Sheet>
                      <SheetTrigger render={
                        <Button variant="link" size="sm" className="h-auto p-0 text-orange-600">
                          <Eye className="w-3.5 h-3.5 ms-1" />
                          צפה בטקסט המקור
                        </Button>
                      } />
                      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                        <SheetHeader className="text-right mb-6">
                          <SheetTitle className="text-2xl font-bold">טקסט המקור</SheetTitle>
                          <SheetDescription>
                            הטקסט ששימש ליצירת השאלון
                          </SheetDescription>
                        </SheetHeader>
                        <div className="prose prose-sm max-w-none text-right leading-relaxed whitespace-pre-wrap text-gray-700 bg-gray-50 p-6 rounded-xl border border-gray-100">
                          {extractedText}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </div>
              {step === 'exam' && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold ${examTimeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
                    <Timer className="w-4 h-4" />
                    {formatTime(examTimeLeft)}
                  </div>
                )}
              </div>

              <Progress value={((currentQuestionIndex + 1) / quizData.questions.length) * 100} className="h-2" />

              <Card className="border-none shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        quizData.questions[currentQuestionIndex].difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        quizData.questions[currentQuestionIndex].difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {quizData.questions[currentQuestionIndex].difficulty === 'easy' ? 'קל' :
                         quizData.questions[currentQuestionIndex].difficulty === 'medium' ? 'בינוני' : 'קשה'}
                      </span>
                      {quizData.questions[currentQuestionIndex].topic && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {quizData.questions[currentQuestionIndex].topic}
                        </span>
                      )}
                    </div>
                    {quizData.questions[currentQuestionIndex].hint && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-orange-600 h-auto p-0 hover:bg-transparent"
                        onClick={() => setShowHint(!showHint)}
                      >
                        <HelpCircle className="w-4 h-4 ms-1" />
                        {showHint ? 'הסתר רמז' : 'צפה ברמז'}
                      </Button>
                    )}
                  </div>
                  {showHint && quizData.questions[currentQuestionIndex].hint && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-orange-50 p-3 rounded-lg text-sm text-orange-800 mb-4 border border-orange-100"
                    >
                      <strong>רמז:</strong> {quizData.questions[currentQuestionIndex].hint}
                    </motion.div>
                  )}
                  <CardTitle className="text-xl leading-relaxed">
                    {quizData.questions[currentQuestionIndex].question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Multiple Choice */}
                  {quizData.questions[currentQuestionIndex].type === 'multiple-choice' && quizData.questions[currentQuestionIndex].options && (
                    <div className="space-y-3">
                      {quizData.questions[currentQuestionIndex].options.map((option, i) => {
                        const isSelected = userAnswers[quizData.questions[currentQuestionIndex].id] === i;
                        const isCorrect = parseInt(quizData.questions[currentQuestionIndex].correctAnswer) === i;
                        const showResult = step === 'quiz' && userAnswers[quizData.questions[currentQuestionIndex].id] !== undefined;
                        
                        let variant = "outline";
                        let className = "w-full justify-start text-start h-auto py-4 px-6 text-base whitespace-normal leading-normal transition-all duration-200";
                        
                        if (isSelected) {
                          variant = "default";
                          className += " border-orange-500 bg-orange-50 text-orange-900 hover:bg-orange-100";
                        }
                        
                        if (showResult) {
                          if (isCorrect) {
                            className += " border-green-500 bg-green-50 text-green-900 hover:bg-green-50";
                          } else if (isSelected) {
                            className += " border-red-500 bg-red-50 text-red-900 hover:bg-red-50";
                          }
                        }

                        return (
                          <Button
                            key={i}
                            variant={variant as any}
                            className={className}
                            onClick={() => handleAnswer(quizData.questions[currentQuestionIndex].id, i)}
                            disabled={showResult}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{option}</span>
                              {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 ms-2" />}
                              {showResult && isSelected && !isCorrect && <X className="w-5 h-5 text-red-600 shrink-0 ms-2" />}
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  {/* True/False */}
                  {quizData.questions[currentQuestionIndex].type === 'true-false' && (
                    <div className="flex gap-4">
                      {[true, false].map((val) => {
                        const isSelected = userAnswers[quizData.questions[currentQuestionIndex].id] === val;
                        const isCorrect = (quizData.questions[currentQuestionIndex].correctAnswer === 'true' || quizData.questions[currentQuestionIndex].correctAnswer === true) === val;
                        const showResult = step === 'quiz' && userAnswers[quizData.questions[currentQuestionIndex].id] !== undefined;

                        return (
                          <Button
                            key={val.toString()}
                            variant={isSelected ? "default" : "outline"}
                            className={`flex-1 py-8 text-xl ${showResult && isCorrect ? 'border-green-500 bg-green-50' : showResult && isSelected ? 'border-red-500 bg-red-50' : isSelected ? 'bg-orange-50 border-orange-500 text-orange-900' : ''}`}
                            onClick={() => handleAnswer(quizData.questions[currentQuestionIndex].id, val)}
                            disabled={showResult}
                          >
                            {val ? 'נכון' : 'לא נכון'}
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  {/* Open / Completion */}
                  {(quizData.questions[currentQuestionIndex].type === 'open' || quizData.questions[currentQuestionIndex].type === 'completion') && (
                    <div className="space-y-4">
                      <Textarea 
                        placeholder="הקלד את תשובתך כאן..."
                        className="min-h-[100px]"
                        value={userAnswers[quizData.questions[currentQuestionIndex].id] || ''}
                        onChange={(e) => setUserAnswers(prev => ({ ...prev, [quizData.questions[currentQuestionIndex].id]: e.target.value }))}
                        disabled={step === 'quiz' && openAnswerFeedback[quizData.questions[currentQuestionIndex].id]}
                      />
                      {step === 'quiz' && !openAnswerFeedback[quizData.questions[currentQuestionIndex].id] && (
                        <Button 
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={() => handleEvaluateOpenAnswer(quizData.questions[currentQuestionIndex].id)}
                          disabled={!userAnswers[quizData.questions[currentQuestionIndex].id] || isEvaluating}
                        >
                          {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin ms-2" /> : <CheckCircle2 className="w-4 h-4 ms-2" />}
                          בדוק תשובה
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
                
                {showExplanation && step === 'quiz' && (
                  <CardFooter className="flex-col items-start bg-gray-50 rounded-b-lg p-6 space-y-4">
                    {openAnswerFeedback[quizData.questions[currentQuestionIndex].id] && (
                      <div className="w-full space-y-3 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg">ציון: {openAnswerFeedback[quizData.questions[currentQuestionIndex].id].score}</span>
                          <Progress value={openAnswerFeedback[quizData.questions[currentQuestionIndex].id].score} className="w-1/2 h-2" />
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="font-bold text-sm text-gray-500 mb-1">משוב:</p>
                          <p className="text-gray-700">{openAnswerFeedback[quizData.questions[currentQuestionIndex].id].feedback}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                          <p className="font-bold text-sm text-orange-600 mb-1">איך להשתפר:</p>
                          <p className="text-orange-800">{openAnswerFeedback[quizData.questions[currentQuestionIndex].id].improvements}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 w-full">
                      <div className="flex items-center gap-2 text-orange-700 font-bold">
                        <HelpCircle className="w-5 h-5" />
                        הסבר מלא:
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {quizData.questions[currentQuestionIndex].explanation}
                      </p>
                      
                      {quizData.questions[currentQuestionIndex].solutionSteps && quizData.questions[currentQuestionIndex].solutionSteps!.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="font-bold text-sm text-gray-500">דרך הפתרון:</p>
                          <ol className="list-decimal list-inside space-y-1 text-gray-600 text-sm">
                            {quizData.questions[currentQuestionIndex].solutionSteps!.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </CardFooter>
                )}
              </Card>

              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
                    setShowExplanation(false);
                  }}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronRight className="w-4 h-4 ms-2" />
                  הקודם
                </Button>

                {currentQuestionIndex < quizData.questions.length - 1 ? (
                  <Button
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => {
                      setCurrentQuestionIndex(prev => prev + 1);
                      setShowExplanation(false);
                    }}
                    disabled={step === 'quiz' && userAnswers[quizData.questions[currentQuestionIndex].id] === undefined}
                  >
                    הבא
                    <ChevronLeft className="w-4 h-4 me-2" />
                  </Button>
                ) : (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleFinishExam}
                    disabled={step === 'quiz' && userAnswers[quizData.questions[currentQuestionIndex].id] === undefined}
                  >
                    סיים {step === 'exam' ? 'מבחן' : 'תרגול'}
                    <CheckCircle2 className="w-4 h-4 me-2" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 5: History */}
          {step === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-extrabold tracking-tight">היסטוריית מבחנים</h2>
                <p className="text-gray-500">צפה בביצועים הקודמים שלך</p>
              </div>

              {history.length === 0 ? (
                <Card className="p-12 text-center">
                  <CardContent className="space-y-4">
                    <div className="mx-auto bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center">
                      <History className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">עדיין אין מבחנים בהיסטוריה. התחל ללמוד!</p>
                    <Button onClick={() => setStep('subject')} className="bg-orange-500 hover:bg-orange-600">
                      התחל מבחן ראשון
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{item.subject}</span>
                            <span className="text-xs text-gray-400">{item.date}</span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {item.correctCount} מתוך {item.totalQuestions} שאלות נכונות
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-2xl font-black text-orange-600">{item.score}</p>
                            <p className="text-[10px] text-gray-400 uppercase">ציון</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => {
                            setQuizData(item.quizData);
                            setUserAnswers(item.userAnswers);
                            setStep('results');
                          }}>
                            צפה בתוצאות
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                    if (confirm('האם אתה בטוח שברצונך למחוק את כל ההיסטוריה?')) {
                      setHistory([]);
                    }
                  }}>
                    מחק את כל ההיסטוריה
                  </Button>
                </div>
              )}

              <div className="flex justify-center mt-4">
                <Button variant="ghost" onClick={() => setStep('subject')}>
                  <ChevronRight className="w-4 h-4 ms-2" />
                  חזור למסך הבית
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Results */}
          {step === 'results' && quizData && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-8">
                <Button variant="ghost" size="sm" onClick={() => setStep('topics')}>
                  <ChevronRight className="w-4 h-4 ms-1" />
                  חזור להגדרות
                </Button>
                <h2 className="text-3xl font-extrabold tracking-tight flex-1 text-center">תוצאות המבחן</h2>
                <div className="w-24"></div> {/* Spacer */}
              </div>

              <Card className="text-center py-12">
                <CardHeader>
                  <div className="mx-auto bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-orange-600" />
                  </div>
                  <CardTitle className="text-3xl">כל הכבוד!</CardTitle>
                  <CardDescription>סיימת את {isExamActive ? 'המבחן' : 'התרגול'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center gap-12">
                    <div className="text-center">
                      <p className="text-4xl font-black text-orange-600">{score}</p>
                      <p className="text-sm text-gray-500">ציון סופי</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-black text-gray-700">
                        {correctCount} / {quizData.questions.length}
                      </p>
                      <p className="text-sm text-gray-500">תשובות נכונות</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4 text-right">
                    <h4 className="font-bold">סיכום ביצועים:</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {quizData.questions.map((q, i) => {
                        const correct = isCorrect(q);
                        return (
                          <div key={i} className={`p-3 rounded-lg border flex items-center justify-between ${correct ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            <div className="flex items-center gap-3 overflow-hidden">
                              {correct ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> : <X className="w-4 h-4 text-red-600 shrink-0" />}
                              <p className="text-sm truncate">{q.question}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => {
                              setStep('quiz');
                              setCurrentQuestionIndex(i);
                              setShowExplanation(true);
                            }}>
                              צפה
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-3">
                  <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={() => setStep('input')}>
                    <RotateCcw className="w-4 h-4 ms-2" />
                    תרגול חדש
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={exportToPDF}>
                    <Download className="w-4 h-4 ms-2" />
                    ייצא ל-PDF
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-orange-500" />
                    סיכום התוכן
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {quizData.summary}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400 text-sm space-y-4">
        <div className="flex justify-center gap-6">
          <LegalDialog type="terms" />
          <LegalDialog type="privacy" />
        </div>
        <p>© 2026 זמן למבחן - כלי למידה חכם</p>
      </footer>
    </div>
  );
}
