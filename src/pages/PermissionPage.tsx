import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { assets } from "../assets";
import { getAuthSession } from "../utils/storage";

const permissionItems = [
  {
    icon: assets.permissionPhoto,
    title: "사진 및 카메라",
    text: "선택적 접근 권한",
  },
  {
    icon: assets.permissionLocation,
    title: "위치",
    text: "위치에 따른 날씨 정보 확인 시 활용",
  },
  {
    icon: assets.permissionBell,
    title: "알림",
    text: "서비스 알림, 혜택 알림 수신 시 활용",
  },
];

export default function PermissionPage() {
  const navigate = useNavigate();
  const session = getAuthSession();

  return (
    <PinkPage className="permission-page">
      <div className="permission-dim">
        <header className="permission-header">
          <img src={assets.permissionLogo} alt="Next : Me" />
          <img src={assets.permissionMenu} alt="" />
        </header>
        <p className="permission-background-copy">
          {session?.name || "사용자"}님,
          <br />
          상담을 통해
          <br />
          피부 진단 중심 서비스를 받아보세요
        </p>
      </div>

      <section className="permission-sheet">
        <span className="grabber" />
        <h1>필요한 접근 권한을 알려드려요</h1>
        <p className="caption">선택적 접근 권한</p>

        <div className="permission-list">
          {permissionItems.map((item) => (
            <div className="permission-row" key={item.title}>
              <img src={item.icon} alt="" />
              <div>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="permission-note">
          선택적 접근 권한은 해당 기능을 사용할 때 허용이 필요하며,
          허용하지 않아도 해당 기능 외 서비스 이용이 가능합니다.
        </p>

        <button className="figma-bottom-button permission-confirm" onClick={() => navigate("/profile/basic")}>
          확인
        </button>
      </section>
    </PinkPage>
  );
}
