import type { Restaurant, Youtuber } from '../types'

interface Props {
  restaurant: Restaurant
  youtuber: Youtuber
  onClose: () => void
}

export default function RestaurantDetail({ restaurant: r, youtuber: yt, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 바텀 시트 */}
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl animate-fade-slide"
        onClick={e => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-toss-gray-300" />
        </div>

        <div className="px-5 pb-8">
          {/* 헤더 */}
          <div className="flex items-start gap-3.5 mb-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-[22px] font-extrabold shrink-0"
              style={{ background: `${yt.color}20`, color: yt.color }}
            >
              {r.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-[20px] font-extrabold text-toss-gray-900 tracking-[-0.3px]">{r.name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                  style={{ background: `${yt.color}15`, color: yt.color }}
                >
                  {yt.emoji} {yt.name}
                </span>
                <span className="text-[12px] text-toss-gray-400">{r.priceRange}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-toss-gray-100 flex items-center justify-center"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2L10 10M10 2L2 10" stroke="#8B95A1" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* 정보 카드 */}
          <div className="bg-toss-gray-50 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[14px]">📍</span>
              <div>
                <div className="text-[13px] font-semibold text-toss-gray-800">{r.roadAddress}</div>
                <div className="text-[11px] text-toss-gray-400 mt-0.5">{r.location}</div>
              </div>
            </div>
            <div className="h-px bg-toss-gray-200" />
            <div className="flex items-center gap-3">
              <span className="text-[14px]">🍴</span>
              <span className="text-[13px] font-semibold text-toss-gray-800">{r.menu}</span>
            </div>
            <div className="h-px bg-toss-gray-200" />
            <div className="flex items-center gap-3">
              <span className="text-[14px]">💰</span>
              <span className="text-[13px] font-semibold text-toss-gray-800">{r.priceRange}</span>
            </div>
          </div>

          {/* 태그 */}
          <div className="flex flex-wrap gap-1.5 mt-4">
            {r.tags.map((tag, i) => (
              <span key={i} className="text-[12px] px-2.5 py-1 rounded-full bg-toss-gray-100 text-toss-gray-600 font-medium">
                #{tag}
              </span>
            ))}
          </div>

          {/* 버튼들 */}
          <div className="flex gap-2.5 mt-5">
            <a
              href={`https://map.kakao.com/link/to/${r.name},${r.lat},${r.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 rounded-xl text-[14px] font-bold text-center bg-toss-blue text-white active:bg-toss-blue-dark transition-colors"
            >
              🗺️ 길찾기
            </a>
            <a
              href={r.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 rounded-xl text-[14px] font-bold text-center bg-toss-gray-100 text-toss-gray-700 active:bg-toss-gray-200 transition-colors"
            >
              ▶️ 영상 보기
            </a>
          </div>

          {/* 출처 */}
          <div className="mt-4 text-[11px] text-toss-gray-400 text-center">
            이 정보는 {yt.name} 유튜브 채널 영상에서 확인되었습니다.
          </div>
        </div>
      </div>
    </div>
  )
}
