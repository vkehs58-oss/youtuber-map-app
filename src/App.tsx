import { useState, useMemo } from 'react'
import data from './data/restaurants.json'
import type { AppData, Restaurant } from './types'
import RestaurantDetail from './components/RestaurantDetail'
import MapView from './components/MapView'

const appData = data as AppData
type Tab = 'home' | 'map'

function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [expandedYoutuber, setExpandedYoutuber] = useState<string | null>(null)
  const [expandedCuisine, setExpandedCuisine] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const q = search.trim().toLowerCase()

  // 검색 필터
  const filtered = useMemo(() => {
    if (!q) return appData.restaurants
    return appData.restaurants.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      r.menu.toLowerCase().includes(q) ||
      r.cuisine.includes(q) ||
      r.tags.some(t => t.includes(q))
    )
  }, [q])

  // 대분류: 유튜버별 그룹
  const grouped = useMemo(() => {
    return appData.youtubers.map(yt => {
      const restaurants = filtered.filter(r => r.youtuber === yt.id)
      // 중분류: 음식 종류별 그룹
      const cuisineMap = new Map<string, Restaurant[]>()
      restaurants.forEach(r => {
        const list = cuisineMap.get(r.cuisine) || []
        list.push(r)
        cuisineMap.set(r.cuisine, list)
      })
      return {
        youtuber: yt,
        cuisines: Array.from(cuisineMap.entries()).map(([name, items]) => ({
          name,
          restaurants: items
        })),
        totalCount: restaurants.length
      }
    }).filter(g => g.totalCount > 0)
  }, [filtered])

  const toggleYoutuber = (id: string) => {
    setExpandedYoutuber(prev => prev === id ? null : id)
    setExpandedCuisine(null)
  }

  const toggleCuisine = (key: string) => {
    setExpandedCuisine(prev => prev === key ? null : key)
  }

  return (
    <div className="min-h-screen bg-toss-gray-100">
      <div className="max-w-lg mx-auto">

        {/* 헤더 */}
        <div className="bg-white sticky top-0 z-20 shadow-sm">
          <div className="px-5 pt-10 pb-3 flex items-center gap-3.5">
            <img src="/logo.jpg" alt="로고" className="w-14 h-14 rounded-2xl shadow-sm object-cover" />
            <div className="flex-1">
              <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-toss-gray-900">
                유튜버 맛집 지도
              </h1>
              <p className="text-[12px] text-toss-gray-500 mt-0.5">유튜버가 다녀간 맛집 {appData.restaurants.length}곳</p>
            </div>
          </div>

          {/* 탭 */}
          <div className="px-5 pb-3">
            <div className="flex bg-toss-gray-100 rounded-xl p-1">
              <button
                onClick={() => setTab('home')}
                className={`flex-1 py-2.5 rounded-lg text-[14px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'home' ? 'bg-white text-toss-blue shadow-sm' : 'text-toss-gray-500'
                }`}
              >
                🏠 맛집 목록
              </button>
              <button
                onClick={() => setTab('map')}
                className={`flex-1 py-2.5 rounded-lg text-[14px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'map' ? 'bg-white text-toss-blue shadow-sm' : 'text-toss-gray-500'
                }`}
              >
                🗺️ 지도 보기
              </button>
            </div>
          </div>

          {/* 검색바 */}
          <div className="px-5 pb-4">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-toss-gray-400" width="16" height="16" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2"/>
                <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="맛집, 지역, 메뉴 검색"
                className="w-full h-10 pl-10 pr-9 rounded-xl bg-toss-gray-100 border border-gray-200 shadow-sm text-[14px] text-toss-gray-900 placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-toss-blue transition-shadow"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-toss-gray-300 flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2L8 8M8 2L2 8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 맛집 상세 모달 */}
        {selectedRestaurant && (
          <RestaurantDetail
            restaurant={selectedRestaurant}
            youtuber={appData.youtubers.find(y => y.id === selectedRestaurant.youtuber)!}
            onClose={() => setSelectedRestaurant(null)}
          />
        )}

        {tab === 'map' ? (
          <MapView
            restaurants={filtered}
            youtubers={appData.youtubers}
            selectedYoutuber={null}
            onSelectYoutuber={() => {}}
            onSelectRestaurant={setSelectedRestaurant}
          />
        ) : (
        <div className="px-4 pt-4 pb-8 flex flex-col gap-3">
          {grouped.map(({ youtuber: yt, cuisines, totalCount }) => {
            const isYtOpen = expandedYoutuber === yt.id

            return (
              <div key={yt.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* 대분류: 유튜버 */}
                <button
                  onClick={() => toggleYoutuber(yt.id)}
                  className="w-full px-4 py-4 flex items-center gap-3 active:bg-toss-gray-50 transition-colors"
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-[22px] shrink-0"
                    style={{ background: `${yt.color}15` }}
                  >
                    {yt.emoji}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-[16px] font-bold text-toss-gray-900">{yt.name}</div>
                    <div className="text-[12px] text-toss-gray-500">{yt.description} · 구독자 {yt.subscribers}</div>
                  </div>
                  <span className="text-[13px] font-extrabold text-toss-blue mr-1">{totalCount}곳</span>
                  <svg
                    className={`shrink-0 text-toss-gray-400 transition-transform duration-200 ${isYtOpen ? 'rotate-180' : ''}`}
                    width="16" height="16" viewBox="0 0 20 20" fill="none"
                  >
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* 중분류: 음식 종류 */}
                {isYtOpen && (
                  <div className="border-t border-toss-gray-100 animate-fade-slide">
                    {cuisines.map(({ name: cuisine, restaurants }) => {
                      const cuisineKey = `${yt.id}-${cuisine}`
                      const isCuisineOpen = expandedCuisine === cuisineKey

                      const cuisineEmoji: Record<string, string> = {
                        '한식': '🍚', '일식': '🍣', '양식': '🍝', '중식': '🥟',
                        '분식': '🍢', '주점': '🍺', '카페': '☕', '디저트': '🍰',
                      }

                      return (
                        <div key={cuisineKey}>
                          {/* 중분류 버튼 */}
                          <button
                            onClick={() => toggleCuisine(cuisineKey)}
                            className="w-full px-4 pl-14 py-3 flex items-center gap-2.5 active:bg-toss-gray-50 transition-colors border-t border-toss-gray-50"
                          >
                            <span className="text-[16px]">{cuisineEmoji[cuisine] || '🍴'}</span>
                            <span className="flex-1 text-left text-[14px] font-bold text-toss-gray-800">{cuisine}</span>
                            <span className="text-[12px] font-bold text-toss-gray-400 mr-1">{restaurants.length}곳</span>
                            <svg
                              className={`shrink-0 text-toss-gray-300 transition-transform duration-200 ${isCuisineOpen ? 'rotate-180' : ''}`}
                              width="14" height="14" viewBox="0 0 20 20" fill="none"
                            >
                              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>

                          {/* 소분류: 매장명 */}
                          {isCuisineOpen && (
                            <div className="animate-fade-slide">
                              {restaurants.map(r => (
                                <button
                                  key={r.id}
                                  onClick={() => setSelectedRestaurant(r)}
                                  className="w-full px-4 pl-20 py-3 flex items-center gap-3 active:bg-toss-gray-50 transition-colors border-t border-toss-gray-50"
                                >
                                  <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-extrabold shrink-0"
                                    style={{ background: `${yt.color}10`, color: yt.color }}
                                  >
                                    {r.name.charAt(0)}
                                  </div>
                                  <div className="flex-1 text-left min-w-0">
                                    <div className="text-[14px] font-bold text-toss-gray-900 truncate">{r.name}</div>
                                    <div className="text-[11px] text-toss-gray-500 mt-0.5">📍 {r.location} · {r.priceRange}</div>
                                  </div>
                                  <svg className="shrink-0 text-toss-gray-300" width="14" height="14" viewBox="0 0 20 20" fill="none">
                                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {grouped.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-16 px-6">
              <div className="w-20 h-20 rounded-full bg-toss-gray-100 flex items-center justify-center text-[36px] mb-5">🔍</div>
              <div className="text-[18px] font-bold text-toss-gray-900 mb-2">검색 결과가 없어요</div>
              <div className="text-[14px] text-center leading-relaxed text-toss-gray-500">다른 키워드로 검색해보세요</div>
            </div>
          )}
        </div>
        )}

        <div className="text-center pt-2 pb-6 px-4">
          <p className="text-[11px] text-toss-gray-400 leading-relaxed">
            * 유튜버 공식 앱이 아닙니다.
            <br />* 영상에서 확인된 맛집 정보를 정리한 서비스입니다.
            <br />* 폐업/이전 여부는 방문 전 확인해주세요.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
