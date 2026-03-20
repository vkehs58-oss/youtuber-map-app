import type { Restaurant, Youtuber } from '../types'

const CUISINE_EMOJI: Record<string, string> = {
  한식: '🍚', 일식: '🍣', 양식: '🍝', 중식: '🥟',
  분식: '🍢', 카페: '☕', 디저트: '🍰', 햄버거: '🍔', 피자: '🍕',
  치킨: '🍗', 고기: '🥩', 라멘: '🍜', 초밥: '🍱', 국밥: '🥘',
  아시안: '🍜', 베트남: '🫕', 태국: '🌶️', 파스타: '🍝',
}

interface Props {
  restaurant: Restaurant
  youtuber: Youtuber
  onClose: () => void
  isBookmarked: boolean
  onToggleBookmark: () => void
}

export default function RestaurantDetail({ restaurant: r, youtuber: yt, onClose, isBookmarked, onToggleBookmark }: Props) {
  const videoLink = r.videoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(yt.name + ' ' + r.name)}`

  // 토스 미니앱 딥링크 (intoss:// 형식)
  const appShareUrl = `supertoss://miniapp/muk-tube-amp`

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${r.name} - 먹방로드`,
        text: `${yt.emoji} ${yt.name}이(가) 다녀간 ${r.name}\n📍 ${r.location} · ${r.cuisine}\n🍴 ${r.menu}`,
        url: appShareUrl,
      }).catch(() => {})
    } else {
      const text = `${yt.emoji} ${yt.name}이(가) 다녀간 ${r.name}\n📍 ${r.location}\n🍴 ${r.menu}\n👉 먹방로드에서 보기: ${appShareUrl}`
      navigator.clipboard.writeText(text)
      alert('링크가 복사되었어요!')
    }
  }

  // 음식 카테고리 이모지 - cuisine 필드 포함 관계로도 검색
  const getAvatarEmoji = () => {
    if (CUISINE_EMOJI[r.cuisine]) return CUISINE_EMOJI[r.cuisine]
    for (const [key, emoji] of Object.entries(CUISINE_EMOJI)) {
      if (r.cuisine.includes(key)) return emoji
    }
    return '🍴'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />

      {/* 바텀시트: slideUp 애니메이션 + max-h + flex col */}
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl animate-slide-up max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 드래그 핸들 - shrink-0 */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-toss-gray-300" />
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="px-5 overflow-y-auto overscroll-contain flex-1">
          {/* 헤더 */}
          <div className="flex items-start gap-3.5 mb-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-[26px] shrink-0"
              style={{ background: `${yt.color}20` }}
            >
              {getAvatarEmoji()}
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
            <div className="flex items-center gap-0.5">
              {/* 찜 버튼 - 44x44px 터치 타겟 */}
              <button
                onClick={onToggleBookmark}
                className={`w-11 h-11 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors ${isBookmarked ? 'heart-pop' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24"
                  fill={isBookmarked ? '#f04452' : 'none'}
                  stroke={isBookmarked ? '#f04452' : '#8B95A1'}
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
              {/* 닫기 */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-toss-gray-100 flex items-center justify-center"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2L10 10M10 2L2 10" stroke="#8B95A1" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* 정보 카드 */}
          <div className="bg-toss-gray-50 rounded-2xl p-4 flex flex-col gap-3">
            <a
              href={`https://map.kakao.com/link/to/${encodeURIComponent(r.name)},${r.lat},${r.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 active:opacity-70 transition-opacity"
            >
              <span className="text-[14px]">📍</span>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-toss-blue underline underline-offset-2">{r.roadAddress}</div>
                <div className="text-[11px] text-toss-gray-400 mt-0.5">{r.location} · 카카오맵으로 보기 →</div>
              </div>
            </a>
            <div className="h-px bg-toss-gray-200" />
            <div className="flex items-center gap-3">
              <span className="text-[14px]">🍴</span>
              <span className="text-[13px] font-semibold text-toss-gray-800">{r.menu}</span>
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

          {/* 출처 */}
          <div className="mt-4 mb-3 text-[11px] text-toss-gray-400 text-center">
            이 정보는 {yt.name} 유튜브 채널 영상에서 확인되었습니다.
          </div>
        </div>

        {/* CTA 버튼 - shrink-0 하단 고정, 구분선 */}
        <div className="px-5 pt-3 pb-safe shrink-0 border-t border-gray-100">
          <div className="flex gap-2">
            <a
              href={`https://map.kakao.com/link/to/${r.name},${r.lat},${r.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 rounded-xl text-[14px] font-bold text-center bg-toss-blue text-white active:bg-toss-blue-dark transition-colors"
            >
              🗺️ 길찾기
            </a>
            <button
              onClick={() => window.open(videoLink, '_blank', 'noopener,noreferrer')}
              className="flex-1 py-3.5 rounded-xl text-[14px] font-bold text-center bg-toss-gray-100 text-toss-gray-700 active:bg-toss-gray-200 transition-colors"
            >
              ▶️ 영상 보기
            </button>
            <button
              onClick={handleShare}
              className="px-3.5 py-3.5 rounded-xl text-[14px] font-bold text-center bg-toss-gray-100 text-toss-gray-700 active:bg-toss-gray-200 transition-colors shrink-0 flex items-center gap-1"
            >
              <span>📤</span>
              <span className="text-[13px]">공유</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
