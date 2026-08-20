import {
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import PinkPage from "../components/PinkPage";

import {
  BottomNext,
  DetailHeader,
  DropdownQuestion,
} from "../components/FormParts";

import {
  defaultSkinDetailQuestions,
  skinConcerns,
  skinDetailQuestionOrder,
  skinTypes,
} from "../data/survey";

import {
  submitOnboardingAnswer,
  submitSkinTypeDetailFinal,
} from "../api/users";

import { ApiError } from "../api/http";

import type {
  OnboardingQuestion,
} from "../api/types";

import {
  readJson,
  readSurvey,
  saveAnalysisTarget,
  saveProfile,
  saveSkinAnalysis,
  saveSkinQuestions,
  STORAGE_KEYS,
  updateSurvey,
} from "../utils/storage";

import {
  templateOptions,
  templateQuestionText,
  useOnboardingTemplate,
} from "../hooks/useOnboardingTemplate";

const REQUIRED_FIELDS = [
  "afterWashTightness",
  "tZoneOil",
  "sensitivity",
  "acneFrequency",
] as const;

const UNKNOWN_ANSWER =
  "잘 모르겠어요";

const OTHER_CONCERN_OPTION =
  "기타(입력)";

const MAX_PHOTO_SIZE =
  10 * 1024 * 1024;

function isUnknownAnswer(
  value: string
) {
  return (
    value.replace(
      /[.。]$/,
      ""
    ) === UNKNOWN_ANSWER
  );
}

function isOtherConcern(
  value: string
) {
  return value
    .replace(/\s/g, "")
    .startsWith("기타");
}

export default function SkinDetailPage() {
  const navigate =
    useNavigate();

  const fileRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const template =
    useOnboardingTemplate();

  const survey =
    readSurvey();

  const storedQuestions =
    readJson<
      OnboardingQuestion[]
    >(
      STORAGE_KEYS.skinQuestions,
      []
    );

  const savedConcern =
    String(
      survey.concerns ?? ""
    );

  const [
    skinType,
    setSkinType,
  ] = useState(
    String(
      survey.skinType ?? ""
    )
  );

  /*
    이미 "기타: 홍조" 형태로 저장돼 있으면
    다시 페이지에 들어왔을 때 기타(입력)를 선택 상태로 복원
  */
  const [
    concerns,
    setConcerns,
  ] = useState(
    savedConcern.startsWith(
      "기타:"
    )
      ? OTHER_CONCERN_OPTION
      : savedConcern
  );

  const [
    otherConcern,
    setOtherConcern,
  ] = useState(
    savedConcern.startsWith(
      "기타:"
    )
      ? savedConcern
          .replace(
            /^기타:\s*/,
            ""
          )
          .trim()
      : ""
  );

  const [
    dynamicQuestions,
    setDynamicQuestions,
  ] = useState<
    OnboardingQuestion[]
  >(storedQuestions);

  const [
    answers,
    setAnswers,
  ] = useState<
    Record<string, string>
  >(
    Object.fromEntries(
      REQUIRED_FIELDS.map(
        (key) => [
          key,
          "",
        ]
      )
    )
  );

  const [
    photo,
    setPhoto,
  ] = useState<File | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loadingQuestions,
    setLoadingQuestions,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const skinTypeQuestion =
    templateQuestionText(
      template,
      "skinType",
      "본인의 피부 타입은 무엇인가요?"
    );

  const concernQuestion =
    templateQuestionText(
      template,
      "concerns",
      "주요 피부 고민을 선택해 주세요"
    );

  const skinTypeOptions =
    templateOptions(
      template,
      "skinType",
      skinTypes
    );

  const serverConcernOptions =
    templateOptions(
      template,
      "concerns",
      skinConcerns
    );

  /*
    서버에서 기타 옵션이 안 와도
    항상 기타(입력)을 제공
  */
  const concernOptions =
    serverConcernOptions.some(
      isOtherConcern
    )
      ? serverConcernOptions
      : [
          ...serverConcernOptions,
          OTHER_CONCERN_OPTION,
        ];

  const questions =
    useMemo(() => {
      const serverMap =
        new Map(
          dynamicQuestions
            .filter(
              (question) =>
                REQUIRED_FIELDS.includes(
                  question.field as
                    (typeof REQUIRED_FIELDS)[number]
                )
            )
            .map(
              (question) =>
                [
                  question.field,
                  {
                    field:
                      question.field,

                    question:
                      question.question,

                    options:
                      question.options &&
                      question.options
                        .length >
                        0
                        ? question.options
                        : [
                            "예",
                            "아니오",
                          ],
                  },
                ] as const
            )
        );

      return skinDetailQuestionOrder.map(
        (field) => {
          const fromServer =
            serverMap.get(
              field
            );

          if (fromServer) {
            return fromServer;
          }

          const fallback =
            defaultSkinDetailQuestions.find(
              (question) =>
                question.field ===
                field
            );

          return {
            field,

            question:
              fallback?.question ??
              field,

            options:
              fallback
                ? [
                    ...fallback.options,
                  ]
                : [
                    "예",
                    "아니오",
                  ],
          };
        }
      );
    }, [dynamicQuestions]);

  const showDetailQuestions =
    isUnknownAnswer(
      skinType
    );

  const selectedOtherConcern =
    isOtherConcern(
      concerns
    );

  /*
    실제 저장될 값
  */
  const concernAnswer =
    selectedOtherConcern
      ? otherConcern.trim()
        ? `기타: ${otherConcern.trim()}`
        : ""
      : concerns;

  const allAnswered =
    !showDetailQuestions ||
    questions.every(
      (question) =>
        Boolean(
          answers[
            question.field
          ]
        )
    );

  const missingItems = [
    !skinType
      ? "스킨 타입"
      : "",

    !concerns
      ? "피부 고민"
      : "",

    selectedOtherConcern &&
    !otherConcern.trim()
      ? "기타 피부 고민 입력"
      : "",

    ...(showDetailQuestions
      ? questions
          .filter(
            (question) =>
              !answers[
                question.field
              ]
          )
          .map(
            (question) =>
              question.question
          )
      : []),
  ].filter(Boolean);

  const ready =
    missingItems.length === 0 &&
    allAnswered;

  function selectPhoto(
    nextPhoto: File | null
  ) {
    if (!nextPhoto) {
      return;
    }

    if (
      !nextPhoto.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "이미지 파일만 업로드할 수 있습니다."
      );

      return;
    }

    if (
      nextPhoto.size >
      MAX_PHOTO_SIZE
    ) {
      setError(
        "사진은 최대 10MB까지 업로드할 수 있습니다."
      );

      return;
    }

    setPhoto(nextPhoto);

    setError("");
  }

  async function loadUnknownQuestions(
    value: string
  ) {
    if (
      !isUnknownAnswer(value) ||
      dynamicQuestions.length >
        0 ||
      loadingQuestions
    ) {
      return;
    }

    setLoadingQuestions(true);
    setError("");

    try {
      const response =
        await submitOnboardingAnswer(
          "skinType",
          UNKNOWN_ANSWER
        );

      saveSkinQuestions(
        response.nextQuestions
      );

      if (response.profile) {
        saveProfile(
          response.profile
        );
      }

      setDynamicQuestions(
        response.nextQuestions ??
          []
      );
    } catch (value) {
      setError(
        value instanceof ApiError ||
          value instanceof Error
          ? value.message
          : "스킨 타입 세부 질문을 불러오지 못했습니다."
      );

      throw value;
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function next() {
    if (
      !ready ||
      loading ||
      loadingQuestions
    ) {
      return;
    }

    setLoading(true);

    setError("");
    setMessage("");

    try {
      updateSurvey({
        skinType,

        concerns:
          concernAnswer,

        skinDetail:
          showDetailQuestions
            ? answers
            : {},
      });

      if (
        !showDetailQuestions
      ) {
        navigate(
          "/profile/personal-color"
        );

        return;
      }

      if (
        dynamicQuestions.length ===
        0
      ) {
        await loadUnknownQuestions(
          skinType
        );
      }

      const response =
        await submitSkinTypeDetailFinal(
          answers,
          photo
        );

      saveSkinAnalysis(
        response
      );

      saveAnalysisTarget(
        "skinType"
      );

      if (response.profile) {
        saveProfile(
          response.profile
        );
      }

      const detected =
        response.detectedSkinType ??
        response.profile
          ?.skinType ??
        skinType;

      const confidence =
        response.skinTypeConfidence ??
        response.profile
          ?.skinTypeConfidence ??
        null;

      updateSurvey({
        skinType:
          detected,

        concerns:
          concernAnswer,

        skinDetail:
          answers,

        ...(confidence !==
        null
          ? {
              skinTypeConfidence:
                confidence,
            }
          : {}),
      });

      if (
        response.photoRetryRequired
      ) {
        setMessage(
          response.photoRetryMessage ||
            "사진을 다시 업로드해 주세요."
        );

        return;
      }

      navigate(
        "/profile/personal-color"
      );
    } catch (value) {
      setError(
        value instanceof ApiError ||
          value instanceof Error
          ? value.message
          : "스킨 타입 분석에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PinkPage className="survey-page detail-survey-page">
      <DetailHeader title="스킨 타입 세부 질문" />

      <div className="survey-scroll detail-survey-scroll">
        <DropdownQuestion
          title={
            skinTypeQuestion
          }
          options={
            skinTypeOptions
          }
          value={
            skinType
          }
          disabled={
            loadingQuestions
          }
          onChange={(value) => {
            setSkinType(
              value
            );

            if (
              isUnknownAnswer(
                value
              )
            ) {
              void loadUnknownQuestions(
                value
              ).catch(
                () =>
                  undefined
              );
            } else {
              setDynamicQuestions(
                []
              );

              setAnswers(
                Object.fromEntries(
                  REQUIRED_FIELDS.map(
                    (key) => [
                      key,
                      "",
                    ]
                  )
                )
              );

              saveSkinQuestions(
                null
              );
            }
          }}
        />

        <DropdownQuestion
          title={
            concernQuestion
          }
          options={
            concernOptions
          }
          value={
            concerns
          }
          onChange={(value) => {
            setConcerns(
              value
            );

            if (
              !isOtherConcern(
                value
              )
            ) {
              setOtherConcern(
                ""
              );
            }
          }}
        />

        {/* 기타 입력 */}
        {selectedOtherConcern && (
          <label className="survey-other-concern">
            <span>
              피부 고민을 직접 입력해 주세요
            </span>

            <input
              type="text"
              value={
                otherConcern
              }
              onChange={(
                event
              ) =>
                setOtherConcern(
                  event.target.value.slice(
                    0,
                    50
                  )
                )
              }
              placeholder="예: 홍조, 색소침착, 눈가 건조함"
              maxLength={50}
              autoFocus
            />

            <small>
              {
                otherConcern.length
              }
              /50
            </small>
          </label>
        )}

        {showDetailQuestions && (
          <div className="conditional-detail-questions">
            {questions.map(
              (
                question
              ) => (
                <DropdownQuestion
                  key={
                    question.field
                  }
                  title={
                    question.question
                  }
                  options={
                    question.options
                  }
                  value={
                    answers[
                      question.field
                    ] ?? ""
                  }
                  onChange={(
                    value
                  ) =>
                    setAnswers(
                      (
                        current
                      ) => ({
                        ...current,

                        [question.field]:
                          value,
                      })
                    )
                  }
                />
              )
            )}

            <details className="survey-photo-details">
              <summary>
                사진으로 더 정확하게 분석하기 (선택)
              </summary>

              <button
                type="button"
                className="survey-photo-button"
                onClick={() =>
                  fileRef.current?.click()
                }
              >
                {photo
                  ? photo.name
                  : "사진 선택하기"}
              </button>

              <input
                ref={
                  fileRef
                }
                hidden
                type="file"
                accept="image/*"
                onChange={(
                  event
                ) =>
                  selectPhoto(
                    event.target
                      .files?.[0] ??
                      null
                  )
                }
              />
            </details>
          </div>
        )}

        {(error ||
          message) && (
          <p
            className={
              error
                ? "api-status error survey-api-status"
                : "api-status success survey-api-status"
            }
          >
            {error ||
              message}
          </p>
        )}

        <div className="scroll-spacer" />
      </div>

      <BottomNext
        onClick={() =>
          void next()
        }
        disabled={
          !ready ||
          loading ||
          loadingQuestions
        }
        missingItems={
          loading ||
          loadingQuestions
            ? []
            : missingItems
        }
      >
        {loading ||
        loadingQuestions
          ? "처리 중..."
          : "다음으로 넘어가기"}
      </BottomNext>
    </PinkPage>
  );
}