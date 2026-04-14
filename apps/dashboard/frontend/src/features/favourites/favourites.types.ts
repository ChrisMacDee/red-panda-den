export interface Favourite {
  id: number
  title: string
  url: string
  iconType: 'favicon' | 'library' | 'custom'
  iconValue: string | null
  colour: string | null
  sortOrder: number
}

export interface CreateFavouriteDto {
  title: string
  url: string
  iconType?: 'favicon' | 'library' | 'custom'
  iconValue?: string
  colour?: string
}

export interface UpdateFavouriteDto {
  title?: string
  url?: string
  iconType?: 'favicon' | 'library' | 'custom'
  iconValue?: string
  colour?: string
  sortOrder?: number
}
