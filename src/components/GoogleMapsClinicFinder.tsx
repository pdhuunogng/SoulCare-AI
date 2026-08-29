import React, { Component, useState, useMemo, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Marker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { OfflineClinic } from '../types';
import { INITIAL_OFFLINE_CLINICS } from '../data/initialData';
import {
  MapPin,
  Star,
  PhoneCall,
  Calendar,
  ExternalLink,
  Navigation,
  Search,
  Filter,
  Sparkles,
  Clock,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
  Building2,
  Info,
  Layers,
  HeartHandshake,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface GoogleMapsClinicFinderProps {
  userSymptoms?: string;
  userQuizRadar?: string;
}

// Error Boundary for Map component to catch Google Maps rendering exceptions
interface MapErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
  onError?: (error: Error) => void;
}

interface MapErrorBoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  public override state: MapErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): MapErrorBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error) {
    console.warn('Google Maps Error Boundary caught:', error);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  public override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Controller component to smoothly pan/zoom map when active location changes
const MapController: React.FC<{
  targetLocation: { lat: number; lng: number } | null;
  zoomLevel?: number;
}> = ({ targetLocation, zoomLevel = 13 }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !targetLocation) return;
    map.panTo(targetLocation);
    if (zoomLevel) {
      map.setZoom(zoomLevel);
    }
  }, [map, targetLocation, zoomLevel]);

  return null;
};

// Haversine distance calculator (in kilometers)
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export type ProcessedOfflineClinic = OfflineClinic & { calculatedDistance: number };

