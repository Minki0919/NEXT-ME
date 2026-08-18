import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { getMyProfile, reuploadPersonalColorPhoto, reuploadSkinTypePhoto, saveFullProfile, type FullProfileRequest } from "../api/users";
import type { PhotoRetryResponse, UserProfile } from "../api/types";
import { clearNextMeLocalData, getAuthSession, getStoredProfile, saveProfile } from "../utils/storage";
import dashboardLogo from "../assets/figma/dashboard-logo.png";
import chevronIcon from "../assets/figma/menu-chevron.svg";
import logoutIcon from "../assets/figma/menu-logout.svg";

const EMPTY_FORM: FullProfileRequest = { nickname: "", gender: "", ageGroup: null, workDay: "", leaveTime: "", comeTime: "", workStyle: "", sleepHour: null, makeupFrequency: "", sunscreenFrequency: "", exerciseCount: null, sweatAmount: "", skinType: "", concerns: "", personalColor: "", onboardingMode: "DIRECT" };

function toForm(profile: UserProfile | null): FullProfileRequest {
  if (!profile) return EMPTY_FORM;
  return { nickname: profile.nickname || "", gender: profile.gender || "", ageGroup: profile.ageGroup, workDay: profile.workDay || "", leaveTime: profile.leaveTime || "", comeTime: profile.comeTime || "", workStyle: profile.workStyle || "", sleepHour: profile.sleepHour, makeupFrequency: profile.makeupFrequency || "", sunscreenFrequency: profile.sunscreenFrequency || "", exerciseCount: profile.exerciseCount, sweatAmount: profile.sweatAmount || "", skinType: profile.skinType || "", concerns: profile.concerns || "", personalColor: profile.personalColor || "", onboardingMode: "DIRECT" };
}

function confidence(value: number | null | undefined) {
  if (value == null) return "분석 전";
  return `${value <= 1 ? Math.round(value * 100) : Math.round(value)}%`;
}

