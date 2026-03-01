interface Props {
  tab: 'home' | 'map'
  setTab: (t: 'home' | 'map') => void
  count: number
}

export default function Header({ tab, setTab, count }: Props) {
  return (
    <div className="bg-white sticky top-0 z-20">
      <div className="px-5 pt-10 pb-4 flex items-center gap-3.5">
        <div className="w-14 h-14 rounded-2xl shadow-sm bg-gradient-to-br from-[#FF6B6B] to-[#FFD93D] flex items-center justify-center text-[28px]">
          🍽️
        </div>
        <div className="flex-1">
          <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-toss-gray-900">
            유튜버 맛집 지도
          </h1>
          <p className="text-[12px] text-toss-gray-500 mt-0.5">유튜버가 다녀간 맛집 {count}곳</p>
        </div>
      </div>

      <div className="px-5 pb-4">
        <div className="flex bg-toss-gray-100 rounded-xl p-1">
          <button
            onClick={() => setTab('home')}
            className={`flex-1 py-2.5 rounded-lg text-[14px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'home'
                ? 'bg-white text-toss-blue shadow-sm'
                : 'text-toss-gray-500'
            }`}
          >
            🏠 맛집 목록
          </button>
          <button
            onClick={() => setTab('map')}
            className={`flex-1 py-2.5 rounded-lg text-[14px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'map'
                ? 'bg-white text-toss-blue shadow-sm'
                : 'text-toss-gray-500'
            }`}
          >
            🗺️ 지도 보기
          </button>
        </div>
      </div>
    </div>
  )
}