export const GoogleMapsClinicFinder: React.FC<GoogleMapsClinicFinderProps> = ({
  userSymptoms,
  userQuizRadar,
}) => {
  const envApiKey =
    ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_API_KEY) || '';
  const envMapId =
    ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_MAP_ID) || '';

  // Avoid ApiProjectMapError: only pass mapId if explicitly configured or using demo mode without custom key
  const resolvedMapId = envMapId || (!envApiKey ? 'DEMO_MAP_ID' : undefined);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('Tất cả');
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'reviews'>('rating');
  const [onlyEmergency, setOnlyEmergency] = useState(false);

  // Selection & UI states
  const [selectedClinic, setSelectedClinic] = useState<ProcessedOfflineClinic | null>(null);
  const [hoveredClinicId, setHoveredClinicId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [hasMapError, setHasMapError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // AI Recommendation Coordinator state
  const [isAiRecommending, setIsAiRecommending] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [aiHighlightedClinicIds, setAiHighlightedClinicIds] = useState<string[]>([]);

  // Default initial map center (Center of TP.HCM / Vietnam)
  const defaultCenter = useMemo(() => ({ lat: 10.7769, lng: 106.7009 }), []);
  const [mapTarget, setMapTarget] = useState<{ lat: number; lng: number } | null>(defaultCenter);
  const [mapZoom, setMapZoom] = useState<number>(12);

  // Catch Google Maps global auth and project failures
  useEffect(() => {
    const originalAuthFailure = (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
      console.warn('Google Maps API authentication or map project mismatch detected.');
      setHasMapError(true);
      if (originalAuthFailure) originalAuthFailure();
    };

    return () => {
      (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = originalAuthFailure;
    };
  }, []);

  // Handle GPS location detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Đang tìm vị trí GPS của bạn...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: 'Vị trí hiện tại của bạn',
        };
        setUserLocation(coords);
        setMapTarget(coords);
        setMapZoom(14);
        setIsLocating(false);
        setLocationStatus('Đã xác định vị trí của bạn thành công!');
        setSortBy('distance');
        setTimeout(() => setLocationStatus(null), 4000);
      },
      (err) => {
        setIsLocating(false);
        // Fallback default coordinates (District 1, HCMC)
        const fallback = { lat: 10.7756, lng: 106.7004, address: 'TP. Hồ Chí Minh (Mặc định)' };
        setUserLocation(fallback);
        setMapTarget(fallback);
        setLocationStatus('Không lấy được GPS tự động. Đã chuyển về vị trí trung tâm TP.HCM.');
        setTimeout(() => setLocationStatus(null), 4000);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Compute clinics list with live distance calculations and filtering
  const processedClinics = useMemo(() => {
    let list = INITIAL_OFFLINE_CLINICS.map((clinic) => {
      let dynamicDistance = clinic.distanceKm;
      if (userLocation) {
        dynamicDistance = calculateDistanceKm(
          userLocation.lat,
          userLocation.lng,
          clinic.lat,
          clinic.lng
        );
      }
      return {
        ...clinic,
        calculatedDistance: dynamicDistance,
      };
    });

    // Filter by City
    if (selectedCity !== 'Tất cả') {
      list = list.filter((c) => c.city.toLowerCase().includes(selectedCity.toLowerCase()));
    }

    // Filter by Emergency
    if (onlyEmergency) {
      list = list.filter((c) => c.isEmergencyAvailable);
    }

    // Search query filter (name, address, tags, departments)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.departments?.some((d) => d.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'rating') {
        // Primary: rating desc, secondary: reviewCount desc
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviewCount - a.reviewCount;
      }
      if (sortBy === 'distance') {
        return a.calculatedDistance - b.calculatedDistance;
      }
      if (sortBy === 'reviews') {
        return b.reviewCount - a.reviewCount;
      }
      return 0;
    });

    return list;
  }, [selectedCity, onlyEmergency, searchQuery, sortBy, userLocation]);

  // Request AI Recommendation from server
  const handleGetAiRecommendation = async () => {
    setIsAiRecommending(true);
    try {
      const res = await fetch('/api/clinics/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userLocation: userLocation || { lat: 10.7769, lng: 106.7009 },
          userCity: selectedCity !== 'Tất cả' ? selectedCity : 'TP. Hồ Chí Minh',
          userSymptoms: userSymptoms || 'Căng thẳng, áp lực giấc ngủ, cần khám chuyên khoa uy tín',
          userQuizRadar: userQuizRadar || 'Lo âu 65%, Căng thẳng 70%, Giấc ngủ 80%',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.recommended_clinics && data.recommended_clinics.length > 0) {
          const topClinic = data.recommended_clinics[0];
          setAiRecommendation(
            `🤖 AI Đề xuất: ${topClinic.name} (${topClinic.rating}⭐) - ${topClinic.ai_recommendation_reason}`
          );

          // Find match in our processed clinics to focus and highlight
          const matched = processedClinics.find(
            (c) =>
              c.name.toLowerCase().includes(topClinic.name.toLowerCase().slice(0, 15)) ||
              topClinic.name.toLowerCase().includes(c.name.toLowerCase().slice(0, 15))
          );
          if (matched) {
            setSelectedClinic(matched);
            setMapTarget({ lat: matched.lat, lng: matched.lng });
            setMapZoom(15);
            setAiHighlightedClinicIds([matched.id]);
          }
        }
      }
    } catch (err) {
      console.error('AI Clinic Recommend failed:', err);
    } finally {
      setIsAiRecommending(false);
    }
  };

  const cities = ['Tất cả', 'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Đồng Nai'];

  return (
    <div className="space-y-4 font-sans text-[#181d16]" id="google-maps-clinic-finder">
      {/* Header Info & Location Trigger */}
      <div className="p-4 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-[#e0f5ea] flex items-center justify-center text-[#006e22] shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#181d16] flex items-center gap-1.5">
                Bản Đồ Phòng Khám Trực Tiếp
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e0f5ea] text-[#006e22] font-semibold">
                  Google Maps
                </span>
              </h3>
              <p className="text-[11px] text-[#6f7a6c]">
                Tìm kiếm bệnh viện & phòng khám tâm lý uy tín theo đánh giá & vị trí
              </p>
            </div>
          </div>

          {/* GPS Locate Button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isLocating}
            className="px-3 py-2 rounded-2xl bg-[#f0f5ea] hover:bg-[#e0f5ea] text-[#006e22] text-xs font-bold transition flex items-center gap-1.5 border border-[#67c76c]/30 shadow-2xs shrink-0"
            title="Định vị vị trí GPS của tôi"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Vị trí của tôi</span>
          </button>
        </div>

        {/* Location Status Toast */}
        {locationStatus && (
          <div className="p-2.5 rounded-2xl bg-[#e0f5ea] border border-[#67c76c]/40 text-xs text-[#005116] flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#006e22] shrink-0" />
            <span>{locationStatus}</span>
          </div>
        )}

        {/* AI Clinic Assistant Trigger */}
        <div className="p-3 rounded-2xl bg-linear-to-r from-[#e0f5ea] to-[#f4faf2] border border-[#67c76c]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-[#006e22] shrink-0" />
            <div className="truncate">
              <span className="text-xs font-bold text-[#006e22] block truncate">
                AI Điều Phối Y Khoa SoulCare
              </span>
              <span className="text-[11px] text-[#4f5c4c] block truncate">
                Gợi ý cơ sở y tế phù hợp nhất theo trắc nghiệm & triệu chứng của bạn
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGetAiRecommendation}
            disabled={isAiRecommending}
            className="px-3 py-1.5 rounded-xl bg-[#006e22] hover:bg-[#005116] text-white text-xs font-bold transition shrink-0 shadow-2xs flex items-center gap-1"
          >
            {isAiRecommending ? 'Đang phân tích...' : '🤖 AI Gợi Ý'}
          </button>
        </div>

        {aiRecommendation && (
          <div className="p-3 rounded-2xl bg-[#f0f9f3] border border-[#006e22]/30 text-xs text-[#005116] space-y-1 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1 text-[#006e22]">
                <Sparkles className="w-3.5 h-3.5" /> Gợi Ý Cá Nhân Hóa Từ AI:
              </span>
              <button
                type="button"
                onClick={() => setAiRecommendation(null)}
                className="text-[11px] text-[#6f7a6c] hover:text-[#181d16]"
              >
                ✕ Đóng
              </button>
            </div>
            <p className="leading-relaxed">{aiRecommendation}</p>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#6f7a6c] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên phòng khám, địa chỉ, chuyên khoa (#TrầmCảm, #CBT, #BHYT)..."
            className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] text-xs text-[#181d16] placeholder-[#6f7a6c]/60 focus:outline-none focus:ring-2 focus:ring-[#006e22]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6f7a6c] hover:text-[#181d16]"
            >
              ✕
            </button>
          )}
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                setSelectedCity(city);
                if (city === 'TP. Hồ Chí Minh') {
                  setMapTarget({ lat: 10.7769, lng: 106.7009 });
                  setMapZoom(12);
                } else if (city === 'Hà Nội') {
                  setMapTarget({ lat: 21.0095, lng: 105.835 });
                  setMapZoom(12);
                } else if (city === 'Đà Nẵng') {
                  setMapTarget({ lat: 16.0544, lng: 108.18 });
                  setMapZoom(12);
                } else if (city === 'Cần Thơ') {
                  setMapTarget({ lat: 10.0452, lng: 105.7469 });
                  setMapZoom(12);
                } else if (city === 'Đồng Nai') {
                  setMapTarget({ lat: 10.9639, lng: 106.8294 });
                  setMapZoom(12);
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedCity === city
                  ? 'bg-[#006e22] text-white shadow-2xs'
                  : 'bg-[#f0f5ea] text-[#3f4a3d] hover:bg-[#e0f5ea]'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Sorting & Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#dfe4d9] text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-[#6f7a6c] flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Sắp xếp:
            </span>
            <button
              type="button"
              onClick={() => setSortBy('rating')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                sortBy === 'rating'
                  ? 'bg-[#006e22] text-white'
                  : 'bg-[#f7faf8] text-[#3f4a3d] hover:bg-[#e0f5ea]'
              }`}
            >
              <Star className="w-3 h-3 text-amber-300" />
              <span>Đánh giá cao nhất</span>
            </button>

            <button
              type="button"
              onClick={() => setSortBy('distance')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                sortBy === 'distance'
                  ? 'bg-[#006e22] text-white'
                  : 'bg-[#f7faf8] text-[#3f4a3d] hover:bg-[#e0f5ea]'
              }`}
            >
              <Navigation className="w-3 h-3" />
              <span>Vị trí gần nhất</span>
            </button>

            <button
              type="button"
              onClick={() => setSortBy('reviews')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                sortBy === 'reviews'
                  ? 'bg-[#006e22] text-white'
                  : 'bg-[#f7faf8] text-[#3f4a3d] hover:bg-[#e0f5ea]'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Nhiều đánh giá</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#f0f5ea] p-0.5 rounded-xl border border-[#dfe4d9]">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                viewMode === 'split' ? 'bg-[#ffffff] text-[#006e22] shadow-2xs' : 'text-[#6f7a6c]'
              }`}
            >
              Bản đồ + DS
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                viewMode === 'map' ? 'bg-[#ffffff] text-[#006e22] shadow-2xs' : 'text-[#6f7a6c]'
              }`}
            >
              Bản đồ
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                viewMode === 'list' ? 'bg-[#ffffff] text-[#006e22] shadow-2xs' : 'text-[#6f7a6c]'
              }`}
            >
              Danh sách
            </button>
          </div>
        </div>
      </div>

      {/* MAP VIEW CONTAINER */}
      {(viewMode === 'split' || viewMode === 'map') && (
        <div className="relative rounded-3xl overflow-hidden border border-[#dfe4d9] shadow-sm bg-[#e8eee6] z-0">
          <div style={{ width: '100%', height: viewMode === 'map' ? '460px' : '320px' }}>
            {hasMapError ? (
              /* Resilient Interactive Fallback Map Visualizer */
              <div className="w-full h-full p-4 bg-linear-to-b from-[#f4faf2] via-[#ffffff] to-[#e8eee6] flex flex-col justify-between overflow-y-auto">
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#ffffff] border border-[#67c76c]/30 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#e0f5ea] flex items-center justify-center text-[#006e22] shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#181d16]">Bản Đồ Định Vị Phòng Khám SoulCare</p>
                      <p className="text-[10px] text-[#6f7a6c]">Tọa độ định vị & liên kết điều hướng Google Maps trực tiếp</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHasMapError(false);
                      setRetryCount((c) => c + 1);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-[#f0f5ea] hover:bg-[#e0f5ea] text-[#006e22] text-[11px] font-bold transition flex items-center gap-1 border border-[#67c76c]/30"
                    title="Tải lại bản đồ tương tác"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Tải lại</span>
                  </button>
                </div>

                {/* Visual Location Radar Pinboard */}
                <div className="my-2 p-3 rounded-2xl bg-[#f7faf8] border border-[#dfe4d9] grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {processedClinics.slice(0, 6).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedClinic(c);
                        setMapTarget({ lat: c.lat, lng: c.lng });
                      }}
                      className={`p-2 rounded-xl text-left border transition shadow-2xs ${
                        selectedClinic?.id === c.id
                          ? 'bg-[#006e22] text-white border-[#005116]'
                          : 'bg-[#ffffff] text-[#181d16] border-[#dfe4d9] hover:border-[#006e22]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="truncate">{c.name.split(' ')[0]} {c.name.split(' ')[1] || ''}</span>
                        <span className={selectedClinic?.id === c.id ? 'text-yellow-300' : 'text-amber-500'}>
                          ⭐ {c.rating}
                        </span>
                      </div>
                      <p className={`text-[10px] truncate mt-0.5 ${selectedClinic?.id === c.id ? 'text-emerald-100' : 'text-[#6f7a6c]'}`}>
                        📍 {c.district}, {c.city} ({c.calculatedDistance}km)
                      </p>
                    </button>
                  ))}
                </div>

                {/* Selected Clinic Fast-Action Bar */}
                {selectedClinic ? (
                  <div className="p-3 rounded-2xl bg-[#ffffff] border border-[#006e22]/40 shadow-xs flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#181d16] truncate">{selectedClinic.name}</p>
                      <p className="text-[10px] text-[#6f7a6c] truncate">{selectedClinic.address}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={selectedClinic.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-[#006e22] text-white text-xs font-bold transition hover:bg-[#005116] flex items-center gap-1 shadow-2xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Mở Google Maps</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-[11px] text-[#6f7a6c]">
                    Chọn một cơ sở y tế bên trên để xem vị trí và mở chỉ đường
                  </div>
                )}
              </div>
            ) : (
              <MapErrorBoundary
                fallback={
                  <div className="w-full h-full p-6 bg-[#f7faf8] flex flex-col items-center justify-center text-center space-y-2">
                    <MapPin className="w-8 h-8 text-[#006e22]" />
                    <p className="text-xs font-bold text-[#181d16]">Định vị Google Maps</p>
                    <p className="text-[11px] text-[#6f7a6c]">Vui lòng mở trực tiếp trên Google Maps hoặc xem danh sách bên dưới.</p>
                  </div>
                }
                onError={() => setHasMapError(true)}
              >
                <APIProvider
                  key={retryCount}
                  apiKey={envApiKey}
                  onLoad={() => setHasMapError(false)}
                  onError={(err) => {
                    console.warn('Google Maps API provider error:', err);
                    setHasMapError(true);
                  }}
                >
                  <Map
                    mapId={resolvedMapId}
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    defaultCenter={defaultCenter}
                    defaultZoom={mapZoom}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <MapController targetLocation={mapTarget} zoomLevel={mapZoom} />

                    {/* User Current GPS Location Marker */}
                    {userLocation &&
                      (resolvedMapId ? (
                        <AdvancedMarker
                          position={{ lat: userLocation.lat, lng: userLocation.lng }}
                          title="Vị trí của bạn"
                        >
                          <div className="relative flex items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-sky-400 opacity-75"></span>
                            <div className="w-7 h-7 rounded-full bg-sky-500 text-white border-2 border-white shadow-lg flex items-center justify-center font-bold text-xs">
                              📍
                            </div>
                          </div>
                        </AdvancedMarker>
                      ) : (
                        <Marker
                          position={{ lat: userLocation.lat, lng: userLocation.lng }}
                          title="Vị trí của bạn"
                        />
                      ))}

                    {/* Clinic Markers */}
                    {processedClinics.map((clinic) => {
                      const isSelected = selectedClinic?.id === clinic.id;
                      const isHighlighted = aiHighlightedClinicIds.includes(clinic.id);
                      const isHovered = hoveredClinicId === clinic.id;

                      if (resolvedMapId) {
                        return (
                          <AdvancedMarker
                            key={clinic.id}
                            position={{ lat: clinic.lat, lng: clinic.lng }}
                            title={clinic.name}
                            onClick={() => {
                              setSelectedClinic(clinic);
                              setMapTarget({ lat: clinic.lat, lng: clinic.lng });
                            }}
                          >
                            <div
                              className={`cursor-pointer transition-all duration-200 transform ${
                                isSelected || isHighlighted
                                  ? 'scale-115 z-30'
                                  : isHovered
                                  ? 'scale-110 z-20'
                                  : 'scale-100 z-10'
                              }`}
                            >
                              <div
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-md border-2 ${
                                  isSelected || isHighlighted
                                    ? 'bg-[#006e22] text-white border-yellow-300 ring-2 ring-[#006e22]/50'
                                    : 'bg-[#ffffff] text-[#181d16] border-[#006e22]'
                                }`}
                              >
                                <span className="text-amber-400">⭐</span>
                                <span>{clinic.rating}</span>
                                <span className="text-[10px] opacity-80">({clinic.calculatedDistance}km)</span>
                              </div>
                            </div>
                          </AdvancedMarker>
                        );
                      }

                      return (
                        <Marker
                          key={clinic.id}
                          position={{ lat: clinic.lat, lng: clinic.lng }}
                          title={`${clinic.name} (${clinic.rating}⭐)`}
                          onClick={() => {
                            setSelectedClinic(clinic);
                            setMapTarget({ lat: clinic.lat, lng: clinic.lng });
                          }}
                        />
                      );
                    })}

                    {/* Selected Clinic InfoWindow */}
                    {selectedClinic && (
                      <InfoWindow
                        position={{ lat: selectedClinic.lat, lng: selectedClinic.lng }}
                        onCloseClick={() => setSelectedClinic(null)}
                      >
                        <div className="p-1 max-w-[260px] text-[#181d16] font-sans space-y-2">
                          <div className="flex gap-2">
                            <img
                              src={selectedClinic.image}
                              alt={selectedClinic.name}
                              className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold leading-tight line-clamp-2">
                                {selectedClinic.name}
                              </h4>
                              <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-0.5">
                                <span>⭐ {selectedClinic.rating}</span>
                                <span className="text-slate-400">({selectedClinic.reviewCount} đánh giá)</span>
                              </div>
                              <p className="text-[10px] text-[#006e22] font-semibold">
                                📍 Cách bạn {selectedClinic.calculatedDistance} km
                              </p>
                            </div>
                          </div>

                          <p className="text-[10px] text-slate-600 line-clamp-2">
                            {selectedClinic.address}
                          </p>

                          {selectedClinic.openHours && (
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#006e22]" />
                              <span>{selectedClinic.openHours}</span>
                            </p>
                          )}

                          {/* Quick Action Links */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                            {selectedClinic.phone && (
                              <a
                                href={`tel:${selectedClinic.phone.replace(/\s+/g, '')}`}
                                className="py-1.5 px-2 rounded-lg bg-[#e0f5ea] text-[#006e22] text-[11px] font-bold flex items-center justify-center gap-1 transition hover:bg-[#006e22] hover:text-white"
                              >
                                <PhoneCall className="w-3 h-3" />
                                <span>Gọi ngay</span>
                              </a>
                            )}

                            <a
                              href={selectedClinic.bookingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1.5 px-2 rounded-lg bg-[#006e22] text-white text-[11px] font-bold flex items-center justify-center gap-1 transition hover:bg-[#005116]"
                            >
                              <Calendar className="w-3 h-3" />
                              <span>Đặt khám</span>
                            </a>
                          </div>
                        </div>
                      </InfoWindow>
                    )}
                  </Map>
                </APIProvider>
              </MapErrorBoundary>
            )}
          </div>

          {/* Map Overlay Badge */}
          <div className="absolute bottom-2 left-2 bg-[#ffffff]/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-[#006e22] border border-[#dfe4d9] shadow-2xs flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#006e22]" />
            <span>Hiển thị {processedClinics.length} cơ sở phù hợp</span>
          </div>
        </div>
      )}

      {/* CLINIC LIST VIEW */}
      {(viewMode === 'split' || viewMode === 'list') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[#6f7a6c] px-1">
            <span>
              DANH SÁCH CƠ SỞ Y TẾ ({processedClinics.length})
            </span>
            <span className="text-[11px] text-[#006e22]">
              {sortBy === 'rating' ? 'Đang ưu tiên theo Đánh giá ⭐' : 'Đang ưu tiên theo Vị trí gần nhất 📍'}
            </span>
          </div>

          {processedClinics.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#ffffff] border border-[#dfe4d9] text-center space-y-2">
              <Building2 className="w-8 h-8 text-[#6f7a6c] mx-auto opacity-50" />
              <p className="text-xs font-bold text-[#181d16]">Không tìm thấy phòng khám nào phù hợp</p>
              <p className="text-[11px] text-[#6f7a6c]">
                Hãy thử đổi từ khóa tìm kiếm hoặc chọn thành phố khác.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('Tất cả');
                  setOnlyEmergency(false);
                }}
                className="px-4 py-2 rounded-full bg-[#006e22] text-white text-xs font-bold shadow-2xs mt-2"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {processedClinics.map((clinic) => {
                const isSelected = selectedClinic?.id === clinic.id;
                const isAiPick = aiHighlightedClinicIds.includes(clinic.id);

                return (
                  <div
                    key={clinic.id}
                    onMouseEnter={() => setHoveredClinicId(clinic.id)}
                    onMouseLeave={() => setHoveredClinicId(null)}
                    onClick={() => {
                      setSelectedClinic(clinic);
                      setMapTarget({ lat: clinic.lat, lng: clinic.lng });
                      setMapZoom(15);
                    }}
                    className={`p-4 rounded-3xl bg-[#ffffff] border transition-all cursor-pointer space-y-3 shadow-2xs ${
                      isSelected
                        ? 'border-[#006e22] ring-2 ring-[#006e22]/20 bg-[#f9fcf9]'
                        : isAiPick
                        ? 'border-yellow-400 bg-yellow-50/20'
                        : 'border-[#dfe4d9] hover:border-[#67c76c]'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex gap-3.5">
                      <img
                        src={clinic.image}
                        alt={clinic.name}
                        className="w-20 h-20 rounded-2xl object-cover shrink-0 ring-1 ring-[#dfe4d9]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-[#006e22] px-2 py-0.5 rounded-full bg-[#e0f5ea]">
                              📍 Cách {clinic.calculatedDistance} km
                            </span>
                            {clinic.isEmergencyAvailable && (
                              <span className="text-[10px] font-bold text-rose-700 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">
                                Cấp cứu 24/7
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                            ⭐ {clinic.rating} <span className="text-[11px] text-[#6f7a6c] font-normal">({clinic.reviewCount})</span>
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-[#181d16] mt-1 leading-snug">
                          {clinic.name}
                        </h4>
                        <p className="text-[11px] text-[#6f7a6c] truncate mt-0.5">
                          {clinic.address}
                        </p>

                        {clinic.openHours && (
                          <p className="text-[10px] text-[#4f5c4c] flex items-center gap-1 mt-1 font-medium">
                            <Clock className="w-3 h-3 text-[#006e22]" />
                            <span>{clinic.openHours}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* AI Recommendation Highlight */}
                    {clinic.aiRecommendationReason && (
                      <div className="p-2.5 rounded-2xl bg-[#f0f9f3] border border-[#67c76c]/30 text-[11px] text-[#005116] flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#006e22] shrink-0 mt-0.5" />
                        <span className="leading-tight">
                          <strong>Đánh giá AI:</strong> {clinic.aiRecommendationReason}
                        </span>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {clinic.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-[#f0f5ea] text-[#006e22] px-2 py-0.5 rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {clinic.priceEstimate && (
                        <span className="text-[10px] bg-slate-100 text-[#3f4a3d] px-2 py-0.5 rounded-full font-medium">
                          💰 {clinic.priceEstimate}
                        </span>
                      )}
                    </div>

                    {/* Contact & Booking Actions Bar */}
                    <div
                      className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#dfe4d9]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Phone Direct Call */}
                      {clinic.phone && (
                        <a
                          href={`tel:${clinic.phone.replace(/\s+/g, '')}`}
                          className="py-2.5 px-2 rounded-xl bg-[#f7faf8] hover:bg-[#e0f5ea] border border-[#dfe4d9] text-xs font-bold text-[#181d16] flex items-center justify-center gap-1.5 transition group shadow-2xs"
                          title={`Gọi ngay ${clinic.name}`}
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-[#006e22] group-hover:scale-110 transition" />
                          <span className="font-mono text-[11px]">{clinic.phone}</span>
                        </a>
                      )}

                      {/* Google Maps Directions */}
                      <a
                        href={clinic.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-2 rounded-xl bg-[#f7faf8] hover:bg-slate-100 border border-[#dfe4d9] text-xs font-semibold text-[#181d16] flex items-center justify-center gap-1.5 transition shadow-2xs"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#006e22]" />
                        <span>Chỉ đường</span>
                      </a>

                      {/* Online Appointment Booking */}
                      <a
                        href={clinic.bookingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-2 rounded-xl bg-[#006e22] hover:bg-[#005116] text-xs font-bold text-white flex items-center justify-center gap-1.5 transition shadow-sm"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Đặt khám</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