export default function ProfileOverviewPage() {
  const navigate = useNavigate();
  const initial = getStoredProfile();
  const [profile, setProfile] = useState<UserProfile | null>(initial);
  const [form, setForm] = useState<FullProfileRequest>(() => toForm(initial));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"skin" | "color" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const nickname = profile?.nickname || getAuthSession()?.name || "사용자";

  useEffect(() => {
    let active = true;
    getMyProfile().then((result) => { if (active) { setProfile(result); setForm(toForm(result)); saveProfile(result); } })
      .catch((value) => { if (active) setError(value instanceof Error ? value.message : "프로필을 불러오지 못했습니다."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function update<K extends keyof FullProfileRequest>(key: K, value: FullProfileRequest[K]) { setForm((current) => ({ ...current, [key]: value })); }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try { const result = await saveFullProfile(form); setProfile(result); setForm(toForm(result)); saveProfile(result); setMessage("프로필 변경사항을 저장했어요."); }
    catch (value) { setError(value instanceof Error ? value.message : "프로필을 저장하지 못했습니다."); }
    finally { setSaving(false); }
  }

  function mergeAnalysis(result: PhotoRetryResponse, kind: "skin" | "color") {
    if (result.photoRetryRequired) { setError(result.photoRetryMessage || "사진을 분석하기 어려워요. 다른 사진으로 다시 시도해주세요."); return; }
    const next = result.profile || (profile && { ...profile, ...(kind === "skin" ? { skinType: result.detectedSkinType || profile.skinType, skinTypeConfidence: result.skinTypeConfidence ?? profile.skinTypeConfidence } : { personalColor: result.detectedPersonalColor || profile.personalColor, personalColorConfidence: result.personalColorConfidence ?? profile.personalColorConfidence }) });
    if (next) { setProfile(next); setForm(toForm(next)); saveProfile(next); }
    setMessage(result.analysisMessage || "새 사진 분석 결과를 반영했어요.");
  }

  async function upload(event: ChangeEvent<HTMLInputElement>, kind: "skin" | "color") {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("이미지 파일만 선택할 수 있어요."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("10MB 이하의 사진을 선택해주세요."); return; }
    setUploading(kind); setError(""); setMessage("");
    try { mergeAnalysis(kind === "skin" ? await reuploadSkinTypePhoto(file) : await reuploadPersonalColorPhoto(file), kind); }
    catch (value) { setError(value instanceof Error ? value.message : "사진을 다시 분석하지 못했습니다."); }
    finally { setUploading(null); }
  }

  function toggleSection(section: string) {
    setActiveSection((current) => current === section ? null : section);
  }

  function logout() {
    if (!window.confirm("로그아웃할까요?")) return;
    clearNextMeLocalData();
    navigate("/", { replace: true });
  }

  return <PinkPage className="profile-overview-page" scroll>
    <header className="profile-overview-title"><h1>프로필</h1></header>
    <form className="profile-overview-content profile-edit-form" onSubmit={submit}>
      <header className="profile-overview-user"><img src={dashboardLogo} alt="Next : Me" /><strong>{nickname}님</strong><button type="button" onClick={logout} aria-label="로그아웃"><img src={logoutIcon} alt="" /></button></header>

      <section className="profile-figma-menu" aria-label="프로필 수정 항목">
        <ProfileSectionButton label="기본 정보 수정" section="basic" active={activeSection} onClick={toggleSection} />
        {activeSection === "basic" && <section className="profile-edit-section"><label>닉네임<input value={form.nickname || ""} onChange={(e) => update("nickname", e.target.value)} /></label><div className="profile-edit-grid"><label>성별<select value={form.gender || ""} onChange={(e) => update("gender", e.target.value)}><option value="">선택</option><option>여성</option><option>남성</option><option>선택 안 함</option></select></label><label>연령대<input type="number" min="10" max="100" value={form.ageGroup ?? ""} onChange={(e) => update("ageGroup", e.target.value ? Number(e.target.value) : null)} /></label></div></section>}

        <ProfileSectionButton label="라이프스타일" section="lifestyle" active={activeSection} onClick={toggleSection} />
        {activeSection === "lifestyle" && <section className="profile-edit-section"><div className="profile-edit-grid"><label>화장 빈도<input value={form.makeupFrequency || ""} onChange={(e) => update("makeupFrequency", e.target.value)} /></label><label>자외선 차단제 사용 빈도<input value={form.sunscreenFrequency || ""} onChange={(e) => update("sunscreenFrequency", e.target.value)} /></label></div><label>피부 고민<textarea rows={3} value={form.concerns || ""} onChange={(e) => update("concerns", e.target.value)} /></label></section>}

        <ProfileSectionButton label="수면 패턴" section="sleep" active={activeSection} onClick={toggleSection} />
        {activeSection === "sleep" && <section className="profile-edit-section"><label>하루 수면 시간<input type="number" min="1" max="24" value={form.sleepHour ?? ""} onChange={(e) => update("sleepHour", e.target.value ? Number(e.target.value) : null)} /></label></section>}

        <ProfileSectionButton label="운동" section="exercise" active={activeSection} onClick={toggleSection} />
        {activeSection === "exercise" && <section className="profile-edit-section"><div className="profile-edit-grid"><label>주 운동 횟수<input type="number" min="0" max="14" value={form.exerciseCount ?? ""} onChange={(e) => update("exerciseCount", e.target.value ? Number(e.target.value) : null)} /></label><label>땀의 양<input value={form.sweatAmount || ""} onChange={(e) => update("sweatAmount", e.target.value)} /></label></div></section>}

        <ProfileSectionButton label="하루 일정" section="schedule" active={activeSection} onClick={toggleSection} />
        {activeSection === "schedule" && <section className="profile-edit-section"><label>근무 또는 학업 일정<input placeholder="예: 월~금" value={form.workDay || ""} onChange={(e) => update("workDay", e.target.value)} /></label><div className="profile-edit-grid"><label>출근 시간<input type="time" value={form.leaveTime || ""} onChange={(e) => update("leaveTime", e.target.value)} /></label><label>귀가 시간<input type="time" value={form.comeTime || ""} onChange={(e) => update("comeTime", e.target.value)} /></label></div><label>생활 유형<input value={form.workStyle || ""} onChange={(e) => update("workStyle", e.target.value)} /></label></section>}
      </section>

      <section className="profile-analysis-card"><div><span>피부 타입</span><strong>{profile?.skinType || "미분석"}</strong></div><div className="profile-analysis-action"><small>AI 분석 신뢰도 {confidence(profile?.skinTypeConfidence)}</small><label className="profile-photo-button">{uploading === "skin" ? "분석 중..." : "새 사진 재업로드"}<input type="file" accept="image/*" disabled={!!uploading} onChange={(e) => void upload(e, "skin")} /></label></div></section>
      <section className="profile-analysis-card"><div><span>퍼스널 컬러</span><strong>{profile?.personalColor || "미분석"}</strong></div><div className="profile-analysis-action"><small>AI 분석 신뢰도 {confidence(profile?.personalColorConfidence)}</small><label className="profile-photo-button">{uploading === "color" ? "분석 중..." : "새 사진 재업로드"}<input type="file" accept="image/*" disabled={!!uploading} onChange={(e) => void upload(e, "color")} /></label></div></section>
      <button className="profile-overview-save" type="submit" disabled={loading || saving || !!uploading}>{saving ? "저장 중..." : "변경사항 저장"}</button>
      {message && <p className="api-status success">{message}</p>}{error && <p className="api-status error">{error}</p>}
    </form>
  </PinkPage>;
}

function ProfileSectionButton({ label, section, active, onClick }: { label: string; section: string; active: string | null; onClick: (section: string) => void }) {
  const expanded = active === section;
  return <button className="profile-figma-menu-row" type="button" aria-expanded={expanded} onClick={() => onClick(section)}><span>{label}</span><img className={expanded ? "open" : ""} src={chevronIcon} alt="" /></button>;
}
