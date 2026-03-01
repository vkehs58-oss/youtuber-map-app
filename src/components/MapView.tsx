import { useEffect, useRef, useState } from 'react'
import type { Restaurant, Youtuber } from '../types'

declare global {
  interface Window {
    kakao: any
  }
}

interface Props {
  restaurants: Restaurant[]
  youtubers: Youtuber[]
  selectedYoutuber: string | null
  onSelectYoutuber: (id: string) => void
  onSelectRestaurant: (r: Restaurant) => void
}

export default function MapView({ restaurants, youtubers, selectedYoutuber, onSelectYoutuber, onSelectRestaurant }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markers = useRef<any[]>([])
  const [loaded, setLoaded] = useState(false)

  // 카카오맵 SDK 로드
  useEffect(() => {
    if (window.kakao?.maps) {
      setLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=301b016cf5e55960143e982bf2676aac&autoload=false`
    script.onload = () => {
      window.kakao.maps.load(() => setLoaded(true))
    }
    document.head.appendChild(script)
  }, [])

  // 지도 초기화
  useEffect(() => {
    if (!loaded || !mapRef.current) return

    const options = {
      center: new window.kakao.maps.LatLng(37.5565, 126.9780),
      level: 8,
    }

    mapInstance.current = new window.kakao.maps.Map(mapRef.current, options)
  }, [loaded])

  // 마커 업데이트
  useEffect(() => {
    if (!mapInstance.current || !loaded) return

    // 기존 마커 제거
    markers.current.forEach(m => m.setMap(null))
    markers.current = []

    restaurants.forEach(r => {
      const yt = youtubers.find(y => y.name === r.youtuber)
      const position = new window.kakao.maps.LatLng(r.lat, r.lng)

      // 커스텀 마커
      const content = document.createElement('div')
      content.innerHTML = `
        <div style="
          background: ${yt?.color || '#3182f6'};
          color: white;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span>${yt?.emoji || '📍'}</span>
          <span>${r.name}</span>
        </div>
      `

      const overlay = new window.kakao.maps.CustomOverlay({
        position,
        content,
        yAnchor: 1.3,
      })

      overlay.setMap(mapInstance.current)
      markers.current.push(overlay)

      content.onclick = () => onSelectRestaurant(r)
    })

    // 마커가 있으면 바운드 맞추기
    if (restaurants.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds()
      restaurants.forEach(r => bounds.extend(new window.kakao.maps.LatLng(r.lat, r.lng)))
      mapInstance.current.setBounds(bounds, 80, 80, 80, 80)
    }
  }, [restaurants, loaded])

  return (
    <div className="relative">
      {/* 유튜버 필터 (지도 위 오버레이) */}
      <div className="absolute top-3 left-0 right-0 z-10 px-4">
        <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
          {youtubers.map(y => {
            const isActive = selectedYoutuber === y.name
            return (
              <button
                key={y.name}
                onClick={() => onSelectYoutuber(y.name)}
                className={`shrink-0 px-3 py-2 rounded-xl flex items-center gap-1.5 text-[12px] font-bold transition-all shadow-md ${
                  isActive
                    ? 'text-white'
                    : 'bg-white text-toss-gray-700'
                }`}
                style={isActive ? { background: y.color } : {}}
              >
                <span>{y.emoji}</span>
                <span>{y.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 지도 */}
      <div
        ref={mapRef}
        className="w-full"
        style={{ height: 'calc(100vh - 180px)' }}
      />

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-toss-gray-100">
          <div className="text-[14px] text-toss-gray-500">지도 로딩 중...</div>
        </div>
      )}

      {loaded && !selectedYoutuber && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '60px' }}>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg text-center">
            <div className="text-[28px] mb-2">👆</div>
            <div className="text-[14px] font-bold text-toss-gray-800">유튜버를 선택해주세요</div>
            <div className="text-[12px] text-toss-gray-500 mt-1">위 칩을 눌러 맛집을 확인하세요</div>
          </div>
        </div>
      )}
    </div>
  )
}
