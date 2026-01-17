import { useState, useEffect } from "react";
import type {
  EmergencyGuidance,
  HospitalRecommendationResponse,
  RecommendedHospital,
} from "../types";
import { getHospitalRecommendations } from "../services/api";

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface EmergencyGuideProps {
  symptom: string;
  guidance: EmergencyGuidance | null;
  error: string | null;
  userLocation: Location | null;
  onClose: () => void;
  onNewSymptom: () => void;
}

export default function EmergencyGuide({
  symptom,
  guidance,
  error,
  userLocation,
  onClose: _onClose, // 사용하지 않지만 prop으로 받아야 함
  onNewSymptom,
}: EmergencyGuideProps) {
  const [expandedHospital, setExpandedHospital] = useState<number | null>(null);
  const [hospitalRecommendations, setHospitalRecommendations] =
    useState<HospitalRecommendationResponse | null>(null);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [hospitalError, setHospitalError] = useState<string | null>(null);

  // 병원 추천 API 호출
  useEffect(() => {
    if (!symptom || !userLocation) {
      return;
    }

    const fetchHospitals = async () => {
      setIsLoadingHospitals(true);
      setHospitalError(null);

      try {
        const data = await getHospitalRecommendations(symptom, {
          lat: userLocation.latitude,
          lon: userLocation.longitude,
        });
        setHospitalRecommendations(data);
      } catch (err) {
        console.error("병원 추천 API 호출 실패:", err);
        setHospitalError(
          err instanceof Error
            ? err.message
            : "병원 추천 정보를 불러오는데 실패했습니다."
        );
      } finally {
        setIsLoadingHospitals(false);
      }
    };

    fetchHospitals();
  }, [symptom, userLocation]);

  const hospitals: RecommendedHospital[] =
    hospitalRecommendations?.hospitals || [];

  const toggleHospital = (rank: number) => {
    setExpandedHospital(expandedHospital === rank ? null : rank);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-2xl mx-auto px-4 space-y-6 pt-6">
        {/* 1단계: 입력하신 증상 + 긴급 행동 지침 */}
        <div className="space-y-4">
          {/* 입력하신 증상 카드 */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-gray-600 text-sm mb-1">입력하신 증상</p>
            <p className="text-gray-800 font-bold text-lg">
              {symptom || "증상 없음"}
            </p>
          </div>

          {/* API 에러 표시 */}
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
              <p className="text-yellow-800 text-sm">
                ⚠️ 응급 가이드를 불러오는데 실패했습니다: {error}
              </p>
              <p className="text-yellow-700 text-xs mt-1">
                기본 응급 조치 가이드를 표시합니다.
              </p>
            </div>
          )}

          {/* 상황 요약 (API 응답이 있을 경우) */}
          {guidance?.situation_summary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
              <p className="text-blue-900 font-medium text-sm mb-1">
                상황 요약
              </p>
              <p className="text-blue-800 text-sm">
                {guidance.situation_summary}
              </p>
            </div>
          )}

          {/* 긴급 행동 지침 카드 */}
          <div className="bg-red-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-0 h-0 border-l-8 border-r-8 border-b-12 border-l-transparent border-r-transparent border-b-white"></div>
                <span className="text-white font-bold text-xl -mt-2">!</span>
              </div>
              <h2 className="text-white font-bold text-xl">즉시 해야 할 일</h2>
            </div>
            {guidance?.immediate_actions &&
              guidance.immediate_actions.length > 0 ? (
              <ul className="space-y-2">
                {guidance.immediate_actions.map((action, index) => (
                  <li
                    key={index}
                    className="text-white text-sm flex items-start gap-2"
                  >
                    <span className="text-white font-bold">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-white text-center text-sm">
                상황이 심각하다면 즉시 119에 연락하세요
              </p>
            )}
          </div>

          {/* 하지 말아야 할 일 (API 응답이 있을 경우) */}
          {guidance?.do_not_do && guidance.do_not_do.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-orange-900 font-bold text-sm mb-2">
                ⚠️ 하지 말아야 할 일
              </h3>
              <ul className="space-y-1">
                {guidance.do_not_do.map((item, index) => (
                  <li
                    key={index}
                    className="text-orange-800 text-sm flex items-start gap-2"
                  >
                    <span className="text-orange-600 font-bold">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 2단계: 일반 응급 상황 (API 응답이 없을 때만 표시) */}
        {!guidance && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              일반 응급 상황
            </h1>

            {/* 응급 조치 카드 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <p className="text-gray-800 flex-1 pt-1">
                    환자를 안전한 장소로 이동시키세요
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <p className="text-gray-800 flex-1 pt-1">
                    환자의 의식 상태를 확인하세요
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <p className="text-gray-800 flex-1 pt-1">
                    환자를 편안한 자세로 눕히거나 앉히세요
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <p className="text-gray-800 flex-1 pt-1">
                    환자를 따뜻하게 유지하세요
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">5</span>
                  </div>
                  <p className="text-gray-800 flex-1 pt-1">
                    지속적으로 상태를 관찰하세요
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3단계: 추천 병원 */}
        <div>
          {/* 파란색 헤더 */}
          <div className="bg-blue-500 rounded-t-3xl px-4 pt-6 pb-4 mb-4">
            <h1 className="text-2xl font-bold text-white mb-1">추천 병원</h1>
            <p className="text-white text-sm opacity-90">
              환자의 상태와 병원의 상황을 분석하여 병원을 추천합니다.
            </p>
          </div>

          {/* 로딩 상태 */}
          {isLoadingHospitals && (
            <div className="bg-white rounded-lg p-8 mb-4 shadow-sm text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-600">병원 정보를 불러오는 중...</p>
            </div>
          )}

          {/* 에러 상태 */}
          {hospitalError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 shadow-sm">
              <p className="text-yellow-800 text-sm">
                ⚠️ 병원 추천 정보를 불러오는데 실패했습니다: {hospitalError}
              </p>
            </div>
          )}

          {/* 병원 카드들 */}
          {!isLoadingHospitals && hospitals.length > 0 && (
            <div className="space-y-4">
              {hospitals.map((hospital) => (
                <div
                  key={hospital.hospital_id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {hospital.rank}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                          {hospital.hospital_name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <span className="text-red-500">📍</span>
                            <span>{hospital.distance_km.toFixed(2)}km</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>🕐</span>
                            <span>
                              약 {hospital.travel_time_min.toFixed(1)}분
                            </span>
                          </div>
                          {hospital.hospital_phone && (
                            <div className="flex items-center gap-1">
                              <span>📞</span>
                              <span>{hospital.hospital_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 화살표 버튼 */}
                  <button
                    onClick={() => toggleHospital(hospital.rank)}
                    className="w-full py-2 border-t border-gray-200 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium">상세 정보</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${expandedHospital === hospital.rank ? "rotate-180" : ""
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* 확장된 상세 정보 */}
                  {expandedHospital === hospital.rank && (
                    <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                      <div className="pt-4 space-y-4">
                        {/* AI 판단 - 수용 가능 확률 */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-800 mb-3">
                            AI 판단
                          </h4>
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm text-gray-600">
                                수용 가능 확률
                              </span>
                              <span className="text-lg font-bold text-indigo-600">
                                {(hospital.accept_prob * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-indigo-500 h-3 rounded-full transition-all"
                                style={{
                                  width: `${hospital.accept_prob * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* 가용 병상 정보 - 원형 디자인 */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-800 mb-3">
                            가용 병상 현황
                          </h4>
                          <div className="grid grid-cols-3 gap-3">
                            {/* 응급실 병상 */}
                            <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    stroke="#e5e7eb"
                                    strokeWidth="6"
                                    fill="none"
                                  />
                                  <circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    stroke="#3b82f6"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeDasharray={`${(hospital.er_beds /
                                      Math.max(hospital.total_er_beds, 1)) *
                                      226.2
                                      } 226.2`}
                                    className="transition-all"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-2xl font-bold text-blue-600">
                                    {hospital.er_beds}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    병상
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs font-medium text-gray-700">
                                응급실
                              </p>
                            </div>

                            {/* 중환자실 병상 */}
                            <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-2">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    stroke="#e5e7eb"
                                    strokeWidth="6"
                                    fill="none"
                                  />
                                  <circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    stroke="#10b981"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeDasharray={`${(hospital.icu_beds /
                                      Math.max(hospital.total_icu_beds, 1)) *
                                      226.2
                                      } 226.2`}
                                    className="transition-all"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-2xl font-bold text-green-600">
                                    {hospital.icu_beds}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    병상
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs font-medium text-gray-700">
                                중환자실
                              </p>
                            </div>

                            {/* 외상중환자실 병상 */}
                            {hospital.trauma_icu_beds > 0 && (
                              <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-2">
                                  <svg className="w-20 h-20 transform -rotate-90">
                                    <circle
                                      cx="40"
                                      cy="40"
                                      r="36"
                                      stroke="#e5e7eb"
                                      strokeWidth="6"
                                      fill="none"
                                    />
                                    <circle
                                      cx="40"
                                      cy="40"
                                      r="36"
                                      stroke="#ef4444"
                                      strokeWidth="6"
                                      fill="none"
                                      strokeDasharray={`${(hospital.trauma_icu_beds /
                                        Math.max(
                                          hospital.total_icu_beds,
                                          1
                                        )) *
                                        226.2
                                        } 226.2`}
                                      className="transition-all"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-red-600">
                                      {hospital.trauma_icu_beds}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      병상
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs font-medium text-gray-700">
                                  외상중환자실
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 의료 장비 현황 */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-800 mb-3">
                            의료 장비 현황
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg p-3 shadow-sm flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                CT 가능
                              </span>
                              <span
                                className={`text-sm font-semibold ${hospital.ct_available
                                  ? "text-green-600"
                                  : "text-red-600"
                                  }`}
                              >
                                {hospital.ct_available ? "✓ 가능" : "✗ 불가능"}
                              </span>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                인공호흡기
                              </span>
                              <span
                                className={`text-sm font-semibold ${hospital.ventilator_available
                                  ? "text-green-600"
                                  : "text-red-600"
                                  }`}
                              >
                                {hospital.ventilator_available
                                  ? "✓ 가능"
                                  : "✗ 불가능"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 거리 및 이동 시간 */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-800 mb-3">
                            거리 정보
                          </h4>
                          <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                거리
                              </span>
                              <span className="text-sm font-semibold text-gray-800">
                                {hospital.distance_km.toFixed(2)}km
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                예상 이동 시간
                              </span>
                              <span className="text-sm font-semibold text-gray-800">
                                약 {hospital.travel_time_min.toFixed(1)}분
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 병원 정보 */}
                        {hospital.hospital_phone && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-800 mb-3">
                              연락처
                            </h4>
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                              <span className="text-sm text-gray-600">
                                전화번호:{" "}
                              </span>
                              <span className="text-sm font-semibold text-gray-800">
                                {hospital.hospital_phone}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 병원이 없을 때 */}
          {!isLoadingHospitals && hospitals.length === 0 && !hospitalError && (
            <div className="bg-white rounded-lg p-8 shadow-sm text-center">
              <p className="text-gray-600">추천할 병원이 없습니다.</p>
            </div>
          )}
        </div>

        {/* 하단 버튼들 */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={onNewSymptom}
            className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-gray-800 font-medium">
              새로운 증상 입력하기
            </span>
          </button>

          <button className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-white font-bold">?</span>
          </button>
        </div>
      </div>
    </div>
  );
}
