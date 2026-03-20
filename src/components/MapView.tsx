import { useEffect, useRef, useState, useCallback } from 'react'
import type { TouchEvent as RE, MouseEvent as ME } from 'react'
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
  const clusterer = useRef<any>(null)
  const myMarker = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const [nearbyMode, setNearbyMode] = useState(false)
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [nearbyList, setNearbyList] = useState<(Restaurant & { distance: number })[]>([])
  const [showSearchHere, setShowSearchHere] = useState(false)
  const [areaResults, setAreaResults] = useState<Restaurant[]>([])
  const dragStart = useRef<{ y: number; h: number } | null>(null)
  const mouseDragStart = useRef<{ y: number; h: number } | null>(null)
  const [sheetH, setSheetH] = useState(0)
  const PEEK = 130, HALF = Math.round(window.innerHeight * 0.45), FULL = Math.round(window.innerHeight * 0.85)

  const snapTo = useCallback((h: number) => {
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

  // 14. 마우스 드래그 지원
  const onMouseDown = useCallback((e: ME<HTMLDivElement>) => {
    mouseDragStart.current = { y: e.clientY, h: sheetH }
    e.preventDefault()
  }, [sheetH])

  const onMouseMove = useCallback((e: ME<HTMLDivElement>) => {
    if (!mouseDragStart.current) return
    const dy = mouseDragStart.current.y - e.clientY
    const newH = Math.max(0, Math.min(FULL, mouseDragStart.current.h + dy))
    setSheetH(newH)
  }, [FULL])

  const onMouseUp = useCallback(() => {
    if (!mouseDragStart.current) return
    snapTo(sheetH)
    mouseDragStart.current = null
  }, [sheetH, snapTo])

  // 카카오맵 SDK 로드 대기 (index.html에서 자동 초기화)
  useEffect(() => {
    const info = `URL: ${window.location.href} | origin: ${window.location.origin} | referrer: ${document.referrer || '없음'}`
    setDebugInfo(info)
    const check = () => {
      if (window.kakao?.maps) {
        setLoaded(true)
      } else {
        setTimeout(check, 200)
      }
    }
    check()
  }, [])

  // 지도 초기화
  useEffect(() => {
    if (!loaded || !mapRef.current) return
    const map = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(37.5565, 126.9780),
      level: 8,
    })
    mapInstance.current = map

    // 지도 이동 시 '현 지도에서 검색' 버튼 표시
    window.kakao.maps.event.addListener(map, 'dragend', () => {
      if (!nearbyMode) setShowSearchHere(true)
    })
    window.kakao.maps.event.addListener(map, 'zoom_changed', () => {
      if (!nearbyMode) setShowSearchHere(true)
    })
  }, [loaded])

  const clearMarkers = useCallback(() => {
    markers.current.forEach(m => m.setMap(null))
    markers.current = []
    if (clusterer.current) {
      clusterer.current.clear()
    }
  }, [])

  const addMarkers = useCallback((list: Restaurant[], useCluster = false) => {
    if (!mapInstance.current || !loaded) return
    clearMarkers()

    if (useCluster && list.length > 10) {
      // 클러스터링 사용
      const kakaoMarkers = list.map(r => {
        const yt = youtubers.find(y => y.name === r.youtuber)
        const color = yt?.color || '#3182f6'
        const content = document.createElement('div')
        content.style.cssText = 'position:relative;cursor:pointer'
        content.innerHTML = `
          <div style="width:14px;height:14px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.25)"></div>
          <div class="marker-label" style="display:none;position:absolute;bottom:20px;left:50%;transform:translateX(-50%);background:${color};color:white;padding:5px 10px;border-radius:12px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.15)">
            ${r.name}
          </div>`
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(r.lat, r.lng),
        })
        // Custom overlay for label
        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(r.lat, r.lng),
          content, yAnchor: 0.5,
        })
        overlay.setMap(mapInstance.current)
        markers.current.push(overlay)
        content.onclick = (e) => {
          e.stopPropagation()
          document.querySelectorAll('.marker-label').forEach(el => (el as HTMLElement).style.display = 'none')
          const label = content.querySelector('.marker-label') as HTMLElement
          label.style.display = 'block'
          onSelectRestaurant(r)
        }
        return marker
      })

      if (!clusterer.current) {
        clusterer.current = new window.kakao.maps.MarkerClusterer({
          map: mapInstance.current,
          averageCenter: true,
          minLevel: 5,
          styles: [{
            width: '44px', height: '44px',
            background: 'rgba(49, 130, 246, 0.85)',
            borderRadius: '50%',
            color: '#fff',
            textAlign: 'center',
            fontWeight: '700',
            lineHeight: '44px',
            fontSize: '14px',
            border: '3px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }]
        })
      }
      clusterer.current.addMarkers(kakaoMarkers)
    } else {
      // 기존 방식 (CustomOverlay)
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
          document.querySelectorAll('.marker-label').forEach(el => (el as HTMLElement).style.display = 'none')
          const label = content.querySelector('.marker-label') as HTMLElement
          label.style.display = 'block'
          onSelectRestaurant(r)
        }
      })
    }

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
    setShowSearchHere(false)
    setAreaResults([])
  }, [restaurants, nearbyMode, addMarkers])

  // 현 지도에서 검색
  const handleSearchHere = useCallback(() => {
    if (!mapInstance.current) return
    const bounds = mapInstance.current.getBounds()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    const inBounds = allRestaurants.filter(r =>
      r.lat >= sw.getLat() && r.lat <= ne.getLat() &&
      r.lng >= sw.getLng() && r.lng <= ne.getLng()
    )
    setAreaResults(inBounds)
    addMarkers(inBounds, true)
    setShowSearchHere(false)
    if (inBounds.length > 0) setSheetH(PEEK)
  }, [allRestaurants, addMarkers, PEEK])

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
        setShowSearchHere(false)
        setAreaResults([])

        if (myMarker.current) myMarker.current.setMap(null)
        const el = document.createElement('div')
        el.innerHTML = `<div style="width:18px;height:18px;background:#3182f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(49,130,246,0.4)"></div>`
        myMarker.current = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(lat, lng),
          content: el, yAnchor: 0.5,
        })
        myMarker.current.setMap(mapInstance.current)

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

  // 바텀시트에 표시할 리스트
  const sheetList = nearbyMode ? nearbyList : areaResults

  return (
    <div className="relative">
      {/* 상단: 유튜버 필터 + 내 주변 버튼 */}
      <div className="absolute top-3 left-0 right-0 z-10 px-4">
        <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
          <button
            onClick={handleNearby}
            className={`shrink-0 px-3.5 py-2 rounded-full flex items-center gap-1.5 text-[12px] font-bold transition-all shadow-md ${
              nearbyMode ? 'bg-toss-blue text-white ring-2 ring-toss-blue/30' : 'bg-white text-toss-gray-700'
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
                className={`shrink-0 px-3.5 py-2 rounded-full flex items-center gap-1.5 text-[12px] font-bold transition-all shadow-md ${
                  isActive
                    ? 'text-white ring-2 ring-offset-1'
                    : 'bg-white text-toss-gray-700 hover:bg-toss-gray-50'
                }`}
                style={isActive ? { background: y.color, boxShadow: `0 2px 8px ${y.color}40, 0 0 0 2px white, 0 0 0 4px ${y.color}50` } : {}}
              >
                <span>{y.emoji}</span>
                <span>{y.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 현 지도에서 검색 버튼 */}
      {showSearchHere && !nearbyMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 animate-fade-slide">
          <button
            onClick={handleSearchHere}
            className="px-4 py-2.5 bg-white rounded-full shadow-lg text-[13px] font-bold text-toss-blue flex items-center gap-1.5 active:bg-toss-gray-50 border border-toss-gray-200"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            현 지도에서 검색
          </button>
        </div>
      )}

      {/* 지도 - 4/11. dvh + css var + safe area */}
      <div ref={mapRef} className="w-full" style={{ height: 'calc(100dvh - var(--header-h, 180px) - env(safe-area-inset-bottom))' }} />

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-toss-gray-100">
          <div className="flex flex-col items-center gap-3">
            <div className="skeleton w-12 h-12 rounded-full" />
            <div className="text-[14px] text-toss-gray-500">지도 로딩 중...</div>
            <div className="text-[10px] text-red-400 mt-2 px-4 break-all">{debugInfo}</div>
          </div>
        </div>
      )}

      {/* 유튜버 미선택 안내 */}
      {loaded && !selectedYoutuber && !nearbyMode && areaResults.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '60px' }}>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg text-center">
            <div className="text-[28px] mb-2">👆</div>
            <div className="text-[14px] font-bold text-toss-gray-800">유튜버를 선택해주세요</div>
            <div className="text-[12px] text-toss-gray-500 mt-1">위 칩을 눌러 맛집을 확인하세요</div>
          </div>
        </div>
      )}

      {/* 드래그 바텀시트 */}
      {sheetList.length > 0 && sheetH > 0 && (
        <div
          className="absolute left-0 right-0 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.12)] z-10 flex flex-col"
          style={{
            bottom: 0,
            height: `${sheetH}px`,
            transition: dragStart.current ? 'none' : 'height 0.3s cubic-bezier(0.25,1,0.5,1)',
          }}
        >
          <div
            className="pt-2.5 pb-2 px-4 cursor-grab shrink-0 select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <div className="w-10 h-1 bg-toss-gray-300 rounded-full mx-auto mb-2" />
            <div className="text-[14px] font-bold text-toss-gray-800">
              {nearbyMode ? `📍 내 주변 맛집 ${nearbyList.length}곳` : `🔍 이 지역 맛집 ${areaResults.length}곳`}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {sheetList.map(r => {
              const yt = youtubers.find(y => y.name === r.youtuber)
              const distStr = 'distance' in r
                ? (r as any).distance < 1
                  ? `${Math.round((r as any).distance * 1000)}m`
                  : `${(r as any).distance.toFixed(1)}km`
                : r.location
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
