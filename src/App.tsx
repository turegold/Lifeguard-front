import { useState, useEffect } from "react";
import EmergencyGuide from "./components/EmergencyGuide";
import { getEmergencyGuidance } from "./services/api";
import type { EmergencyGuidance } from "./types";
import "./App.css";

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

function App() {
  const [symptom, setSymptom] = useState<string>("");
  const [selectedQuickSymptom, setSelectedQuickSymptom] = useState<string>("");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [emergencyGuidance, setEmergencyGuidance] =
    useState<EmergencyGuidance | null>(null);
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);

  // 위치 정보 저장용 (백엔드 전송 준비)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );

  // 페이지 접속 시 자동으로 현재 위치 가져오기
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("이 브라우저는 위치 서비스를 지원하지 않습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        console.log("자동 위치 가져오기 성공:", { lat, lng });

        const location: Location = {
          latitude: lat,
          longitude: lng,
        };

        setSelectedLocation(location);
        console.log("위치 저장 완료:", location);
        console.log("저장 위치: App 컴포넌트의 selectedLocation 상태");
        console.log("위도:", location.latitude, "경도:", location.longitude);


      },
      (error) => {
        console.error("자동 위치 가져오기 실패:", error);
        // 자동으로 가져오기 실패해도 계속 진행
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1분간 캐시 사용
      }
    );
  }, []);

  const quickSymptoms = [
    "가슴이 아파요",
    "호흡이 곤란해요",
    "심한 출혈이 있어요",
    "의식을 잃었어요",
    "골절 의심",
    "화상을 입었어요",
  ];

  const handleQuickSymptomClick = (symptomText: string) => {
    setSelectedQuickSymptom(symptomText);
    setSymptom(symptomText);
  };

  const handleNewSymptom = () => {
    setIsGuideOpen(false);
    setSymptom("");
    setSelectedQuickSymptom("");
    setEmergencyGuidance(null);
    setGuidanceError(null);
  };

  const handleOpenGuide = async () => {
    const emergencyText = symptom || selectedQuickSymptom;

    if (!emergencyText.trim()) {
      alert("증상을 입력해주세요.");
      return;
    }

    setIsLoadingGuidance(true);
    setGuidanceError(null);

    try {
      const guidance = await getEmergencyGuidance(emergencyText);
      setEmergencyGuidance(guidance);
      setIsGuideOpen(true);
    } catch (error) {
      console.error("응급 가이드 로드 실패:", error);
      setGuidanceError(
        error instanceof Error
          ? error.message
          : "응급 가이드를 불러오는데 실패했습니다."
      );
      // 에러가 발생해도 가이드 화면은 열어줌 (기본 정보라도 보여주기 위해)
      setIsGuideOpen(true);
    } finally {
      setIsLoadingGuidance(false);
    }
  };

  // 응급 가이드가 열려있으면 가이드 UI 표시
  if (isGuideOpen) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmergencyGuide
          symptom={symptom || selectedQuickSymptom}
          guidance={emergencyGuidance}
          error={guidanceError}
          userLocation={selectedLocation}
          onClose={() => setIsGuideOpen(false)}
          onNewSymptom={handleNewSymptom}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-4xl mx-auto bg-gray-50">
      {/* 메인 컨텐츠 */}
      <main className="flex-1 px-4 md:px-8 py-8">
        {/* 상단 아이콘 및 제목 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl font-bold">!</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">응급 상황</h1>
          <p className="text-gray-600">현재 상황을 알려주세요</p>
        </div>

        {/* 증상 입력 카드 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-6 shadow-sm">
          <label className="block text-gray-800 font-medium mb-2">
            증상을 입력하세요
          </label>
          <textarea
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            placeholder="의식을 잃었어요"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            rows={4}
          />
        </div>

        {/* 빠른 선택 섹션 */}
        <div className="mb-6">
          <h2 className="text-gray-800 font-medium mb-4">또는 빠른 선택</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickSymptoms.map((symptomText, index) => (
              <button
                key={index}
                onClick={() => handleQuickSymptomClick(symptomText)}
                className={`px-4 py-3 border rounded-lg text-left transition-all ${selectedQuickSymptom === symptomText
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {symptomText}
              </button>
            ))}
          </div>
        </div>

        {/* 응급 가이드 버튼 */}
        <button
          onClick={handleOpenGuide}
          disabled={isLoadingGuidance}
          className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-4 rounded-lg transition-colors ${isLoadingGuidance ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          {isLoadingGuidance
            ? "환자에게 맞는 병원 불러오는 중..."
            : "환자에게 맞는 병원을 불러오기"}
        </button>
      </main>
    </div>
  );
}

export default App;
