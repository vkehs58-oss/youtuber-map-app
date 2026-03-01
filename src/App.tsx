import { useState } from 'react'
import data from './data/restaurants.json'
import type { AppData, Restaurant } from './types'
import Header from './components/Header'
import YoutuberList from './components/YoutuberList'
import RestaurantList from './components/RestaurantList'
import MapView from './components/MapView'
import RestaurantDetail from './components/RestaurantDetail'

const appData = data as AppData
type Tab = 'home' | 'map'

function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [selectedYoutuber, setSelectedYoutuber] = useState<string | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [search, setSearch] = useState('')

  const q = search.trim().toLowerCase()
  const filteredRestaurants = appData.restaurants.filter(r => {
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.location.toLowerCase().includes(q) || r.menu.toLowerCase().includes(q) || r.tags.some(t => t.includes(q))
    const matchYoutuber = !selectedYoutuber || r.youtuber === selectedYoutuber
    return matchSearch && matchYoutuber
  })

  const selectedYoutuberData = selectedYoutuber
    ? appData.youtubers.find(y => y.id === selectedYoutuber)
    : null

  return (
    <div className="min-h-screen bg-toss-gray-100">
      <div className="max-w-lg mx-auto">
        <Header tab={tab} setTab={setTab} count={appData.restaurants.length} />

        {/* 맛집 상세 모달 */}
        {selectedRestaurant && (
          <RestaurantDetail
            restaurant={selectedRestaurant}
            youtuber={appData.youtubers.find(y => y.id === selectedRestaurant.youtuber)!}
            onClose={() => setSelectedRestaurant(null)}
          />
        )}

        {tab === 'home' ? (
          <div className="px-4 pt-4 pb-8 flex flex-col gap-3">
            {/* 검색바 */}
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
                className="w-full h-10 pl-10 pr-9 rounded-xl bg-white text-[14px] text-toss-gray-900 placeholder:text-toss-gray-400 outline-none ring-1 ring-toss-gray-200 focus:ring-toss-blue transition-shadow"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-toss-gray-300 flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2L8 8M8 2L2 8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>

            {/* 유튜버 필터 */}
            <YoutuberList
              youtubers={appData.youtubers}
              restaurants={appData.restaurants}
              selected={selectedYoutuber}
              onSelect={id => setSelectedYoutuber(selectedYoutuber === id ? null : id)}
            />

            {/* 선택된 유튜버 정보 */}
            {selectedYoutuberData && (
              <div className="animate-fade-slide bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[24px]" style={{ background: `${selectedYoutuberData.color}20` }}>
                  {selectedYoutuberData.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-toss-gray-900">{selectedYoutuberData.name}</div>
                  <div className="text-[12px] text-toss-gray-500">{selectedYoutuberData.description} · 구독자 {selectedYoutuberData.subscribers}</div>
                </div>
                <div className="text-[14px] font-extrabold text-toss-blue">
                  {filteredRestaurants.length}곳
                </div>
              </div>
            )}

            {/* 맛집 리스트 */}
            <RestaurantList
              restaurants={filteredRestaurants}
              youtubers={appData.youtubers}
              onSelect={setSelectedRestaurant}
            />

            {filteredRestaurants.length === 0 && (
              <div className="flex flex-col items-center justify-center pt-16 px-6">
                <div className="w-20 h-20 rounded-full bg-toss-gray-100 flex items-center justify-center text-[36px] mb-5">🔍</div>
                <div className="text-[18px] font-bold text-toss-gray-900 mb-2">검색 결과가 없어요</div>
                <div className="text-[14px] text-center leading-relaxed text-toss-gray-500">
                  다른 키워드로 검색해보세요
                </div>
              </div>
            )}
          </div>
        ) : (
          <MapView
            restaurants={filteredRestaurants}
            youtubers={appData.youtubers}
            selectedYoutuber={selectedYoutuber}
            onSelectYoutuber={id => setSelectedYoutuber(selectedYoutuber === id ? null : id)}
            onSelectRestaurant={setSelectedRestaurant}
          />
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
