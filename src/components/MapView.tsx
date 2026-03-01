import { useEffect, useRef, useState, useCallback } from 'react'
import type { TouchEvent as RE } from 'react'
import type { Restaurant, Youtuber } from '../types'

declare global {
  interface Window {
    kakao: any
  }
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

interface Props {
  allRestaurants: Restaurant[]
  restaurants: Restaurant[]
  youtubers: Youtuber[]
  selectedYoutuber: string | null
  onSelectYoutuber: (id: string) => void
  onSelectRestaurant: (r: Restaurant) => void
}

export default function MapView({ allRestaurants, restaurants, youtubers, selectedYoutuber, onSelectYoutuber, onSelectRestaurant }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markers = useRef<any[]>([])
  const myMarker = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [nearbyMode, setNearbyMode] = useState(false)
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [nearbyList, setNearbyList] = useState<(Restaurant & { distance: number })[]>([])
  // 바텀시트 드래그
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ y: number; h: number } | null>(null)
  const [sheetH, setSheetH] = useState(0) // 0=hidden, px from bottom
  const PEEK = 130, HALF = Math.round(window.innerHeight * 0.45), FULL = Math.round(window.innerHeight * 0.85)

  const snapTo = useCallback((h: number) => {
    // snap to closest: 0, PEEK, HALF, FULL
    const snaps = [0, PEEK, HALF, FULL]
    const closest = snaps.reduce((a, b) => Math.abs(b - h) < Math.abs(a - h) ? b : a)
    setSheetH(closest)
  }, [PEEK, HALF, FULL])

  const onTouchStart = useCallback((e: RE<HTMLDivElement>) => {
    dragStart.current = { y: e.touches[0].clientY, h: sheetH }
  }, [sheetH])

  const onTouchMove = useCallback((e: RE<HTMLDivElement>) => {
    if (!dragStart.current) return
    const dy = dragStart.current.y - e.touches[0].clientY
    const newH = Math.max(0, Math.min(FULL, dragStart.current.h + dy))
    setSheetH(newH)
  }, [FULL])

  const onTouchEnd = useCallback(() => {
    if (!dragStart.current) return
    snapTo(sheetH)
    dragStart.current = null
  }, [sheetH, snapTo])

  // 카카오맵 SDK 로드
  useEffect(() => {
    if (window.kakao?.maps) { setLoaded(true); return }
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=301b016cf5e55960143e982bf2676aac&autoload=false`
    script.onload = () => { window.kakao.maps.load(() => setLoaded(true)) }
    document.head.appendChild(script)
  }, [])

  // 지도 초기화
  useEffect(() => {
    if (!loaded || !mapRef.current) return
    mapInstance.current = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(37.5565, 126.9780),
      level: 8,
    })
  }, [loaded])

  const clearMarkers = useCallback(() => {
    markers.current.forEach(m => m.setMap(null))
    markers.current = []
  }, [])

  const addMarkers = useCallback((list: Restaurant[]) => {
    if (!mapInstance.current || !loaded) return
    clearMarkers()

    list.forEach(r => {
      const yt = youtubers.find(y => y.name === r.youtuber)
      const color = yt?.color || '#3182f6'
      const content = document.createElement('div')
      content.style.cssText = 'position:relative;cursor:pointer'
      content.innerHTML = `
        <div style="width:14px;height:14px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.25)"></div>
        <div class="marker-label" style="display:none;position:absolute;bottom:20px;left:50%;transform:translateX(-50%);background:${color};color:white;padding:5px 10px;border-radius:12px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.15)">
          ${r.name}
        </div>`
      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(r.lat, r.lng),
        content, yAnchor: 0.5,
      })
      overlay.setMap(mapInstance.current)
      markers.current.push(overlay)
      content.onclick = (e) => {
        e.stopPropagation()
        // 다른 라벨 숨기기
        document.querySelectorAll('.marker-label').forEach(el => (el as HTMLElement).style.display = 'none')
        const label = content.querySelector('.marker-label') as HTMLElement
        label.style.display = 'block'
        onSelectRestaurant(r)
      }
    })

    if (list.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds()
      list.forEach(r => bounds.extend(new window.kakao.maps.LatLng(r.lat, r.lng)))
      if (myPos && nearbyMode) bounds.extend(new window.kakao.maps.LatLng(myPos.lat, myPos.lng))
      mapInstance.current.setBounds(bounds, 80, 80, 80, 80)
    }
  }, [loaded, youtubers, onSelectRestaurant, clearMarkers, myPos, nearbyMode])

  // 유튜버 필터 마커
  useEffect(() => {
    if (nearbyMode) return
    addMarkers(restaurants)
  }, [restaurants, nearbyMode, addMarkers])

  // 내 주변 모드
  const handleNearby = useCallback(() => {
    if (nearbyMode) {
      setNearbyMode(false)
      setNearbyList([])
      setSheetH(0)
      if (myMarker.current) { myMarker.current.setMap(null); myMarker.current = null }
      addMarkers(restaurants)
      return
    }

    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setMyPos({ lat, lng })
        setNearbyMode(true)
        setGeoLoading(false)

        // 내 위치 마커
        if (myMarker.current) myMarker.current.setMap(null)
        const el = document.createElement('div')
        el.innerHTML = `<div style="width:18px;height:18px;background:#3182f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(49,130,246,0.4)"></div>`
        myMarker.current = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(lat, lng),
          content: el, yAnchor: 0.5,
        })
        myMarker.current.setMap(mapInstance.current)

        // 가까운 맛집 계산
        const nearby = allRestaurants
          .map(r => ({ ...r, distance: getDistance(lat, lng, r.lat, r.lng) }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 20)
        setNearbyList(nearby)
        setSheetH(PEEK)
        addMarkers(nearby)
      },
      () => { setGeoLoading(false); alert('위치 권한을 허용해주세요') },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [nearbyMode, allRestaurants, restaurants, addMarkers])

  return (
    <div className="relative">
      {/* 상단: 유튜버 필터 + 내 주변 버튼 */}
      <div className="absolute top-3 left-0 right-0 z-10 px-4">
        <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
          {/* 내 주변 버튼 */}
          <button
            onClick={handleNearby}
            className={`shrink-0 px-3 py-2 rounded-xl flex items-center gap-1.5 text-[12px] font-bold transition-all shadow-md ${
              nearbyMode ? 'bg-toss-blue text-white' : 'bg-white text-toss-gray-700'
            }`}
          >
            {geoLoading ? <span className="animate-pulse">⏳</span> : <span>📍</span>}
            <span>내 주변</span>
          </button>

          {!nearbyMode && youtubers.map(y => {
            const isActive = selectedYoutuber === y.name
            return (
              <button
                key={y.name}
                onClick={() => onSelectYoutuber(y.name)}
                className={`shrink-0 px-3 py-2 rounded-xl flex items-center gap-1.5 text-[12px] font-bold transition-all shadow-md ${
                  isActive ? 'text-white' : 'bg-white text-toss-gray-700'
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
      <div ref={mapRef} className="w-full" style={{ height: 'calc(100vh - 180px)' }} />

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-toss-gray-100">
          <div className="text-[14px] text-toss-gray-500">지도 로딩 중...</div>
        </div>
      )}

      {/* 유튜버 미선택 안내 */}
      {loaded && !selectedYoutuber && !nearbyMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '60px' }}>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg text-center">
            <div className="text-[28px] mb-2">👆</div>
            <div className="text-[14px] font-bold text-toss-gray-800">유튜버를 선택해주세요</div>
            <div className="text-[12px] text-toss-gray-500 mt-1">위 칩을 눌러 맛집을 확인하세요</div>
          </div>
        </div>
      )}

      {/* 드래그 바텀시트 */}
      {nearbyMode && nearbyList.length > 0 && (
        <div
          ref={sheetRef}
          className="absolute left-0 right-0 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.12)] z-10 flex flex-col"
          style={{
            bottom: 0,
            height: `${sheetH}px`,
            transition: dragStart.current ? 'none' : 'height 0.3s cubic-bezier(0.25,1,0.5,1)',
          }}
        >
          {/* 드래그 핸들 */}
          <div
            className="pt-2.5 pb-2 px-4 cursor-grab shrink-0"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="w-10 h-1 bg-toss-gray-300 rounded-full mx-auto mb-2" />
            <div className="text-[14px] font-bold text-toss-gray-800">📍 내 주변 맛집 {nearbyList.length}곳</div>
          </div>

          {/* 스크롤 리스트 */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {nearbyList.map(r => {
              const yt = youtubers.find(y => y.name === r.youtuber)
              const distStr = r.distance < 1 ? `${Math.round(r.distance * 1000)}m` : `${r.distance.toFixed(1)}km`
              return (
                <button
                  key={r.id}
                  onClick={() => onSelectRestaurant(r)}
                  className="w-full px-4 py-3 flex items-center gap-3 active:bg-toss-gray-50 border-b border-toss-gray-50 text-left"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0"
                    style={{ background: `${yt?.color || '#3182f6'}15` }}>
                    {yt?.emoji || '📍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-toss-gray-900 truncate">{r.name}</div>
                    <div className="text-[11px] text-toss-gray-500 mt-0.5 truncate">{r.cuisine} · {yt?.name}</div>
                  </div>
                  <div className="text-[13px] font-extrabold text-toss-blue shrink-0">{distStr}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
