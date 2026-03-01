import type { Restaurant, Youtuber } from '../types'

interface Props {
  restaurants: Restaurant[]
  youtubers: Youtuber[]
  onSelect: (r: Restaurant) => void
}

export default function RestaurantList({ restaurants, youtubers, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      {restaurants.map(r => {
        const yt = youtubers.find(y => y.name === r.youtuber)
        return (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm text-left active:bg-toss-gray-50 transition-colors active:scale-[0.99]"
          >
            <div className="flex items-start gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-[18px] font-extrabold shrink-0"
                style={{ background: yt ? `${yt.color}20` : '#F2F4F6', color: yt?.color }}
              >
                {r.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-toss-gray-900">{r.name}</span>
                  {yt && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: `${yt.color}15`, color: yt.color }}
                    >
                      {yt.emoji} {yt.name}
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-toss-gray-500 mt-1">
                  📍 {r.location} · {r.priceRange}
                </div>
                <div className="text-[12px] text-toss-gray-400 mt-0.5">
                  🍴 {r.menu}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {r.tags.map((tag, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-toss-gray-100 text-toss-gray-500">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <svg className="shrink-0 mt-1" width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="#B0B8C1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        )
      })}
    </div>
  )
}
