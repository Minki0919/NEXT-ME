import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { routinePreferenceCharts } from "../data/survey";
import {
  getRoutinePreferences,
  saveRoutinePreferences,
} from "../api/users";
import { ApiError } from "../api/http";
import type { RoutinePreferences } from "../api/types";
import {
  readJson,
  saveStoredRoutinePreferences,
  STORAGE_KEYS,
  writeJson,
} from "../utils/storage";

type ChartState = Record<string, boolean>;

const ROUTINE_GENERATION_KEYS = [
  "routineCleansing",
  "routineSkinCare",
  "routineSleepWake",
  "routineDiet",
  "routineExercise",
] as const;

const defaultState: ChartState = Object.fromEntries(
  routinePreferenceCharts.map((chart) => [chart.id, true])
);

// 화면의 True/False 선택값을 백엔드 PUT BODY 형식으로 변환합니다.
function toRequest(selected: ChartState): RoutinePreferences {
  return {
    routineCleansing: Boolean(selected.routineCleansing),
    routineSkinCare: Boolean(selected.routineSkinCare),
    routinePersonalColor: Boolean(selected.routinePersonalColor),
    routineSleepWake: Boolean(selected.routineSleepWake),
    routineDiet: Boolean(selected.routineDiet),
    routineExercise: Boolean(selected.routineExercise),
  };
}

// 서버 응답을 화면에서 사용하는 Record<string, boolean> 형태로 통일합니다.
function normalizePreferences(preferences: RoutinePreferences): ChartState {
  const normalized: ChartState = { ...defaultState };

  for (const chart of routinePreferenceCharts) {
    normalized[chart.id] = Boolean(
      preferences[chart.id as keyof RoutinePreferences]
    );
  }

  return normalized;
}

export default function ChartSelectPage() {
  const navigate = useNavigate();
  const initial = {
    ...defaultState,
    ...readJson<ChartState>(STORAGE_KEYS.charts, {}),
  };
  const [selected, setSelected] = useState<ChartState>(initial);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  // 페이지 진입 시 백엔드에 저장된 최신 루틴 선택값을 다시 읽습니다.
  // 서버 조회가 실패하더라도 기존 localStorage 값으로 화면은 사용할 수 있게 둡니다.
  useEffect(() => {
    let cancelled = false;

    async function loadSavedPreferences() {
      try {
        const preferences = await getRoutinePreferences();
        if (cancelled || !preferences) return;

        const normalized = normalizePreferences(preferences);
        setSelected(normalized);
        writeJson(STORAGE_KEYS.charts, normalized);
        saveStoredRoutinePreferences(preferences);
      } catch (value) {
        if (!cancelled) {
          console.warn("[루틴 선호도 조회 실패] localStorage 값을 사용합니다.", value);
        }
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    }

    void loadSavedPreferences();

    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const result: Record<string, typeof routinePreferenceCharts[number][]> = {};
    for (const chart of routinePreferenceCharts) {
      (result[chart.group] ??= []).push(chart);
    }
    return result;
  }, []);

  async function save() {
    if (loading) return;

    if (!ROUTINE_GENERATION_KEYS.some((key) => selected[key])) {
      setStatus("");
      setError("일일 루틴으로 생성할 항목을 한 개 이상 선택해 주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("");

    // 버튼을 누른 순간의 선택값을 별도로 복사해 두어
    // 비동기 요청 중 상태가 바뀌더라도 동일한 BODY가 저장되도록 합니다.
    const requestBody = toRequest(selected);

    try {
      // 1) 백엔드에 실제 선택값 저장
      const saved = await saveRoutinePreferences(requestBody);

      // 2) PUT 응답이 204/빈 BODY여도 저장 자체는 성공한 것이므로
      //    사용자가 선택한 값을 우선 localStorage에 확정 저장합니다.
      const optimisticState = normalizePreferences(requestBody);
      writeJson(STORAGE_KEYS.charts, optimisticState);
      saveStoredRoutinePreferences(saved || requestBody);
      setSelected(optimisticState);

      // 3) 가능하면 GET으로 서버 저장 결과를 다시 검증합니다.
      //    GET이 일시적으로 실패해도 이미 성공한 PUT 결과를 취소하지 않습니다.
      try {
        const reloaded = await getRoutinePreferences();
        if (reloaded) {
          const normalized = normalizePreferences(reloaded);
          writeJson(STORAGE_KEYS.charts, normalized);
          saveStoredRoutinePreferences(reloaded);
          setSelected(normalized);
        }
      } catch (reloadError) {
        console.warn(
          "[루틴 선호도 재조회 실패] PUT 저장 결과를 유지합니다.",
          reloadError
        );
      }

      setStatus("차트 설정이 저장되었습니다.");

      // 저장 완료 문구가 잠깐 보인 뒤 차트 목록으로 이동합니다.
      window.setTimeout(() => navigate("/charts"), 350);
    } catch (value) {
      setError(
        value instanceof ApiError || value instanceof Error
          ? value.message
          : "루틴 선호도 저장에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetAllToTrue() {
    setSelected({ ...defaultState });
    setError("");
    setStatus("모든 항목을 True로 초기화했습니다. 저장하기를 눌러 적용해 주세요.");
  }

  return (
    <PinkPage className="chart-page" scroll>
      <header className="simple-page-header">
        <button onClick={() => navigate("/game")}>‹</button>
        <h1>피드백 루틴 선택</h1>
      </header>

      <section className="chart-intro">
        <strong>피드백 받고 싶은 루틴을 선택해주세요</strong>
        <p>
          {initialLoading
            ? "저장된 차트 설정을 불러오는 중입니다."
            : "변경한 항목은 백엔드와 기기에 함께 저장됩니다."}
        </p>
      </section>

      <div className="chart-select-groups">
        {Object.entries(grouped).map(([group, items]) => (
          <section className="chart-group-card" key={group}>
            <h2>{group}</h2>

            {items.map((chart) => (
              <div className="chart-toggle-row" key={chart.id}>
                <span>{chart.label}</span>
                <div>
                  <button
                    type="button"
                    className={selected[chart.id] ? "active" : ""}
                    onClick={() =>
                      setSelected((current) => ({
                        ...current,
                        [chart.id]: true,
                      }))
                    }
                  >
                    True
                  </button>
                  <button
                    type="button"
                    className={!selected[chart.id] ? "active" : ""}
                    onClick={() =>
                      setSelected((current) => ({
                        ...current,
                        [chart.id]: false,
                      }))
                    }
                  >
                    False
                  </button>
                </div>
              </div>
            ))}
          </section>
        ))}

        <section className="chart-bottom-actions" aria-label="차트 설정 저장">
          <button
            type="button"
            className="chart-reset-all-button"
            disabled={loading || initialLoading}
            onClick={resetAllToTrue}
          >
            전체 True로 초기화
          </button>

          <button
            type="button"
            className="figma-bottom-button chart-save-button"
            disabled={loading || initialLoading}
            onClick={() => void save()}
          >
            {initialLoading ? "설정 불러오는 중..." : loading ? "저장 중..." : "저장하기"}
          </button>

          {error && <p className="api-status error chart-api-status">{error}</p>}
          {status && <p className="api-status chart-api-status">{status}</p>}
        </section>
      </div>
    </PinkPage>
  );
}
