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
  Scale,
  Star,
  Lock,
  Trophy,
  Sparkles,
  ArrowRight,
  Cloud,
  Trees,
  Palette,
  FlaskConical,
  Rocket,
  Music,
  Globe
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
  generateStudyMaterial,
  type QuizData, 
  type Question, 
  type QuestionType,
  type StudyMaterial
} from '@/src/lib/gemini';
import { jsPDF } from 'jspdf';

type Step = 'landing' | 'subject' | 'grade' | 'input' | 'topics' | 'quiz' | 'exam' | 'results' | 'history' | 'study' | 'study-input';

interface HistoryItem {
  id: string;
  date: string;
  subject: string;
  type: 'quiz' | 'study';
  // Quiz specific fields
  score?: number;
  correctCount?: number;
  totalQuestions?: number;
  quizData?: QuizData;
  userAnswers?: Record<string, any>;
  // Study specific fields
  studyMaterial?: StudyMaterial;
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
const LearningMap = memo(({ studyMaterial, completedSections, onSelectSection, onBack }: any) => {
  const levels = [
    { id: 0, title: 'סקירה כללית', type: 'intro' },
    ...studyMaterial.sections.map((s: any, i: number) => ({ id: i + 1, title: s.title, type: 'lesson' })),
    { id: studyMaterial.sections.length + 1, title: 'סיכום ומאסטרי', type: 'final' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen pb-24 bg-gradient-to-b from-blue-50 via-orange-50 to-green-50 overflow-hidden"
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ x: [0, 20, 0], y: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 left-[10%] text-blue-200"
        >
          <Cloud className="w-20 h-20 fill-current" />
        </motion.div>
        <motion.div 
          animate={{ x: [0, -15, 0], y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-60 right-[15%] text-orange-200"
        >
          <Cloud className="w-16 h-16 fill-current" />
        </motion.div>
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-[40%] left-[5%] text-green-200"
        >
          <Trees className="w-12 h-12" />
        </motion.div>
        <motion.div 
          animate={{ rotate: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute top-[60%] right-[8%] text-purple-200"
        >
          <Palette className="w-14 h-14" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute bottom-[20%] left-[12%] text-red-200"
        >
          <Rocket className="w-16 h-16" />
        </motion.div>
        <motion.div 
          animate={{ scale: [0.9, 1, 0.9] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute bottom-[10%] right-[10%] text-blue-200"
        >
          <Globe className="w-12 h-12" />
        </motion.div>
        <div className="absolute top-[25%] right-[5%] text-yellow-200 opacity-40 text-4xl">✨</div>
        <div className="absolute bottom-[35%] left-[8%] text-pink-200 opacity-40 text-4xl">🎨</div>
        <div className="absolute top-[75%] left-[15%] text-indigo-200 opacity-40 text-4xl">🧪</div>
      </div>

      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 mb-8">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronRight className="w-5 h-5 ms-1" />
            חזור
          </Button>
          <h2 className="text-xl font-black text-gray-900 truncate max-w-[200px]">{studyMaterial.title}</h2>
          <div className="flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full">
            <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="text-orange-700 font-bold text-sm">{completedSections.length}</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto relative px-4">
        {/* The Winding Path */}
        <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-gray-100 -translate-x-1/2 rounded-full" />
        
        <div className="space-y-16 relative">
          {levels.map((level, index) => {
            const isCompleted = completedSections.includes(level.id);
            const isLocked = index > 0 && !completedSections.includes(levels[index - 1].id);
            const isCurrent = index === 0 ? !isCompleted : (completedSections.includes(levels[index - 1].id) && !isCompleted);
            
            // Alternating offsets for winding effect
            const offsetClass = index % 2 === 0 ? 'translate-x-12' : '-translate-x-12';
            
            return (
              <div key={level.id} className="flex flex-col items-center relative">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`relative z-10 ${offsetClass} transition-transform`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <motion.button
                      whileHover={!isLocked ? { scale: 1.1 } : {}}
                      whileTap={!isLocked ? { scale: 0.9 } : {}}
                      onClick={() => !isLocked && onSelectSection(level.id)}
                      className={`
                        w-20 h-20 rounded-full flex items-center justify-center shadow-xl relative
                        ${isCompleted ? 'bg-green-500 shadow-green-200' : 
                          isCurrent ? 'bg-orange-500 shadow-orange-200 ring-4 ring-orange-100 ring-offset-4' : 
                          'bg-gray-200 shadow-gray-100'}
                        ${isLocked ? 'cursor-not-allowed grayscale' : 'cursor-pointer'}
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      ) : isLocked ? (
                        <Lock className="w-8 h-8 text-gray-400" />
                      ) : level.type === 'final' ? (
                        <Trophy className="w-10 h-10 text-white" />
                      ) : (
                        <BookOpen className="w-10 h-10 text-white" />
                      )}

                      {/* Stars for completed levels */}
                      {isCompleted && (
                        <div className="absolute -top-2 -right-2 flex gap-0.5">
                          {[1, 2, 3].map(s => (
                            <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow-sm" />
                          ))}
                        </div>
                      )}

                      {/* Current level indicator */}
                      {isCurrent && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute -top-12 bg-white px-3 py-1 rounded-xl shadow-lg border border-orange-100 text-orange-600 font-bold text-xs whitespace-nowrap"
                        >
                          התחל כאן!
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-orange-100 rotate-45" />
                        </motion.div>
                      )}
                    </motion.button>
                    
                    <span className={`text-sm font-bold text-center max-w-[120px] ${isLocked ? 'text-gray-400' : 'text-gray-700'}`}>
                      {level.title}
                    </span>
                  </div>
                </motion.div>

                {/* Connecting Path Segment (SVG for better winding) */}
                {index < levels.length - 1 && (
                  <div className="absolute top-20 h-16 w-full pointer-events-none overflow-visible">
                    <svg className="w-full h-full" overflow="visible">
                      <motion.path
                        d={`M ${index % 2 === 0 ? 'calc(50% + 48px)' : 'calc(50% - 48px)'} 0 
                           C ${index % 2 === 0 ? 'calc(50% + 48px)' : 'calc(50% - 48px)'} 32,
                             ${(index + 1) % 2 === 0 ? 'calc(50% + 48px)' : 'calc(50% - 48px)'} 32,
                             ${(index + 1) % 2 === 0 ? 'calc(50% + 48px)' : 'calc(50% - 48px)'} 64`}
                        fill="none"
                        stroke={isCompleted ? "#22c55e" : "#f3f4f6"}
                        strokeWidth="8"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});

const StudyContentOverlay = memo(({ section, onComplete, onBack, isLast }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      className="fixed inset-0 z-50 bg-white flex flex-col"
    >
      <div className="p-4 border-b flex items-center justify-between bg-white sticky top-0">
        <Button variant="ghost" onClick={onBack}>
          <ChevronRight className="w-5 h-5 ms-1" />
          חזור למפה
        </Button>
        <h3 className="font-bold text-lg">{section.title}</h3>
        <div className="w-20" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-gray-900">{section.title}</h2>
            <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
              {section.content}
            </p>
          </div>

          {section.keyPoints && section.keyPoints.length > 0 && (
            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 space-y-4">
              <h4 className="font-bold text-orange-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                נקודות מפתח לזכור
              </h4>
              <ul className="space-y-3">
                {section.keyPoints.map((point: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    </div>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {section.examples && section.examples.length > 0 && (
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 space-y-4">
              <h4 className="font-bold text-blue-800 flex items-center gap-2">
                <Brain className="w-5 h-5" />
                דוגמאות מהחיים
              </h4>
              <div className="space-y-3">
                {section.examples.map((ex: string, i: number) => (
                  <div key={i} className="bg-white/50 p-4 rounded-2xl italic text-blue-900">
                    "{ex}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t bg-white">
        <div className="max-w-2xl mx-auto">
          <Button 
            className="w-full h-16 text-xl font-bold bg-green-500 hover:bg-green-600 shadow-lg shadow-green-100 rounded-2xl"
            onClick={onComplete}
          >
            {isLast ? 'סיים למידה!' : 'המשך לשלב הבא'}
            <ArrowRight className="w-6 h-6 me-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

const SubjectSelection = memo(({ onSelect, currentSubject, onBack }: { onSelect: (id: string) => void, currentSubject: string, onBack: () => void }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      key="subject"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-500 hover:text-orange-600">
          <ChevronRight className="w-4 h-4 ms-1" />
          חזור
        </Button>
        <div className="text-center flex-1">
          <h2 className="text-3xl font-extrabold tracking-tight">בחר מקצוע לימודי</h2>
          <p className="text-gray-500">המערכת תתאים את סוג השאלות והרמה לפי המקצוע</p>
        </div>
        <div className="w-20" />
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 gap-4"
      >
        {SUBJECTS.map((s) => (
          <motion.div key={s.id} variants={item}>
            <Card 
              className={`cursor-pointer border-2 transition-all hover:shadow-lg h-full group ${
                currentSubject === s.id 
                  ? 'border-orange-500 bg-orange-50/50 shadow-inner' 
                  : 'border-gray-100 hover:border-orange-200 bg-white/50 backdrop-blur-sm'
              }`}
              onClick={() => onSelect(s.id)}
            >
              <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
                <motion.div 
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm transition-colors ${
                    currentSubject === s.id ? 'bg-orange-500 text-white' : 'bg-gray-50 group-hover:bg-orange-100'
                  }`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {s.icon}
                </motion.div>
                <span className={`font-bold text-lg ${currentSubject === s.id ? 'text-orange-700' : 'text-gray-700'}`}>
                  {s.name}
                </span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
});

const InputStep = memo(({ onTextSubmit, onBack, inputText, setInputText, loading, error }: any) => (
  <motion.div
    key="input"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6"
  >
    <div className="flex items-center justify-between mb-8">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-500 hover:text-orange-600">
        <ChevronRight className="w-4 h-4 ms-1" />
        חזור
      </Button>
      <div className="text-center flex-1">
        <h2 className="text-3xl font-extrabold tracking-tight">צור שאלות תרגול חכמות</h2>
        <p className="text-gray-500">הזן טקסט כדי להתחיל</p>
      </div>
      <div className="w-20" />
    </div>

    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-gray-100 shadow-xl shadow-gray-100/50 bg-white/80 backdrop-blur-md overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600" />
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            הזנת תוכן ללימוד
          </CardTitle>
          <CardDescription className="text-base">הדבק טקסט, מאמר או פשוט הקלד את הנושא שברצונך ללמוד ולתרגל</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Textarea 
              placeholder="לדוגמה: 'מלחמת העולם השנייה', 'חוקי ניוטון', או פשוט הדבק כאן סיכום שלם..." 
              className="min-h-[200px] resize-none text-lg p-6 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all bg-gray-50/30"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="absolute bottom-4 left-4 text-xs text-gray-400 font-mono">
              {inputText.length} תווים
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 py-8 text-xl font-black rounded-2xl shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={onTextSubmit}
              disabled={!inputText.trim() || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 ms-2 animate-spin" />
                  מעבד את המידע...
                </>
              ) : (
                <>
                  <Brain className="w-6 h-6 ms-2" />
                  בוא נתחיל!
                </>
              )}
            </Button>
          </div>
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
        חזור לבחירת מקצוע
      </Button>
    </div>
  </motion.div>
));

export default function App() {
  const [step, setStep] = useState<Step>('landing');
  const [mode, setMode] = useState<'practice' | 'study'>('practice');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Input state
  const [subject, setSubject] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  
  // Study state
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(null);
  const [currentStudySectionIndex, setCurrentStudySectionIndex] = useState(0);
  
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
  const [resultsSource, setResultsSource] = useState<'quiz' | 'history'>('quiz');
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('quiz_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        // Add type: 'quiz' to old items if missing
        const migrated = parsed.map((item: any) => ({
          ...item,
          type: item.type || 'quiz'
        }));
        setHistory(migrated);
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

  const handleGenerateStudy = useCallback(async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await generateStudyMaterial(inputText, {
        subject,
        level
      });
      setStudyMaterial(data);
      setCurrentStudySectionIndex(-1);
      setCompletedSections([]);
      setStep('study');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'שגיאה ביצירת חומר הלימוד. נסה שוב.');
    } finally {
      setLoading(false);
    }
  }, [inputText, subject, level]);

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
        type: 'quiz',
        score,
        correctCount,
        totalQuestions: quizData.questions.length,
        quizData,
        userAnswers
      };
      setHistory(prev => [newHistoryItem, ...prev]);
    }
    
    setResultsSource('quiz');
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
          <motion.div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setStep('landing')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div 
              className="bg-orange-500 p-2 rounded-lg"
              animate={{ rotate: [0, 10, 0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Brain className="w-6 h-6 text-white" />
            </motion.div>
            <h1 className="text-xl font-bold tracking-tight text-blue-700">זמן למבחן</h1>
          </motion.div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStep('landing')} 
              className="text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all rounded-full px-4"
            >
              <Home className="w-4 h-4 ms-2" />
              <span className="hidden sm:inline">מסך הבית</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStep('history')} 
              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-full px-4"
            >
              <History className="w-4 h-4 ms-2" />
              <span className="hidden sm:inline">היסטוריה</span>
            </Button>
            {step !== 'landing' && step !== 'subject' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStep('landing')} 
                className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all rounded-full px-4"
              >
                <RotateCcw className="w-4 h-4 ms-2" />
                <span className="hidden sm:inline">התחל מחדש</span>
              </Button>
            )}
            <Button variant="outline" size="icon" className="rounded-full border-gray-200 hover:border-orange-200 hover:bg-orange-50 transition-all">
              <Settings className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {/* Landing Page */}
          {step === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 py-12"
            >
              <div className="text-center space-y-6 relative">
                <h2 className="text-5xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900">
                  מה תרצה לעשות היום?
                </h2>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                  בחר את הדרך שלך להצליח - למידה מעמיקה של חומר חדש או תרגול ממוקד למבחן. אנחנו כאן כדי להפוך את הלמידה לחוויה מהנה.
                </p>
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl -z-10" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <motion.div
                  whileHover={{ scale: 1.02, y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-full"
                >
                  <Card 
                    className="group cursor-pointer border-2 border-orange-100 hover:border-orange-500 transition-all hover:shadow-2xl hover:shadow-orange-200/50 overflow-hidden relative flex flex-col h-full bg-white/70 backdrop-blur-sm"
                    onClick={() => {
                      setMode('study');
                      setStep('subject');
                    }}
                  >
                    <div className="absolute top-4 left-4 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 animate-pulse">חדש</div>
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-100/50 rounded-full transition-all group-hover:scale-125 group-hover:bg-orange-200/50 blur-2xl" />
                    
                    <CardHeader className="relative pt-12 pb-6 text-center flex-1">
                      <motion.div 
                        className="mx-auto bg-gradient-to-br from-orange-400 to-orange-600 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-orange-200 group-hover:rotate-12 transition-transform"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <BookOpen className="w-10 h-10 text-white" />
                      </motion.div>
                      <CardTitle className="text-3xl font-black text-gray-900">ללמוד חומר חדש</CardTitle>
                      <CardDescription className="text-lg mt-3 text-gray-600 font-medium">הסברים מפורטים, דוגמאות וסיכומים חכמים</CardDescription>
                      
                      <div className="mt-8 space-y-3 text-right inline-block mx-auto">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-orange-500" />
                          <span>סיכומים מותאמים אישית</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-orange-500" />
                          <span>דוגמאות והסברים פשוטים</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-orange-500" />
                          <span>חלוקה לנושאים בצורה חכמה</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardFooter className="relative justify-center pb-12 mt-auto">
                      <Button className="bg-orange-500 hover:bg-orange-600 px-10 py-7 text-xl font-bold rounded-2xl w-56 shadow-xl shadow-orange-200 transition-all group-hover:scale-105">
                        בוא נלמד
                        <ChevronLeft className="w-5 h-5 me-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-full"
                >
                  <Card 
                    className="group cursor-pointer border-2 border-blue-100 hover:border-blue-500 transition-all hover:shadow-2xl hover:shadow-blue-200/50 overflow-hidden relative flex flex-col h-full bg-white/70 backdrop-blur-sm"
                    onClick={() => {
                      setMode('practice');
                      setStep('subject');
                    }}
                  >
                    <div className="absolute top-4 left-4 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">פופולרי</div>
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-100/50 rounded-full transition-all group-hover:scale-125 group-hover:bg-blue-200/50 blur-2xl" />
                    
                    <CardHeader className="relative pt-12 pb-6 text-center flex-1">
                      <motion.div 
                        className="mx-auto bg-gradient-to-br from-blue-400 to-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 group-hover:-rotate-12 transition-transform"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      >
                        <Brain className="w-10 h-10 text-white" />
                      </motion.div>
                      <CardTitle className="text-3xl font-black text-gray-900">לתרגל למבחן</CardTitle>
                      <CardDescription className="text-lg mt-3 text-gray-600 font-medium">שאלונים מותאמים אישית ומשוב מיידי</CardDescription>
                      
                      <div className="mt-8 space-y-3 text-right inline-block mx-auto">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          <span>מבחני סימולציה מלאים</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          <span>שאלות ברמות קושי שונות</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          <span>משוב והסברים לכל תשובה</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardFooter className="relative justify-center pb-12 mt-auto">
                      <Button className="bg-blue-600 hover:bg-blue-700 px-10 py-7 text-xl font-bold rounded-2xl w-56 shadow-xl shadow-blue-200 transition-all group-hover:scale-105">
                        בוא נתרגל
                        <ChevronLeft className="w-5 h-5 me-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          )}
          {/* Step 0: Subject Selection */}
          {step === 'subject' && (
            <SubjectSelection 
              currentSubject={subject} 
              onSelect={(id) => {
                setSubject(id);
                setInputText('');
                setExtractedText('');
                setTopics([]);
                setQuizData(null);
                setStudyMaterial(null);
                setCompletedSections([]);
                setStep('grade');
              }} 
              onBack={() => setStep('landing')}
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
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" onClick={() => setStep('subject')} className="text-gray-500 hover:text-blue-600">
          <ChevronRight className="w-4 h-4 ms-1" />
          חזור
        </Button>
        <div className="text-center flex-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-blue-600">באיזו כיתה אתה? 🎓</h2>
          <p className="text-gray-500 text-lg">נתאים את השאלות בדיוק לרמה שלך!</p>
        </div>
        <div className="w-20" />
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
              onTextSubmit={mode === 'study' ? handleGenerateStudy : handleTextSubmit}
              onBack={() => setStep('grade')}
              inputText={inputText}
              setInputText={setInputText}
              loading={loading}
              error={error}
            />
          )}

          {/* Step 6: Study Material (Gamified Learning Map) */}
          {step === 'study' && studyMaterial && (
            <div className="min-h-screen bg-gray-50/30 -mx-4 sm:-mx-6 lg:-mx-8">
              <LearningMap 
                studyMaterial={studyMaterial}
                completedSections={completedSections}
                onSelectSection={(id: number) => setCurrentStudySectionIndex(id)}
                onBack={() => setStep('input')}
              />

              <AnimatePresence>
                {currentStudySectionIndex !== -1 && (
                  <StudyContentOverlay 
                    section={
                      currentStudySectionIndex === 0 
                        ? { title: 'סקירה כללית', content: studyMaterial.overview, keyPoints: [], examples: [] }
                        : currentStudySectionIndex <= studyMaterial.sections.length
                          ? studyMaterial.sections[currentStudySectionIndex - 1]
                          : { title: 'סיכום ומאסטרי', content: studyMaterial.summary, keyPoints: [], examples: [] }
                    }
                    isLast={currentStudySectionIndex > studyMaterial.sections.length}
                    onBack={() => setCurrentStudySectionIndex(-1)}
                    onComplete={() => {
                      if (!completedSections.includes(currentStudySectionIndex)) {
                        setCompletedSections(prev => [...prev, currentStudySectionIndex]);
                      }
                      
                      if (currentStudySectionIndex > studyMaterial.sections.length) {
                        // Final level completed
                        const newHistoryItem: HistoryItem = {
                          id: Math.random().toString(36).substr(2, 9),
                          date: new Date().toLocaleString('he-IL'),
                          subject: SUBJECTS.find(s => s.id === subject)?.name || subject,
                          type: 'study',
                          studyMaterial
                        };
                        setHistory(prev => [newHistoryItem, ...prev]);
                        setStep('landing');
                        setCurrentStudySectionIndex(-1);
                      } else {
                        setCurrentStudySectionIndex(-1);
                      }
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
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
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="sm" onClick={() => setStep('input')} className="text-gray-500 hover:text-orange-600">
                  <ChevronRight className="w-4 h-4 ms-1" />
                  חזור
                </Button>
                <h2 className="text-2xl font-bold flex-1 text-center">הגדרות שאלון</h2>
                <div className="w-20" />
              </div>
              <Card>
                <CardHeader>
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
                      {studyMaterial && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-auto p-0 text-orange-600 font-bold"
                          onClick={() => setStep('study')}
                        >
                          <BookOpen className="w-3.5 h-3.5 ms-1" />
                          חזור ללימוד
                        </Button>
                      )}
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
                    <motion.div 
                      className="space-y-3"
                      variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.05
                          }
                        }
                      }}
                      initial="hidden"
                      animate="show"
                      key={`options-${currentQuestionIndex}`}
                    >
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
                          <motion.div
                            key={i}
                            variants={{
                              hidden: { opacity: 0, x: -20 },
                              show: { opacity: 1, x: 0 }
                            }}
                            whileHover={{ scale: 1.01, x: 5 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <Button
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
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* True/False */}
                  {quizData.questions[currentQuestionIndex].type === 'true-false' && (
                    <motion.div 
                      className="flex gap-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={`tf-${currentQuestionIndex}`}
                    >
                      {[true, false].map((val) => {
                        const isSelected = userAnswers[quizData.questions[currentQuestionIndex].id] === val;
                        const isCorrect = (quizData.questions[currentQuestionIndex].correctAnswer === 'true' || quizData.questions[currentQuestionIndex].correctAnswer === true) === val;
                        const showResult = step === 'quiz' && userAnswers[quizData.questions[currentQuestionIndex].id] !== undefined;

                        return (
                          <motion.div key={val.toString()} className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              variant={isSelected ? "default" : "outline"}
                              className={`w-full py-8 text-xl ${showResult && isCorrect ? 'border-green-500 bg-green-50' : showResult && isSelected ? 'border-red-500 bg-red-50' : isSelected ? 'bg-orange-50 border-orange-500 text-orange-900' : ''}`}
                              onClick={() => handleAnswer(quizData.questions[currentQuestionIndex].id, val)}
                              disabled={showResult}
                            >
                              {val ? 'נכון' : 'לא נכון'}
                            </Button>
                          </motion.div>
                        );
                      })}
                    </motion.div>
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
              <div className="flex items-center justify-between mb-8">
                <Button variant="ghost" size="sm" onClick={() => setStep('landing')} className="text-gray-500 hover:text-orange-600">
                  <ChevronRight className="w-4 h-4 ms-1" />
                  חזור
                </Button>
                <div className="text-center flex-1">
                  <h2 className="text-3xl font-extrabold tracking-tight">היסטוריית מבחנים</h2>
                  <p className="text-gray-500">צפה בביצועים הקודמים שלך</p>
                </div>
                <div className="w-20" />
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
                <motion.div 
                  className="space-y-4"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  initial="hidden"
                  animate="show"
                >
                  {history.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 }
                      }}
                      whileHover={{ scale: 1.02, x: -5 }}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-6 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">{item.subject}</span>
                              <span className="text-xs text-gray-400">{item.date}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.type === 'study' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                {item.type === 'study' ? 'לימוד' : 'מבחן'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {item.type === 'study' ? (
                                `לימוד נושא: ${item.studyMaterial?.title}`
                              ) : (
                                `${item.correctCount} מתוך ${item.totalQuestions} שאלות נכונות`
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-6">
                            {item.type === 'quiz' && (
                              <div className="text-center">
                                <p className="text-2xl font-black text-orange-600">{item.score}</p>
                                <p className="text-[10px] text-gray-400 uppercase">ציון</p>
                              </div>
                            )}
                            <Button variant="outline" size="sm" onClick={() => {
                              if (item.type === 'study') {
                                setStudyMaterial(item.studyMaterial!);
                                setCurrentStudySectionIndex(-1);
                                setStep('study');
                              } else {
                                setQuizData(item.quizData!);
                                setUserAnswers(item.userAnswers!);
                                setResultsSource('history');
                                setStep('results');
                              }
                            }}>
                              {item.type === 'study' ? 'צפה בחומר' : 'צפה בתוצאות'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                    if (confirm('האם אתה בטוח שברצונך למחוק את כל ההיסטוריה?')) {
                      setHistory([]);
                    }
                  }}>
                    מחק את כל ההיסטוריה
                  </Button>
                </motion.div>
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
                <Button variant="ghost" size="sm" onClick={() => setStep(resultsSource === 'history' ? 'history' : 'topics')}>
                  <ChevronRight className="w-4 h-4 ms-1" />
                  {resultsSource === 'history' ? 'חזור להיסטוריה' : 'חזור להגדרות'}
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
                    <motion.div 
                      className="text-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                    >
                      <p className="text-5xl font-black text-orange-600">{score}</p>
                      <p className="text-sm text-gray-500">ציון סופי</p>
                    </motion.div>
                    <motion.div 
                      className="text-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.4 }}
                    >
                      <p className="text-5xl font-black text-gray-700">
                        {correctCount} / {quizData.questions.length}
                      </p>
                      <p className="text-sm text-gray-500">תשובות נכונות</p>
                    </motion.div>
                  </div>

                  <Separator />

                  <div className="space-y-4 text-right">
                    <h4 className="font-bold">סיכום ביצועים:</h4>
                    <motion.div 
                      className="grid grid-cols-1 gap-3"
                      variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.05
                          }
                        }
                      }}
                      initial="hidden"
                      animate="show"
                    >
                      {quizData.questions.map((q, i) => {
                        const correct = isCorrect(q);
                        return (
                          <motion.div 
                            key={i} 
                            variants={{
                              hidden: { opacity: 0, y: 10 },
                              show: { opacity: 1, y: 0 }
                            }}
                            className={`p-3 rounded-lg border flex items-center justify-between ${correct ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}
                          >
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
                          </motion.div>
                        );
                      })}
                    </motion.div>
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

              <div className="flex justify-center mt-4">
                <Button variant="ghost" onClick={() => setStep('landing')}>
                  <ChevronRight className="w-4 h-4 ms-2" />
                  חזור למסך הבית
                </Button>
              </div>

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
