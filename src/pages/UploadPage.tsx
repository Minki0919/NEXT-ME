import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { MissingFieldsNotice } from "../components/FormParts";
import { assets } from "../assets";
import {
  getMyProfile,
  reuploadPersonalColorPhoto,
  reuploadSkinTypePhoto,
} from "../api/users";
import { ApiError } from "../api/http";
import {
  saveAnalysisTarget,
  savePersonalColorAnalysis,
  saveProfile,
  saveSkinAnalysis,
} from "../utils/storage";

type UploadTarget = "personalColor" | "skinType";
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

export default function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState<UploadTarget>("personalColor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onFile(nextFile?: File) {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (nextFile.size > MAX_PHOTO_SIZE) {
      setError("사진은 최대 10MB까지 업로드할 수 있습니다.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setError("");
    setMessage("");
  }

  async function analyze() {
    if (loading) return;
    if (!file) {
      setError("분석할 사진을 먼저 선택해 주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response =
        target === "personalColor"
          ? await reuploadPersonalColorPhoto(file)
          : await reuploadSkinTypePhoto(file);

      saveAnalysisTarget(target);
      if (target === "personalColor") {
        savePersonalColorAnalysis(response);
      } else {
        saveSkinAnalysis(response);
      }

      if (response.photoRetryRequired) {
        setMessage(
          response.photoRetryMessage ||
            response.analysisMessage ||
            "백엔드에서 사진 재업로드를 요청했습니다."
        );
        return;
      }

      const profile = await getMyProfile();
      saveProfile(profile);
      navigate("/analysis", { state: { target } });
    } catch (value) {
      setError(value instanceof ApiError || value instanceof Error ? value.message : "사진 업로드에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PinkPage className="upload-page">
      <button className="exit-link" onClick={() => navigate("/profile/personal-color")}>
        <img src={assets.uploadBack} alt="" />
        나가기
      </button>

      <h1>
        사진을 업로드 하면
        <br />
        Next : Me가 Ai로 분석해드릴게요!
      </h1>

      <button className="upload-card" onClick={() => inputRef.current?.click()}>
        {preview ? (
          <img className="uploaded-preview" src={preview} alt="선택한 피부 사진" />
        ) : (
          <>
            <div className="upload-art">
              <span className="upload-square-one" />
              <span className="upload-square-two" />
              <img className="upload-vector" src={assets.uploadVector} alt="" />
              <img className="upload-dot" src={assets.uploadDot} alt="" />
            </div>
            <span>사진을 업로드 하세요</span>
          </>
        )}
      </button>

      <button className="upload-choice" onClick={() => cameraRef.current?.click()}>
        사진 촬영
      </button>
      <button className="upload-choice second" onClick={() => inputRef.current?.click()}>
        보관함에서 선택하기
      </button>

      <div className="upload-target-selector" aria-label="재분석 항목 선택">
        <button
          type="button"
          className={target === "skinType" ? "active" : ""}
          onClick={() => setTarget("skinType")}
        >
          스킨타입
        </button>
        <button
          type="button"
          className={target === "personalColor" ? "active" : ""}
          onClick={() => setTarget("personalColor")}
        >
          퍼스널컬러
        </button>
      </div>

      {(error || message) && (
        <p className={error ? "api-status error upload-api-status" : "api-status success upload-api-status"}>
          {error || message}
        </p>
      )}

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        hidden
        type="file"
        accept="image/*"
        capture="user"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <MissingFieldsNotice
        id="upload-missing-file"
        items={!loading && !file ? ["분석할 사진"] : []}
        className="bottom-action-missing"
      />

      <button
        className="figma-bottom-button"
        disabled={loading || !file}
        onClick={() => void analyze()}
        aria-describedby={!file ? "upload-missing-file" : undefined}
      >
        {loading ? "AI 분석 중..." : file ? "AI 분석하기" : "사진을 먼저 선택해 주세요"}
      </button>
    </PinkPage>
  );
}
