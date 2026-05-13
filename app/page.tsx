"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

type SetEntry = {
  reps: number;
  weight: number;
  unit: "kg" | "lbs";
};

type ExerciseEntry = {
  name: string;
  sets: SetEntry[];
};

type WorkoutLog = {
  id: string;
  date: string;
  templateId: string;
  templateName: string;
  exercises: ExerciseEntry[];
  notes: string;
  pointsEarned: number;
};

type WorkoutTemplate = {
  id: string;
  name: string;
  exercises: ExerciseEntry[];
  notes: string;
};

type Points = {
  total: number;
  lifetime: number;
};

type Coupon = {
  id: string;
  title: string;
  description: string;
  cost: number;
  emoji: string;
  category: "fun" | "food" | "relax" | "adventure";
  redeemed: boolean;
  redeemedAt: string | null;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

type WaterLog = {
  id: string;
  date: string;
  amountMl: number;
};

type ActivityKind = "reading" | "study" | "walk" | "gym" | "stretch";

type ActivityLog = {
  id: string;
  date: string;
  kind: ActivityKind;
  label: string;
  pointsEarned: number;
};

type TabKey = "home" | "workouts" | "store" | "achievements" | "profile";

type BonusState = {
  streakBonusClaimed: boolean;
};

type StoredState = {
  name: string;
  workoutTemplates: WorkoutTemplate[];
  workoutLogs: WorkoutLog[];
  activityLogs: ActivityLog[];
  points: Points;
  coupons: Coupon[];
  achievements: Achievement[];
  bonusState: BonusState;
  waterLogs: WaterLog[];
  lastLogin: string | null;
};

declare global {
  interface Window {
    confetti?: (options?: Record<string, unknown>) => void;
  }
}

const STORAGE_KEYS = {
  name: "gogo:name",
  templates: "gogo:templates",
  logs: "gogo:logs",
  activity: "gogo:activity",
  points: "gogo:points",
  coupons: "gogo:coupons",
  achievements: "gogo:achievements",
  bonus: "gogo:bonus",
  water: "gogo:water",
  lastLogin: "gogo:last-login"
};

const defaultCoupons: Coupon[] = [
  {
    id: "coupon-1",
    title: "Movie night of your choice",
    description: "Pick the film, I bring the snacks.",
    cost: 200,
    emoji: "\ud83c\udfac",
    category: "fun",
    redeemed: false,
    redeemedAt: null
  },
  {
    id: "coupon-2",
    title: "Breakfast in bed",
    description: "Lazy morning with pancakes and kisses.",
    cost: 150,
    emoji: "\ud83c\udf73",
    category: "food",
    redeemed: false,
    redeemedAt: null
  },
  {
    id: "coupon-3",
    title: "30-min massage",
    description: "Soft music, warm hands, full relaxation.",
    cost: 300,
    emoji: "\ud83d\udc86",
    category: "relax",
    redeemed: false,
    redeemedAt: null
  },
  {
    id: "coupon-4",
    title: "Pizza & Netflix night",
    description: "Comfort food, cozy blanket, your pick.",
    cost: 100,
    emoji: "\ud83c\udf55",
    category: "food",
    redeemed: false,
    redeemedAt: null
  },
  {
    id: "coupon-5",
    title: "Shopping trip (budget: 50\u20ac)",
    description: "We go on a sweet little treasure hunt.",
    cost: 500,
    emoji: "\ud83d\uded2",
    category: "adventure",
    redeemed: false,
    redeemedAt: null
  },
  {
    id: "coupon-6",
    title: "Weekend trip surprise",
    description: "Pack a bag and trust me.",
    cost: 1000,
    emoji: "\ud83c\udf05",
    category: "adventure",
    redeemed: false,
    redeemedAt: null
  },
  {
    id: "coupon-7",
    title: "Ice cream date",
    description: "Two spoons, one sundae.",
    cost: 75,
    emoji: "\ud83c\udf66",
    category: "fun",
    redeemed: false,
    redeemedAt: null
  },
  {
    id: "coupon-8",
    title: "Love letter handwritten by me",
    description: "A small envelope full of all the feels.",
    cost: 50,
    emoji: "\ud83d\udc8c",
    category: "relax",
    redeemed: false,
    redeemedAt: null
  }
];

const defaultAchievements: Achievement[] = [
  {
    id: "ach-1",
    title: "First Workout",
    description: "Log your first session.",
    emoji: "\ud83d\udd25",
    unlocked: false,
    unlockedAt: null
  },
  {
    id: "ach-2",
    title: "Week Warrior",
    description: "Reach a 7-day streak.",
    emoji: "\ud83d\udcc5",
    unlocked: false,
    unlockedAt: null
  },
  {
    id: "ach-3",
    title: "Century",
    description: "Earn 100 points total.",
    emoji: "\ud83d\udcaf",
    unlocked: false,
    unlockedAt: null
  },
  {
    id: "ach-4",
    title: "Iron Maiden",
    description: "Log 10 workouts.",
    emoji: "\ud83c\udfcb\ufe0f",
    unlocked: false,
    unlockedAt: null
  },
  {
    id: "ach-5",
    title: "Treat Yourself",
    description: "Redeem your first coupon.",
    emoji: "\ud83c\udf81",
    unlocked: false,
    unlockedAt: null
  },
  {
    id: "ach-6",
    title: "Point Hoarder",
    description: "Hold 500 points at once.",
    emoji: "\u26a1",
    unlocked: false,
    unlockedAt: null
  },
  {
    id: "ach-7",
    title: "Consistency Queen",
    description: "Reach a 30-day streak.",
    emoji: "\ud83c\udf1f",
    unlocked: false,
    unlockedAt: null
  },
  {
    id: "ach-8",
    title: "Leg Day Survivor",
    description: "Log a leg workout.",
    emoji: "\ud83e\uddb5",
    unlocked: false,
    unlockedAt: null
  },
  {
    id: "ach-9",
    title: "Upper Body Goddess",
    description: "Log 5 upper body workouts.",
    emoji: "\ud83d\udcaa",
    unlocked: false,
    unlockedAt: null
  },
  {
    id: "ach-10",
    title: "All In",
    description: "Unlock 5 achievements.",
    emoji: "\ud83d\udc51",
    unlocked: false,
    unlockedAt: null
  },
  {
    id: "ach-11",
    title: "Hydration Babe",
    description: "Log water 5 times.",
    emoji: "\ud83d\udca7",
    unlocked: false,
    unlockedAt: null
  },
  {
    id: "ach-12",
    title: "Water Queen",
    description: "Log water 20 times.",
    emoji: "\ud83e\udd4c",
    unlocked: false,
    unlockedAt: null
  }
];

const emptyTemplateDraft: WorkoutTemplate = {
  id: "",
  name: "",
  exercises: [
    {
      name: "",
      sets: [{ reps: 10, weight: 20, unit: "kg" }]
    }
  ],
  notes: ""
};

const tabConfig: { key: TabKey; label: string; emoji: string }[] = [
  { key: "home", label: "Home", emoji: "\ud83c\udfe0" },
  { key: "workouts", label: "Workouts", emoji: "\ud83d\udcaa" },
  { key: "store", label: "Store", emoji: "\ud83c\udf81" },
  { key: "achievements", label: "Achievements", emoji: "\ud83c\udfc6" },
  { key: "profile", label: "Profile", emoji: "\u2699\ufe0f" }
];

const activityOptions: Array<{
  kind: ActivityKind;
  label: string;
  description: string;
  points: number;
  emoji: string;
}> = [
  {
    kind: "reading",
    label: "Read 30 minutes",
    description: "Cozy focus time",
    points: 20,
    emoji: "\ud83d\udcd6"
  },
  {
    kind: "study",
    label: "Study 1 hour",
    description: "Deep work glow",
    points: 35,
    emoji: "\ud83e\udd13"
  },
  {
    kind: "walk",
    label: "Walk outside",
    description: "Fresh air reset",
    points: 25,
    emoji: "\ud83c\udf3f"
  },
  {
    kind: "stretch",
    label: "Stretch session",
    description: "Mobility recharge",
    points: 15,
    emoji: "\ud83e\udd38"
  }
];

const activityEmoji: Record<ActivityKind, string> = {
  reading: "\ud83d\udcd6",
  study: "\ud83e\udd13",
  walk: "\ud83c\udf3f",
  gym: "\ud83c\udfcb\ufe0f",
  stretch: "\ud83e\udd38"
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  });

