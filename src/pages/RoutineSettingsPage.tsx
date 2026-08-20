import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import PinkPage from "../components/PinkPage";

import {
  getRoutinePreferences,
  saveRoutinePreferences,
} from "../api/users";

import type {
  RoutinePreferences,
} from "../api/types";

import {
  getAuthSession,
  getStoredProfile,
  saveStoredRoutinePreferences,
} from "../utils/storage";

const DEFAULT_PREFERENCES:
  RoutinePreferences = {
  routineCleansing: true,
  routineSkinCare: true,
  routinePersonalColor: true,
  routineSleepWake: true,
  routineDiet: true,
  routineExercise: true,
};

const ROUTINE_OPTIONS = [
  [
    "routineCleansing",
    "세안",
  ],

  [
    "routineSkinCare",
    "스킨케어",
  ],

  [
    "routineSleepWake",
    "수면, 기상",
  ],

  [
    "routineDiet",
    "식사",
  ],

  [
    "routineExercise",
    "운동",
  ],
] as const;

export default function RoutineSettingsPage() {
  const navigate =
    useNavigate();

  const nickname =
    getStoredProfile()?.nickname ||
    getAuthSession()?.name ||
    "사용자";

  const [
    preferences,
    setPreferences,
  ] =
    useState<RoutinePreferences>(
      DEFAULT_PREFERENCES
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");

  useEffect(() => {
    let cancelled =
      false;

    void getRoutinePreferences()
      .then(
        (result) => {
          if (
            !cancelled &&
            result
          ) {
            setPreferences({
              ...DEFAULT_PREFERENCES,
              ...result,
            });
          }
        }
      )
      .catch(
        (value) => {
          if (
            !cancelled
          ) {
            setError(
              value instanceof
                Error
                ? value.message
                : "저장된 루틴 설정을 불러오지 못했습니다."
            );
          }
        }
      )
      .finally(() => {
        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(
    key:
      (typeof ROUTINE_OPTIONS)[number][0]
  ) {
    setPreferences(
      (current) => ({
        ...current,

        [key]:
          !current[key],
      })
    );

    setError("");
    setNotice("");
  }

  async function save() {
    if (
      saving ||
      loading
    ) {
      return;
    }

    if (
      !ROUTINE_OPTIONS.some(
        ([key]) =>
          preferences[key]
      )
    ) {
      setError(
        "루틴에 포함할 항목을 한 개 이상 선택해 주세요."
      );

      return;
    }

    setSaving(true);

    setError("");
    setNotice("");

    try {
      const saved =
        await saveRoutinePreferences(
          preferences
        );

      const confirmed =
        saved ||
        preferences;

      setPreferences(
        (current) => ({
          ...current,
          ...confirmed,
        })
      );

      saveStoredRoutinePreferences(
        confirmed
      );

      setNotice(
        "루틴 설정이 저장되었습니다."
      );

      window.setTimeout(
        () =>
          navigate(
            "/routine/create"
          ),
        350
      );
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "루틴 설정을 저장하지 못했습니다."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PinkPage
      className="figma-feature-page routine-settings-page"
      scroll
    >
      {/*
        페이지 자체 메뉴/헤더 제거.
        App.tsx 전역 헤더를 사용합니다.
      */}

      <main className="routine-settings-content">
        <p className="routine-settings-greeting">
          <strong>
            {nickname}님
          </strong>
          , 안녕하세요 👋

          <br />

          오늘의 루틴을
          선택해주세요
        </p>

        <h2>
          루틴에 포함할 항목을 선택하세요
        </h2>

        <section className="routine-settings-card">
          {ROUTINE_OPTIONS.map(
            (
              [
                key,
                label,
              ]
            ) => (
              <label
                key={key}
                className="routine-settings-option"
              >
                <input
                  type="checkbox"
                  checked={
                    preferences[
                      key
                    ]
                  }
                  disabled={
                    loading ||
                    saving
                  }
                  onChange={() =>
                    toggle(
                      key
                    )
                  }
                />

                <span
                  aria-hidden="true"
                />

                <strong>
                  {label}
                </strong>
              </label>
            )
          )}
        </section>

        <button
          type="button"
          className="routine-settings-skip"
          onClick={() =>
            navigate(
              "/routine/create"
            )
          }
        >
          다음에 할게요
        </button>

        <button
          type="button"
          className="figma-feature-primary"
          disabled={
            loading ||
            saving
          }
          onClick={() =>
            void save()
          }
        >
          {loading
            ? "설정 불러오는 중..."
            : saving
              ? "저장 중..."
              : "저장"}
        </button>

        {(error ||
          notice) && (
          <p
            className={`api-status ${
              error
                ? "error"
                : "success"
            }`}
          >
            {error ||
              notice}
          </p>
        )}
      </main>
    </PinkPage>
  );
}