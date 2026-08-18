import { useEffect, useState } from "react";
import { getOnboardingTemplate } from "../api/users";
import type { OnboardingQuestion } from "../api/types";
import {
  readJson,
  saveOnboardingTemplate,
  STORAGE_KEYS,
} from "../utils/storage";

/**
 * 백엔드의 GET /users/onboarding/template 값을 화면 문구/선택지의 기준으로 사용합니다.
 *
 * - 로그인 직후 저장된 localStorage 값을 먼저 보여주고
 * - 각 온보딩 화면 진입 시 서버에서 최신 템플릿을 다시 조회하여 즉시 갱신합니다.
 * - 따라서 백엔드에서 question/options가 바뀌면 프론트 코드 수정 없이 화면도 바뀝니다.
 */
export function useOnboardingTemplate() {
  const [template, setTemplate] = useState<OnboardingQuestion[]>(() =>
    readJson<OnboardingQuestion[]>(STORAGE_KEYS.onboardingTemplate, [])
  );

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const latest = await getOnboardingTemplate();
        if (cancelled) return;
        saveOnboardingTemplate(latest);
        setTemplate(latest);
      } catch (error) {
        // 템플릿 재조회 실패 시 로그인 직후 저장해 둔 값 또는 fallback UI를 유지합니다.
        // 화면 전체를 막지 않고 실제 입력/저장 API는 계속 사용할 수 있게 합니다.
        console.warn("[온보딩 템플릿 갱신 실패]", error);
      }
    }

    void refresh();
    return () => {
      cancelled = true;
    };
  }, []);

  return template;
}

/** field 이름으로 백엔드 질문을 찾습니다. */
export function findTemplateQuestion(
  template: OnboardingQuestion[],
  field: string
) {
  return template.find((item) => item.field === field);
}

/** 백엔드 question이 있으면 그것을 사용하고, 없을 때만 fallback을 사용합니다. */
export function templateQuestionText(
  template: OnboardingQuestion[],
  field: string,
  fallback: string
) {
  return findTemplateQuestion(template, field)?.question || fallback;
}

/** 백엔드 options가 있으면 그것을 사용하고, 없을 때만 fallback을 사용합니다. */
export function templateOptions(
  template: OnboardingQuestion[],
  field: string,
  fallback: readonly string[]
) {
  const options = findTemplateQuestion(template, field)?.options;
  return options && options.length > 0 ? options : [...fallback];
}