const isSameDay = (a: string, b: string) => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const calculateStreak = (logs: WorkoutLog[]) => {
  const dates = Array.from(
    new Set(
      logs
        .map((w) => new Date(w.date))
        .sort((a, b) => b.getTime() - a.getTime())
        .map((d) => d.toDateString())
    )
  ).map((d) => new Date(d));

  if (dates.length === 0) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < dates.length; i += 1) {
    const prev = dates[i - 1];
    const current = dates[i];
    const diff = (prev.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

const getWeekWorkouts = (logs: WorkoutLog[]) => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  return logs.filter((workout) => new Date(workout.date) >= weekAgo).length;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [name, setName] = useState("Gogosica");
  const [showNameModal, setShowNameModal] = useState(false);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>(
    []
  );
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [points, setPoints] = useState<Points>({ total: 0, lifetime: 0 });
  const [coupons, setCoupons] = useState<Coupon[]>(defaultCoupons);
  const [achievements, setAchievements] = useState<Achievement[]>(
    defaultAchievements
  );
  const [bonusState, setBonusState] = useState<BonusState>({
    streakBonusClaimed: false
  });
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<WorkoutTemplate>(
    emptyTemplateDraft
  );
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logTarget, setLogTarget] = useState<WorkoutTemplate | null>(null);
  const [logNotes, setLogNotes] = useState("");
  const [logDate, setLogDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [pointsToast, setPointsToast] = useState<number | null>(null);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(
    null
  );
  const [couponFilter, setCouponFilter] = useState<"available" | "redeemed">(
    "available"
  );
  const [redeemTarget, setRedeemTarget] = useState<Coupon | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authSent, setAuthSent] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  const [animatedPoints, setAnimatedPoints] = useState(points.total);
  const pointsAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const animatedPointsRef = useRef(points.total);
  const achievementsRef = useRef(achievements);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fireConfetti = useCallback(() => {
    if (window.confetti) {
      window.confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.75 }
      });
    }
  }, []);

  const handleAchievementCheck = useCallback((
    nextLogs: WorkoutLog[],
    nextPoints: Points,
    nextCoupons: Coupon[],
    nextWater: WaterLog[],
    baseList?: Achievement[]
  ) => {
    const streakValue = calculateStreak(nextLogs);
    const upperWorkouts = nextLogs.filter((workout) =>
      workout.templateName.toLowerCase().includes("upper")
    );
    const legWorkouts = nextLogs.filter((workout) =>
      workout.templateName.toLowerCase().includes("leg")
    );
    const achievementsSource = baseList ?? achievementsRef.current;

    const baseAchievements = achievementsSource.map((achievement) => {
      if (achievement.unlocked) {
        return achievement;
      }

      let unlocked = false;

      switch (achievement.id) {
        case "ach-1":
          unlocked = nextLogs.length >= 1;
          break;
        case "ach-2":
          unlocked = streakValue >= 7;
          break;
        case "ach-3":
          unlocked = nextPoints.lifetime >= 100;
          break;
        case "ach-4":
          unlocked = nextLogs.length >= 10;
          break;
        case "ach-5":
          unlocked = nextCoupons.some((coupon) => coupon.redeemed);
          break;
        case "ach-6":
          unlocked = nextPoints.total >= 500;
          break;
        case "ach-7":
          unlocked = streakValue >= 30;
          break;
        case "ach-8":
          unlocked = legWorkouts.length >= 1;
          break;
        case "ach-9":
          unlocked = upperWorkouts.length >= 5;
          break;
        case "ach-10":
          unlocked = false;
          break;
        case "ach-11":
          unlocked = nextWater.length >= 5;
          break;
        case "ach-12":
          unlocked = nextWater.length >= 20;
          break;
        default:
          unlocked = false;
      }

      if (unlocked) {
        return {
          ...achievement,
          unlocked: true,
          unlockedAt: new Date().toISOString()
        };
      }

      return achievement;
    });

    const unlockedCount = baseAchievements.filter(
      (achievement) => achievement.unlocked
    ).length;

    const finalAchievements = baseAchievements.map((achievement) => {
      if (achievement.id !== "ach-10" || achievement.unlocked) {
        return achievement;
      }

      if (unlockedCount >= 5) {
        return {
          ...achievement,
          unlocked: true,
          unlockedAt: new Date().toISOString()
        };
      }

      return achievement;
    });

    const newlyUnlocked = finalAchievements.find(
      (achievement, index) =>
        achievement.unlocked && !achievementsSource[index].unlocked
    );

    if (newlyUnlocked) {
      setAchievementToast(newlyUnlocked);
      setTimeout(() => setAchievementToast(null), 2500);
      fireConfetti();
    }

    setAchievements(finalAchievements);
  }, [fireConfetti]);

  useEffect(() => {
    achievementsRef.current = achievements;
  }, [achievements]);

  const buildStatePayload = useCallback((): StoredState => ({
    name,
    workoutTemplates,
    workoutLogs,
    activityLogs,
    points,
    coupons,
    achievements,
    bonusState,
    waterLogs,
    lastLogin
  }), [
    name,
    workoutTemplates,
    workoutLogs,
    activityLogs,
    points,
    coupons,
    achievements,
    bonusState,
    waterLogs,
    lastLogin
  ]);

  const getLocalSeed = useCallback((): StoredState => {
    const storedName = localStorage.getItem(STORAGE_KEYS.name);
    const storedTemplates = localStorage.getItem(STORAGE_KEYS.templates);
    const storedLogs = localStorage.getItem(STORAGE_KEYS.logs);
    const storedLegacyWorkouts = localStorage.getItem("gogo:workouts");
    const storedActivity = localStorage.getItem(STORAGE_KEYS.activity);
    const storedPoints = localStorage.getItem(STORAGE_KEYS.points);
    const storedCoupons = localStorage.getItem(STORAGE_KEYS.coupons);
    const storedAchievements = localStorage.getItem(STORAGE_KEYS.achievements);
    const storedBonus = localStorage.getItem(STORAGE_KEYS.bonus);
    const storedWater = localStorage.getItem(STORAGE_KEYS.water);
    const storedLastLogin = localStorage.getItem(STORAGE_KEYS.lastLogin);

    let templatesSeed: WorkoutTemplate[] = storedTemplates
      ? JSON.parse(storedTemplates)
      : [];
    let logsSeed: WorkoutLog[] = storedLogs ? JSON.parse(storedLogs) : [];

    if (!storedTemplates && !storedLogs && storedLegacyWorkouts) {
      const legacyWorkouts = JSON.parse(storedLegacyWorkouts) as Array<
        WorkoutLog & { name?: string; templateName?: string }
      >;
      templatesSeed = legacyWorkouts.map((workout) => ({
        id: `template-${workout.id}`,
        name: workout.templateName || workout.name || "Workout",
        exercises: workout.exercises,
        notes: workout.notes
      }));
      logsSeed = legacyWorkouts.map((workout) => ({
        ...workout,
        templateId: `template-${workout.id}`,
        templateName: workout.templateName || workout.name || "Workout"
      }));
    }

    return {
      name: storedName || "Gogosica",
      workoutTemplates: templatesSeed,
      workoutLogs: logsSeed,
      activityLogs: storedActivity ? JSON.parse(storedActivity) : [],
      points: storedPoints ? JSON.parse(storedPoints) : { total: 0, lifetime: 0 },
      coupons: storedCoupons ? JSON.parse(storedCoupons) : defaultCoupons,
      achievements: storedAchievements
        ? JSON.parse(storedAchievements)
        : defaultAchievements,
      bonusState: storedBonus
        ? JSON.parse(storedBonus)
        : { streakBonusClaimed: false },
      waterLogs: storedWater ? JSON.parse(storedWater) : [],
      lastLogin: storedLastLogin
    };
  }, []);

  const applyStoredState = useCallback((payload: StoredState) => {
    const todayKey = new Date().toDateString();
    const loginBonus = payload.lastLogin === todayKey ? 0 : 5;
    const nextPoints = {
      total: payload.points.total + loginBonus,
      lifetime: payload.points.lifetime + loginBonus
    };

    setName(payload.name || "Gogosica");
    setShowNameModal(!payload.name);
    setWorkoutTemplates(payload.workoutTemplates);
    setWorkoutLogs(payload.workoutLogs);
    setActivityLogs(payload.activityLogs);
    setPoints(nextPoints);
    setCoupons(payload.coupons);
    setAchievements(payload.achievements);
    setBonusState(payload.bonusState);
    setWaterLogs(payload.waterLogs);
    setLastLogin(todayKey);

    if (loginBonus > 0) {
      setPointsToast(loginBonus);
      setTimeout(() => setPointsToast(null), 1400);
    }

    handleAchievementCheck(
      payload.workoutLogs,
      nextPoints,
      payload.coupons,
      payload.waterLogs,
      payload.achievements
    );

    setHydrated(true);
  }, [handleAchievementCheck]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }
      setSession(data.session ?? null);
      setAuthChecked(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthChecked(true);
      setRemoteLoaded(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authChecked || remoteLoaded) {
      return;
    }

    if (!session) {
      const localSeed = getLocalSeed();
      applyStoredState(localSeed);
      setRemoteLoaded(true);
      return;
    }

    const loadRemote = async () => {
      setSyncing(true);
      const { data, error } = await supabase
        .from("user_state")
        .select("data")
        .eq("user_id", session.user.id)
        .single();

      if (!error && data?.data) {
        applyStoredState(data.data as StoredState);
      } else {
        const localSeed = getLocalSeed();
        applyStoredState(localSeed);
      }

      setRemoteLoaded(true);
      setSyncing(false);
    };

    loadRemote().catch(() => {
      const localSeed = getLocalSeed();
      applyStoredState(localSeed);
      setRemoteLoaded(true);
      setSyncing(false);
    });
  }, [authChecked, session, remoteLoaded, applyStoredState, getLocalSeed]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      }
      if (navigator.serviceWorker.controller) {
        const reloaded = sessionStorage.getItem("gogo:sw-reloaded");
        if (!reloaded) {
          sessionStorage.setItem("gogo:sw-reloaded", "1");
          window.location.reload();
        }
      }
    }

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      let hasRefreshed = false;
      const onControllerChange = () => {
        if (hasRefreshed) {
          return;
        }
        hasRefreshed = true;
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener(
        "controllerchange",
        onControllerChange
      );

      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          registration.update();

          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }

          registration.addEventListener("updatefound", () => {
            const installing = registration.installing;
            if (!installing) {
              return;
            }

            installing.addEventListener("statechange", () => {
              if (
                installing.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                registration.waiting?.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });
        })
        .catch(() => undefined);

      return () => {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          onControllerChange
        );
      };
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(STORAGE_KEYS.name, name);
    localStorage.setItem(
      STORAGE_KEYS.templates,
      JSON.stringify(workoutTemplates)
    );
    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(workoutLogs));
    localStorage.setItem(
      STORAGE_KEYS.activity,
      JSON.stringify(activityLogs)
    );
    localStorage.setItem(STORAGE_KEYS.points, JSON.stringify(points));
    localStorage.setItem(STORAGE_KEYS.coupons, JSON.stringify(coupons));
    localStorage.setItem(
      STORAGE_KEYS.achievements,
      JSON.stringify(achievements)
    );
    localStorage.setItem(STORAGE_KEYS.bonus, JSON.stringify(bonusState));
    localStorage.setItem(STORAGE_KEYS.water, JSON.stringify(waterLogs));
    if (lastLogin) {
      localStorage.setItem(STORAGE_KEYS.lastLogin, lastLogin);
    } else {
      localStorage.removeItem(STORAGE_KEYS.lastLogin);
    }
  }, [
    name,
    workoutTemplates,
    workoutLogs,
    activityLogs,
    points,
    coupons,
    achievements,
    bonusState,
    waterLogs,
    lastLogin,
    hydrated
  ]);

  useEffect(() => {
    if (pointsAnimationRef.current) {
      clearInterval(pointsAnimationRef.current);
    }

    const start = animatedPointsRef.current;
    const end = points.total;
    const delta = end - start;
    if (delta === 0) {
      animatedPointsRef.current = end;
      setAnimatedPoints(end);
      return;
    }

    let currentStep = 0;
    const totalSteps = 20;
    pointsAnimationRef.current = setInterval(() => {
      currentStep += 1;
      const progress = currentStep / totalSteps;
      const nextValue = Math.round(start + delta * progress);
      animatedPointsRef.current = nextValue;
      setAnimatedPoints(nextValue);
      if (currentStep >= totalSteps && pointsAnimationRef.current) {
        clearInterval(pointsAnimationRef.current);
        pointsAnimationRef.current = null;
      }
    }, 18);

    return () => {
      if (pointsAnimationRef.current) {
        clearInterval(pointsAnimationRef.current);
      }
    };
  }, [points.total]);

  const streak = useMemo(() => calculateStreak(workoutLogs), [workoutLogs]);
  const workoutsThisWeek = useMemo(
    () => getWeekWorkouts(workoutLogs),
    [workoutLogs]
  );
  const pointsThisWeek = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    const workoutPoints = workoutLogs
      .filter((workout) => new Date(workout.date) >= weekAgo)
      .reduce((sum, workout) => sum + workout.pointsEarned, 0);
    const activityPoints = activityLogs
      .filter((log) => new Date(log.date) >= weekAgo)
      .reduce((sum, log) => sum + log.pointsEarned, 0);
    const waterPoints = waterLogs.filter(
      (log) => new Date(log.date) >= weekAgo
    ).length * 5;
    return workoutPoints + activityPoints + waterPoints;
  }, [workoutLogs, activityLogs, waterLogs]);

  const recentActivity = useMemo(() => {
    const combined = [
      ...workoutLogs.map((log) => ({
        id: log.id,
        date: log.date,
        label: log.templateName,
        points: log.pointsEarned,
        emoji: activityEmoji.gym
      })),
      ...activityLogs.map((log) => ({
        id: log.id,
        date: log.date,
        label: log.label,
        points: log.pointsEarned,
        emoji: activityEmoji[log.kind]
      }))
    ];

    return combined
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [workoutLogs, activityLogs]);
  const todayKey = new Date().toDateString();
  const todayWaterMl = waterLogs
    .filter((log) => new Date(log.date).toDateString() === todayKey)
    .reduce((sum, log) => sum + log.amountMl, 0);
  const hasLoggedToday = useMemo(() => {
    const activityToday = activityLogs.some(
      (log) => new Date(log.date).toDateString() === todayKey
    );
    const workoutToday = workoutLogs.some(
      (log) => new Date(log.date).toDateString() === todayKey
    );
    return activityToday || workoutToday;
  }, [activityLogs, workoutLogs, todayKey]);

  const openTemplateModal = (template?: WorkoutTemplate) => {
    if (template) {
      setEditingTemplateId(template.id);
      setTemplateDraft({ ...template });
    } else {
      setEditingTemplateId(null);
      setTemplateDraft({
        ...emptyTemplateDraft,
        id: crypto.randomUUID()
      });
    }
    setTemplateModalOpen(true);
  };

  const closeTemplateModal = () => {
    setTemplateModalOpen(false);
    setTemplateDraft(emptyTemplateDraft);
  };

  const openLogModal = (template: WorkoutTemplate) => {
    setLogTarget(template);
    setLogNotes("");
    setLogDate(new Date().toISOString().slice(0, 10));
    setLogModalOpen(true);
  };

  const closeLogModal = () => {
    setLogModalOpen(false);
    setLogTarget(null);
  };

  const updateExercise = (index: number, update: Partial<ExerciseEntry>) => {
    setTemplateDraft((prev) => {
      const exercises = prev.exercises.map((exercise, idx) =>
        idx === index ? { ...exercise, ...update } : exercise
      );
      return { ...prev, exercises };
    });
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    update: Partial<SetEntry>
  ) => {
    setTemplateDraft((prev) => {
      const exercises = prev.exercises.map((exercise, idx) => {
        if (idx !== exerciseIndex) {
          return exercise;
        }
        const sets = exercise.sets.map((setItem, sIdx) =>
          sIdx === setIndex ? { ...setItem, ...update } : setItem
        );
        return { ...exercise, sets };
      });
      return { ...prev, exercises };
    });
  };

  const addExercise = () => {
    setTemplateDraft((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        { name: "", sets: [{ reps: 8, weight: 12, unit: "kg" }] }
      ]
    }));
  };

  const removeExercise = (index: number) => {
    setTemplateDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, idx) => idx !== index)
    }));
  };

  const addSet = (exerciseIndex: number) => {
    setTemplateDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, idx) =>
        idx === exerciseIndex
          ? {
              ...exercise,
              sets: [...exercise.sets, { reps: 8, weight: 10, unit: "kg" }]
            }
          : exercise
      )
    }));
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setTemplateDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, idx) => {
        if (idx !== exerciseIndex) {
          return exercise;
        }
        return {
          ...exercise,
          sets: exercise.sets.filter((_, sIdx) => sIdx !== setIndex)
        };
      })
    }));
  };

  const saveTemplate = () => {
    const trimmedName = templateDraft.name.trim();
    const hasExercises = templateDraft.exercises.some(
      (exercise) => exercise.name.trim().length > 0
    );

    if (!trimmedName || !hasExercises) {
      return;
    }

    const updatedTemplate = {
      ...templateDraft,
      name: trimmedName
    };

    const finalTemplates = editingTemplateId
      ? workoutTemplates.map((template) =>
          template.id === editingTemplateId ? updatedTemplate : template
        )
      : [updatedTemplate, ...workoutTemplates];

    setWorkoutTemplates(finalTemplates);
    closeTemplateModal();
  };

  const deleteTemplate = (id: string) => {
    const filtered = workoutTemplates.filter((template) => template.id !== id);
    setWorkoutTemplates(filtered);
  };

  const logWorkout = () => {
    if (!logTarget) {
      return;
    }

    const logIso = new Date(logDate).toISOString();
    const basePoints = 50;
    const exerciseBonus = logTarget.exercises.length * 10;
    const isFirstToday = !workoutLogs.some((log) =>
      isSameDay(log.date, logIso)
    );
    const dailyBonus = isFirstToday ? 25 : 0;

    let streakBonus = 0;
    const newLog: WorkoutLog = {
      id: crypto.randomUUID(),
      date: logIso,
      templateId: logTarget.id,
      templateName: logTarget.name,
      exercises: logTarget.exercises,
      notes: logNotes,
      pointsEarned: 0
    };

    const updatedLogs = [newLog, ...workoutLogs];
    const newStreak = calculateStreak(updatedLogs);
    if (newStreak >= 7 && !bonusState.streakBonusClaimed) {
      streakBonus = 100;
    }

    const pointsEarned = basePoints + exerciseBonus + dailyBonus + streakBonus;
    newLog.pointsEarned = pointsEarned;

    setWorkoutLogs(updatedLogs);
    const nextPoints = {
      total: points.total + pointsEarned,
      lifetime: points.lifetime + pointsEarned
    };
    setPoints(nextPoints);

    setPointsToast(pointsEarned);
    setTimeout(() => setPointsToast(null), 1400);

    if (newStreak < 7) {
      setBonusState({ streakBonusClaimed: false });
    } else if (streakBonus > 0) {
      setBonusState({ streakBonusClaimed: true });
    }

    handleAchievementCheck(updatedLogs, nextPoints, coupons, waterLogs);
    closeLogModal();
  };

  const deleteLog = (id: string) => {
    const filtered = workoutLogs.filter((log) => log.id !== id);
    setWorkoutLogs(filtered);
    handleAchievementCheck(filtered, points, coupons, waterLogs);
  };

  const deleteActivityLog = (id: string) => {
    const filtered = activityLogs.filter((log) => log.id !== id);
    setActivityLogs(filtered);
  };

  const logWater = (amountMl: number) => {
    const entry: WaterLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amountMl
    };
    const updatedWater = [entry, ...waterLogs];
    setWaterLogs(updatedWater);
    const bonusPoints = 5;
    const nextPoints = {
      total: points.total + bonusPoints,
      lifetime: points.lifetime + bonusPoints
    };
    setPoints(nextPoints);
    setPointsToast(bonusPoints);
    setTimeout(() => setPointsToast(null), 1200);
    handleAchievementCheck(workoutLogs, nextPoints, coupons, updatedWater);
  };

  const logQuickActivity = (option: (typeof activityOptions)[number]) => {
    const entry: ActivityLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      kind: option.kind,
      label: option.label,
      pointsEarned: option.points
    };
    const updated = [entry, ...activityLogs];
    setActivityLogs(updated);
    const nextPoints = {
      total: points.total + option.points,
      lifetime: points.lifetime + option.points
    };
    setPoints(nextPoints);
    setPointsToast(option.points);
    setTimeout(() => setPointsToast(null), 1200);
    handleAchievementCheck(workoutLogs, nextPoints, coupons, waterLogs);
    setActivityModalOpen(false);
  };

  const confirmRedeem = (coupon: Coupon) => {
    setRedeemTarget(coupon);
  };

  const redeemCoupon = () => {
    if (!redeemTarget) {
      return;
    }

    if (points.total < redeemTarget.cost) {
      setRedeemTarget(null);
      return;
    }

    const updatedCoupons = coupons.map((coupon) =>
      coupon.id === redeemTarget.id
        ? {
            ...coupon,
            redeemed: true,
            redeemedAt: new Date().toISOString()
          }
        : coupon
    );

    setCoupons(updatedCoupons);
    setPoints((prev) => ({ ...prev, total: prev.total - redeemTarget.cost }));
    fireConfetti();

    handleAchievementCheck(
      workoutLogs,
      {
        ...points,
        total: points.total - redeemTarget.cost
      },
      updatedCoupons,
      waterLogs
    );

    setRedeemTarget(null);
  };

  const visibleCoupons = coupons.filter((coupon) =>
    couponFilter === "available" ? !coupon.redeemed : coupon.redeemed
  );

  const resetData = () => {
    const ok = window.confirm("Reset everything? This cannot be undone.");
    if (!ok) {
      return;
    }

    setWorkoutTemplates([]);
    setWorkoutLogs([]);
    setActivityLogs([]);
    setPoints({ total: 0, lifetime: 0 });
    setCoupons(defaultCoupons);
    setAchievements(defaultAchievements);
    setBonusState({ streakBonusClaimed: false });
    setWaterLogs([]);
    setLastLogin(null);
    localStorage.removeItem(STORAGE_KEYS.activity);
    localStorage.removeItem(STORAGE_KEYS.lastLogin);
  };

  return (
    <div className="app-shell">
      <main className="flex-1 px-4 pt-8 pb-24 max-w-[420px] mx-auto w-full">
        <section className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[color:var(--muted)]">Hello,</p>
              <h1 className="text-2xl font-display">{name}</h1>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Balance
              </p>
              <div className="text-3xl font-display text-[color:var(--accent-strong)] points-glow">
                {animatedPoints}
                <span className="text-sm font-body ml-1">pts</span>
              </div>
            </div>
          </div>
        </section>

        <div className="relative">
          {activeTab === "home" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="glass-card rounded-3xl p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[color:var(--muted)]">
                      Current Streak
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-3xl animate-pulseSoft">\ud83d\udd25</span>
                      <div className="text-3xl font-display">
                        {streak} days
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[color:var(--muted)]">
                      This week
                    </p>
                    <p className="text-lg font-semibold">
                      {workoutsThisWeek} workouts
                    </p>
                    <p className="text-sm text-[color:var(--muted)]">
                      +{pointsThisWeek} pts
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card rounded-2xl p-4 shadow-soft">
                  <p className="text-xs text-[color:var(--muted)]">Lifetime</p>
                  <p className="text-2xl font-display">{points.lifetime}</p>
                  <p className="text-xs text-[color:var(--muted)]">Points earned</p>
                </div>
                <div className="glass-card rounded-2xl p-4 shadow-soft">
                  <p className="text-xs text-[color:var(--muted)]">Next reward</p>
                  <p className="text-2xl font-display">
                    {Math.max(0, 500 - points.total)}
                  </p>
                  <p className="text-xs text-[color:var(--muted)]">To 500 pts</p>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-display">Daily rituals</h2>
                    <p className="text-xs text-[color:var(--muted)]">
                      Today: {todayWaterMl} ml
                    </p>
                  </div>
                  <div className="mascot mascot-float">\ud83e\udd8b</div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[250, 500, 750].map((amount) => (
                    <button
                      key={amount}
                      className="rounded-full bg-white/70 py-2 text-xs font-semibold active:scale-[0.96] transition"
                      onClick={() => logWater(amount)}
                    >
                      +{amount} ml
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-display">Recent activity</h2>
                  <button
                    className="text-sm text-[color:var(--accent-strong)]"
                    onClick={() => setActiveTab("workouts")}
                  >
                    View all
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {recentActivity.length === 0 && (
                    <p className="text-sm text-[color:var(--muted)]">
                      Your next activity will show up here.
                    </p>
                  )}
                  {recentActivity.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/70"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{entry.emoji}</span>
                        <div>
                          <p className="font-semibold">{entry.label}</p>
                          <p className="text-xs text-[color:var(--muted)]">
                            {formatDate(entry.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-[color:var(--accent-strong)]">
                        +{entry.points} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-display">Quest board</h2>
                    <p className="text-xs text-[color:var(--muted)]">
                      Daily quest: log any activity
                    </p>
                  </div>
                  <div className="mascot glow-pulse">\u2728</div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {hasLoggedToday ? "Quest cleared" : "Quest pending"}
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">
                      {hasLoggedToday ? "Streak protected" : "Earn points today"}
                    </p>
                  </div>
                  <span className="text-2xl">
                    {hasLoggedToday ? "\ud83c\udf89" : "\ud83c\udfaf"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  <button
                    className="quest-button w-full rounded-full bg-[color:var(--accent-strong)] text-white py-4 font-semibold shadow-soft active:scale-[0.98] transition"
                    onClick={() => setActivityModalOpen(true)}
                  >
                    Choose activity to log
                  </button>
                  <button
                    className="w-full rounded-full border border-[color:var(--accent-strong)] py-3 text-sm font-semibold"
                    onClick={() => setActiveTab("workouts")}
                  >
                    Manage gym routines
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "workouts" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display">Workout Library</h2>
                <button
                  className="rounded-full bg-[color:var(--pill)] px-4 py-2 text-sm font-semibold active:scale-[0.96]"
                  onClick={() => openTemplateModal()}
                >
                  New Routine
                </button>
              </div>

              <div className="space-y-4">
                {workoutTemplates.length === 0 && (
                  <div className="glass-card rounded-2xl p-6 text-sm text-[color:var(--muted)]">
                    Save your favorite routines, then log a gym visit using them.
                  </div>
                )}

                {workoutTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="glass-card rounded-2xl p-4 shadow-soft"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-display">{template.name}</h3>
                        <p className="text-xs text-[color:var(--muted)]">
                          {template.exercises.length} exercises
                        </p>
                      </div>
                      <div className="mascot mascot-wiggle">\ud83d\udc95</div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {template.exercises.map((exercise, idx) => (
                        <div key={`${template.id}-ex-${idx}`}>
                          <p className="font-semibold text-sm">
                            {exercise.name || "Unnamed exercise"}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {exercise.sets.map((setItem, sIdx) => (
                              <span
                                key={`${template.id}-set-${sIdx}`}
                                className="text-xs px-2 py-1 rounded-full bg-white/70"
                              >
                                {setItem.reps} x {setItem.weight}
                                {setItem.unit}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {template.notes && (
                      <p className="text-sm text-[color:var(--muted)] mt-3">
                        {template.notes}
                      </p>
                    )}

                    <div className="mt-4 flex gap-3">
                      <button
                        className="flex-1 rounded-full bg-[color:var(--accent-strong)] text-white px-3 py-2 text-sm font-semibold active:scale-[0.96]"
                        onClick={() => openLogModal(template)}
                      >
                        Log visit
                      </button>
                      <button
                        className="flex-1 rounded-full border border-[color:var(--accent-strong)] px-3 py-2 text-sm font-semibold"
                        onClick={() => openTemplateModal(template)}
                      >
                        Edit
                      </button>
                      <button
                        className="flex-1 rounded-full bg-[color:var(--rose)] text-white px-3 py-2 text-sm font-semibold"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-card rounded-2xl p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-display">Workout logs</h3>
                  <span className="text-xs text-[color:var(--muted)]">
                    {workoutLogs.length} total
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {workoutLogs.length === 0 && (
                    <p className="text-sm text-[color:var(--muted)]">
                      Your gym visits will appear here.
                    </p>
                  )}
                  {workoutLogs.slice(0, 6).map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl bg-white/70 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{log.templateName}</p>
                          <p className="text-xs text-[color:var(--muted)]">
                            {formatDate(log.date)}
                          </p>
                        </div>
                        <div className="text-xs text-[color:var(--accent-strong)]">
                          +{log.pointsEarned} pts
                        </div>
                      </div>
                      {log.notes && (
                        <p className="text-xs text-[color:var(--muted)] mt-2">
                          {log.notes}
                        </p>
                      )}
                      <button
                        className="mt-3 text-xs text-[color:var(--rose)]"
                        onClick={() => deleteLog(log.id)}
                      >
                        Remove log
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-display">Quick activity logs</h3>
                  <span className="text-xs text-[color:var(--muted)]">
                    {activityLogs.length} total
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {activityLogs.length === 0 && (
                    <p className="text-sm text-[color:var(--muted)]">
                      Log a reading, study, walk, or stretch session.
                    </p>
                  )}
                  {activityLogs.slice(0, 6).map((log) => (
                    <div key={log.id} className="rounded-xl bg-white/70 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{activityEmoji[log.kind]}</span>
                          <div>
                            <p className="font-semibold">{log.label}</p>
                            <p className="text-xs text-[color:var(--muted)]">
                              {formatDate(log.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-[color:var(--accent-strong)]">
                          +{log.pointsEarned} pts
                        </div>
                      </div>
                      <button
                        className="mt-3 text-xs text-[color:var(--rose)]"
                        onClick={() => deleteActivityLog(log.id)}
                      >
                        Remove log
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "store" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display">Coupon Store</h2>
                <div className="flex rounded-full bg-white/60 p-1">
                  <button
                    className={`px-3 py-1.5 text-xs rounded-full transition ${
                      couponFilter === "available"
                        ? "bg-[color:var(--accent-strong)] text-white"
                        : "text-[color:var(--muted)]"
                    }`}
                    onClick={() => setCouponFilter("available")}
                  >
                    Available
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs rounded-full transition ${
                      couponFilter === "redeemed"
                        ? "bg-[color:var(--accent-strong)] text-white"
                        : "text-[color:var(--muted)]"
                    }`}
                    onClick={() => setCouponFilter("redeemed")}
                  >
                    Redeemed
                  </button>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5 shadow-soft flex items-center justify-between">
                <div>
                  <p className="text-xs text-[color:var(--muted)]">Your points</p>
                  <p className="text-3xl font-display text-[color:var(--accent-strong)]">
                    {points.total}
                  </p>
                  <p className="text-xs text-[color:var(--muted)]">
                    Spend them on sweet treats
                  </p>
                </div>
                <div className="mascot mascot-float">\ud83d\udc7c</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {visibleCoupons.map((coupon) => {
                  const locked = !coupon.redeemed && points.total < coupon.cost;
                  return (
                    <div
                      key={coupon.id}
                      className={`relative glass-card rounded-2xl p-4 shadow-soft flex flex-col gap-3 ${
                        locked ? "opacity-70" : ""
                      }`}
                    >
                      {locked && (
                        <div className="absolute top-3 right-3 text-xs bg-white/80 px-2 py-1 rounded-full">
                          \ud83d\udd12 Locked
                        </div>
                      )}
                      <div className="text-2xl">{coupon.emoji}</div>
                      <div>
                        <p className="font-semibold text-sm">{coupon.title}</p>
                        <p className="text-xs text-[color:var(--muted)]">
                          {coupon.description}
                        </p>
                      </div>
                      <div className="mt-auto">
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-1 rounded-full bg-white/70">
                            {coupon.category}
                          </span>
                          <span className="font-semibold">
                            {coupon.cost} pts
                          </span>
                        </div>
                        {!coupon.redeemed && (
                          <button
                            className={`mt-3 w-full rounded-full px-3 py-2 text-xs font-semibold transition active:scale-[0.96] ${
                              locked
                                ? "bg-white/60 text-[color:var(--muted)]"
                                : "bg-[color:var(--accent-strong)] text-white"
                            }`}
                            onClick={() => confirmRedeem(coupon)}
                          >
                            {locked ? "Locked" : "Redeem"}
                          </button>
                        )}
                        {coupon.redeemed && (
                          <p className="text-xs text-[color:var(--accent-strong)] mt-2">
                            Redeemed \u2022 {coupon.redeemedAt
                              ? formatDate(coupon.redeemedAt)
                              : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "achievements" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display">Achievements</h2>
                <span className="text-sm text-[color:var(--muted)]">
                  {achievements.filter((ach) => ach.unlocked).length} /{
                  achievements.length}
                </span>
              </div>

              <div className="glass-card rounded-2xl p-5 shadow-soft flex items-center justify-between">
                <div>
                  <p className="text-xs text-[color:var(--muted)]">Progress</p>
                  <p className="text-lg font-semibold">
                    {achievements.filter((ach) => ach.unlocked).length} badges earned
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-white/70">
                    <div
                      className="h-2 rounded-full bg-[color:var(--accent-strong)]"
                      style={{
                        width: `${
                          (achievements.filter((ach) => ach.unlocked).length /
                            achievements.length) *
                          100
                        }%`
                      }}
                    />
                  </div>
                </div>
                <div className="mascot mascot-wiggle">\ud83c\udf88</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`rounded-2xl p-4 shadow-soft glass-card flex flex-col gap-3 transition ${
                      achievement.unlocked
                        ? "border border-[color:var(--accent-strong)]"
                        : "opacity-60"
                    }`}
                  >
                    <div className="text-2xl">
                      {achievement.emoji}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {achievement.title}
                      </p>
                      <p className="text-xs text-[color:var(--muted)]">
                        {achievement.unlocked
                          ? achievement.description
                          : "Keep going to unlock"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-display">Profile</h2>
              <div className="glass-card rounded-2xl p-4 shadow-soft">
                <label className="text-xs text-[color:var(--muted)]">Name</label>
                <input
                  className="mt-2 w-full rounded-xl bg-white/70 px-3 py-2 text-sm"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="glass-card rounded-2xl p-4 shadow-soft">
                <p className="text-sm text-[color:var(--muted)]">Love note</p>
                <p className="mt-2 text-sm">
                  Every workout is a love letter to your future self. I\u2019m your
                  biggest fan, and I can\u2019t wait to celebrate every little
                  victory with you. \u2764\ufe0f
                </p>
              </div>
              <button
                className="w-full rounded-full border border-[color:var(--rose)] text-[color:var(--rose)] py-3 font-semibold"
                onClick={resetData}
              >
                Reset everything
              </button>
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] bottom-tab rounded-full px-4 py-3 shadow-soft">
        <div className="relative flex items-center justify-between">
          {tabConfig.map((tab) => (
            <button
              key={tab.key}
              className={`flex flex-col items-center gap-1 text-xs transition active:scale-[0.95] ${
                activeTab === tab.key
                  ? "text-[color:var(--accent-strong)]"
                  : "text-[color:var(--muted)]"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="text-lg">{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
          <div
            className="absolute -bottom-2 h-1 w-10 rounded-full bg-[color:var(--accent-strong)] transition-all"
            style={{
              left: `${tabConfig.findIndex((tab) => tab.key === activeTab) *
                20}%`
            }}
          />
        </div>
      </nav>

      {activityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 modal-backdrop">
          <div className="w-full max-w-[420px] rounded-3xl bg-[color:var(--card-strong)] p-5 shadow-soft slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display">Log an activity</h3>
              <button
                className="text-sm"
                onClick={() => setActivityModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto scroll-hidden">
              <div className="rounded-2xl bg-white/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Gym workout</p>
                    <p className="text-xs text-[color:var(--muted)]">
                      Use a saved routine
                    </p>
                  </div>
                  <span className="text-2xl">\ud83c\udfcb\ufe0f</span>
                </div>
                {workoutTemplates.length > 0 ? (
                  <div className="mt-3 grid gap-2">
                    {workoutTemplates.slice(0, 3).map((template) => (
                      <button
                        key={`quick-${template.id}`}
                        className="w-full rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-left"
                        onClick={() => {
                          openLogModal(template);
                          setActivityModalOpen(false);
                        }}
                      >
                        Log {template.name}
                      </button>
                    ))}
                    <button
                      className="w-full rounded-full border border-[color:var(--accent-strong)] px-3 py-2 text-xs font-semibold"
                      onClick={() => {
                        setActiveTab("workouts");
                        setActivityModalOpen(false);
                      }}
                    >
                      View all routines
                    </button>
                  </div>
                ) : (
                  <button
                    className="mt-3 w-full rounded-full border border-[color:var(--accent-strong)] px-3 py-2 text-xs font-semibold"
                    onClick={() => {
                      setActiveTab("workouts");
                      setActivityModalOpen(false);
                    }}
                  >
                    Create a routine first
                  </button>
                )}
              </div>

              <div className="grid gap-3">
                {activityOptions.map((option) => (
                  <button
                    key={option.kind}
                    className="rounded-2xl bg-white/80 p-4 text-left shadow-soft active:scale-[0.98] transition"
                    onClick={() => logQuickActivity(option)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          {option.label}
                        </p>
                        <p className="text-xs text-[color:var(--muted)]">
                          {option.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl">{option.emoji}</div>
                        <p className="text-xs text-[color:var(--accent-strong)]">
                          +{option.points} pts
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 modal-backdrop">
          <div className="w-full max-w-[420px] rounded-3xl bg-[color:var(--card-strong)] p-5 shadow-soft slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display">
                {editingTemplateId ? "Edit routine" : "New routine"}
              </h3>
              <button className="text-sm" onClick={closeTemplateModal}>
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-[65vh] overflow-y-auto scroll-hidden">
              <div>
                <label className="text-xs text-[color:var(--muted)]">
                  Routine name
                </label>
                <input
                  className="mt-2 w-full rounded-xl bg-white/70 px-3 py-2 text-sm"
                  placeholder="Leg Day \ud83e\uddb5"
                  value={templateDraft.name}
                  onChange={(event) =>
                    setTemplateDraft((prev) => ({
                      ...prev,
                      name: event.target.value
                    }))
                  }
                />
              </div>

              <div className="space-y-4">
                {templateDraft.exercises.map((exercise, index) => (
                  <div
                    key={`exercise-${index}`}
                    className="rounded-2xl bg-white/70 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-[color:var(--muted)]">
                        Exercise {index + 1}
                      </label>
                      {templateDraft.exercises.length > 1 && (
                        <button
                          className="text-xs text-[color:var(--rose)]"
                          onClick={() => removeExercise(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      className="mt-2 w-full rounded-xl bg-white/70 px-3 py-2 text-sm"
                      value={exercise.name}
                      onChange={(event) =>
                        updateExercise(index, { name: event.target.value })
                      }
                      placeholder="Hip thrust"
                    />
                    <div className="mt-3 space-y-2">
                      {exercise.sets.map((setItem, setIndex) => (
                        <div
                          key={`set-${setIndex}`}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="number"
                            min={1}
                            className="w-16 rounded-lg bg-white/80 px-2 py-1 text-xs"
                            value={setItem.reps}
                            onChange={(event) =>
                              updateSet(index, setIndex, {
                                reps: Number(event.target.value)
                              })
                            }
                          />
                          <input
                            type="number"
                            min={0}
                            className="w-20 rounded-lg bg-white/80 px-2 py-1 text-xs"
                            value={setItem.weight}
                            onChange={(event) =>
                              updateSet(index, setIndex, {
                                weight: Number(event.target.value)
                              })
                            }
                          />
                          <select
                            className="rounded-lg bg-white/80 px-2 py-1 text-xs"
                            value={setItem.unit}
                            onChange={(event) =>
                              updateSet(index, setIndex, {
                                unit: event.target.value as "kg" | "lbs"
                              })
                            }
                          >
                            <option value="kg">kg</option>
                            <option value="lbs">lbs</option>
                          </select>
                          {exercise.sets.length > 1 && (
                            <button
                              className="text-xs text-[color:var(--rose)]"
                              onClick={() => removeSet(index, setIndex)}
                            >
                              \u2715
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        className="text-xs text-[color:var(--accent-strong)]"
                        onClick={() => addSet(index)}
                      >
                        + Add set
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="w-full rounded-full border border-[color:var(--accent-strong)] py-2 text-sm font-semibold"
                onClick={addExercise}
              >
                + Add exercise
              </button>

              <div>
                <label className="text-xs text-[color:var(--muted)]">Notes</label>
                <textarea
                  rows={3}
                  className="mt-2 w-full rounded-xl bg-white/70 px-3 py-2 text-sm"
                  value={templateDraft.notes}
                  onChange={(event) =>
                    setTemplateDraft((prev) => ({
                      ...prev,
                      notes: event.target.value
                    }))
                  }
                />
              </div>
            </div>

            <button
              className="mt-4 w-full rounded-full bg-[color:var(--accent-strong)] text-white py-3 font-semibold shadow-soft active:scale-[0.98]"
              onClick={saveTemplate}
            >
              {editingTemplateId ? "Save changes" : "Save routine"}
            </button>
          </div>
        </div>
      )}

      {logModalOpen && logTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 modal-backdrop">
          <div className="w-full max-w-[420px] rounded-3xl bg-[color:var(--card-strong)] p-5 shadow-soft slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display">Log gym visit</h3>
              <button className="text-sm" onClick={closeLogModal}>
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-white/70 p-3">
                <p className="text-xs text-[color:var(--muted)]">Routine</p>
                <p className="font-semibold">{logTarget.name}</p>
                <p className="text-xs text-[color:var(--muted)]">
                  {logTarget.exercises.length} exercises
                </p>
              </div>

              <div>
                <label className="text-xs text-[color:var(--muted)]">Date</label>
                <input
                  type="date"
                  className="mt-2 w-full rounded-xl bg-white/70 px-3 py-2 text-sm"
                  value={logDate}
                  onChange={(event) => setLogDate(event.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-[color:var(--muted)]">
                  How did it feel?
                </label>
                <textarea
                  rows={3}
                  className="mt-2 w-full rounded-xl bg-white/70 px-3 py-2 text-sm"
                  value={logNotes}
                  onChange={(event) => setLogNotes(event.target.value)}
                />
              </div>
            </div>

            <button
              className="mt-4 w-full rounded-full bg-[color:var(--accent-strong)] text-white py-3 font-semibold shadow-soft active:scale-[0.98]"
              onClick={logWorkout}
            >
              Confirm log
            </button>
          </div>
        </div>
      )}

      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 modal-backdrop">
          <div className="w-full max-w-[420px] rounded-3xl bg-[color:var(--card-strong)] p-5 shadow-soft slide-up">
            <h3 className="text-xl font-display">Welcome, gorgeous \u2728</h3>
            <p className="text-sm text-[color:var(--muted)] mt-2">
              Tell me your name so I can cheer you on.
            </p>
            <input
              className="mt-4 w-full rounded-xl bg-white/70 px-3 py-2 text-sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button
              className="mt-4 w-full rounded-full bg-[color:var(--accent-strong)] text-white py-3 font-semibold"
              onClick={() => setShowNameModal(false)}
            >
              Start my quest
            </button>
          </div>
        </div>
      )}

      {pointsToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-sm font-semibold text-[color:var(--accent-strong)] animate-floatUp">
          +{pointsToast} pts
        </div>
      )}

      {achievementToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[360px] rounded-2xl bg-[color:var(--card-strong)] p-4 shadow-soft slide-up">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{achievementToast.emoji}</span>
            <div>
              <p className="text-sm font-semibold">Achievement unlocked</p>
              <p className="text-xs text-[color:var(--muted)]">
                {achievementToast.title}
              </p>
            </div>
          </div>
        </div>
      )}

      {redeemTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 modal-backdrop">
          <div className="w-full max-w-[420px] rounded-3xl bg-[color:var(--card-strong)] p-5 shadow-soft slide-up">
            <h3 className="text-xl font-display">Redeem this coupon?</h3>
            <p className="text-sm text-[color:var(--muted)] mt-2">
              {redeemTarget.title} \u2022 {redeemTarget.cost} pts
            </p>
            <div className="mt-4 flex gap-3">
              <button
                className="flex-1 rounded-full border border-[color:var(--accent-strong)] py-3 text-sm font-semibold"
                onClick={() => setRedeemTarget(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-full bg-[color:var(--accent-strong)] text-white py-3 text-sm font-semibold"
                onClick={redeemCoupon}
              >
                Redeem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
