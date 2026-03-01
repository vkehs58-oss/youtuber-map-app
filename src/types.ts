export interface Youtuber {
  id: string
  name: string
  emoji: string
  color: string
  description: string
  subscribers: string
}

export interface Restaurant {
  id: number
  youtuber: string
  name: string
  address: string
  roadAddress: string
  location: string
  lat: number
  lng: number
  menu: string
  priceRange: string
  cuisine: string
  tags: string[]
  videoUrl: string
  videoTitle: string
  addedAt: string
}

export interface AppData {
  youtubers: Youtuber[]
  restaurants: Restaurant[]
}
