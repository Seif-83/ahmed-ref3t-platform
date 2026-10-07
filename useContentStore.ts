import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, type Unsubscribe } from 'firebase/database';
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { DB_PATH_SETTINGS } from './constants';
import { PrepData, Lesson, SiteSettings, PrepLevel } from './types';
import { PREP_LEVELS_DATA, DEFAULT_SITE_SETTINGS } from './constants';

const DB_PATH = 'platform_content';

export function useContentStore() {
    const [levels, setLevels] = useState<PrepData[]>(PREP_LEVELS_DATA);
    const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    // Listen for real-time updates from Firebase
    useEffect(() => {
        let unsubscribeContent: Unsubscribe | undefined;
        let unsubscribeSettings: Unsubscribe | undefined;
        let loadTimer: ReturnType<typeof setTimeout> | undefined;
        let authRevision = 0;

        const unsubscribeAuth = onAuthStateChanged(auth, user => {
            const revision = ++authRevision;
            unsubscribeContent?.();
            unsubscribeSettings?.();
            if (loadTimer) clearTimeout(loadTimer);

            if (!user) {
                setLevels(PREP_LEVELS_DATA);
                setSiteSettings(DEFAULT_SITE_SETTINGS);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            void getIdTokenResult(user).then(token => {
                if (revision !== authRevision) return;
                const role = token.claims.role;
                if (role === 'student') {
                    void user.getIdToken().then(idToken => fetch('/api/student-data', {
                        headers: { Authorization: `Bearer ${idToken}` },
                    })).then(async response => {
                        const result = await response.json() as { levels?: PrepData[]; siteSettings?: SiteSettings };
                        if (!response.ok) throw new Error('Could not load student content');
                        if (revision === authRevision) {
                            setLevels(result.levels || PREP_LEVELS_DATA);
                            setSiteSettings(result.siteSettings || DEFAULT_SITE_SETTINGS);
                            setIsLoading(false);
                        }
                    }).catch(error => {
                        console.error('useContentStore: Student content error:', error);
                        if (revision === authRevision) setIsLoading(false);
                    });
                    return;
                }
                if (role !== 'admin') {
                    setIsLoading(false);
                    return;
                }

                loadTimer = setTimeout(() => {
                    console.warn('useContentStore: Loading timed out after 5s');
                    setIsLoading(false);
                }, 5000);

                const dbRef = ref(db, DB_PATH);
                unsubscribeContent = onValue(dbRef, snapshot => {
                    if (snapshot.exists()) {
                        const data = snapshot.val() as PrepData[];
                        const rawLevels = (Array.isArray(data) ? data : Object.values(data)) as PrepData[];
                        setLevels(rawLevels.map(level => ({ ...level, lessons: level.lessons || [] })));
                    } else {
                        void set(dbRef, PREP_LEVELS_DATA);
                        setLevels(PREP_LEVELS_DATA);
                    }
                    setIsLoading(false);
                }, error => {
                    console.error('useContentStore: Firebase read error:', error);
                    setLevels(PREP_LEVELS_DATA);
                    setIsLoading(false);
                });

                const settingsRef = ref(db, DB_PATH_SETTINGS);
                unsubscribeSettings = onValue(settingsRef, snapshot => {
                    if (snapshot.exists()) setSiteSettings(snapshot.val());
                    else {
                        void set(settingsRef, DEFAULT_SITE_SETTINGS);
                        setSiteSettings(DEFAULT_SITE_SETTINGS);
                    }
                }, error => console.error('useContentStore: Settings read error:', error));
            }).catch(error => {
                console.error('useContentStore: Authentication error:', error);
                if (revision === authRevision) setIsLoading(false);
            });
        });

        return () => {
            authRevision++;
            unsubscribeAuth();
            unsubscribeContent?.();
            unsubscribeSettings?.();
            if (loadTimer) clearTimeout(loadTimer);
        };
    }, []);

    const addLesson = useCallback((levelId: string, lesson: Lesson) => {
        const updated = levels.map(level =>
            level.id === levelId
                ? { ...level, lessons: [...level.lessons, lesson] }
                : level
        );
        set(ref(db, DB_PATH), updated);
    }, [levels]);

    const removeLesson = useCallback((levelId: string, lessonId: string) => {
        const updated = levels.map(level =>
            level.id === levelId
                ? { ...level, lessons: level.lessons.filter(l => l.id !== lessonId) }
                : level
        );
        set(ref(db, DB_PATH), updated);
    }, [levels]);

    const updateLesson = useCallback((levelId: string, lessonId: string, data: Partial<Lesson>) => {
        const updated = levels.map(level =>
            level.id === levelId
                ? {
                    ...level,
                    lessons: level.lessons.map(l =>
                        l.id === lessonId ? { ...l, ...data } : l
                    ),
                }
                : level
        );
        set(ref(db, DB_PATH), updated);
    }, [levels]);

    const resetToDefaults = useCallback(() => {
        set(ref(db, DB_PATH), PREP_LEVELS_DATA);
        set(ref(db, DB_PATH_SETTINGS), DEFAULT_SITE_SETTINGS);
    }, []);

    const updateLevelImage = useCallback((levelId: PrepLevel, imageUrl: string) => {
        const updated = levels.map(level =>
            level.id === levelId ? { ...level, image: imageUrl } : level
        );
        set(ref(db, DB_PATH), updated);
    }, [levels]);

    const updateSiteSettings = useCallback((settings: Partial<SiteSettings>) => {
        const updated = { ...siteSettings, ...settings };
        set(ref(db, DB_PATH_SETTINGS), updated);
    }, [siteSettings]);

    return {
        levels,
        siteSettings,
        isLoading,
        addLesson,
        removeLesson,
        updateLesson,
        resetToDefaults,
        updateLevelImage,
        updateSiteSettings
    };
}
