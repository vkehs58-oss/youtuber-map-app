import type { Youtuber, Restaurant } from '../types'

interface Props {
  youtubers: Youtuber[]
  restaurants: Restaurant[]
  selected: string | null
  onSelect: (id: string) => void
}

export default function YoutuberList({ youtubers, restaurants, selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
      {youtubers.map(y => {
        const count = restaurants.filter(r => r.youtuber === y.id).length
        const isActive = selected === y.id

        return (
          <button
            key={y.id}
            onClick={() => onSelect(y.id)}
            className={`shrink-0 px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all active:scale-[0.97] ${
              isActive
                ? 'bg-toss-blue text-white shadow-md'
                : 'bg-white text-toss-gray-700 shadow-sm ring-1 ring-toss-gray-200'
            }`}
          >
            <span className="text-[16px]">{y.emoji}</span>
            <span className="text-[13px] font-bold whitespace-nowrap">{y.name}</span>
            <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-full ${
              isActive
                ? 'bg-white/20 text-white'
                : 'bg-toss-gray-100 text-toss-gray-500'
            }`}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
