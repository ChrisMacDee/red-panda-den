export type TopicStatus = 'not_started' | 'in_progress' | 'completed' | 'revisiting'
export type ResourceType =
  | 'course'
  | 'video'
  | 'article'
  | 'book'
  | 'documentation'
  | 'wiki'
  | 'other'

export interface Topic {
  id: string
  title: string
  description: string | null
  category: string
  status: TopicStatus
  progress: number
  createdAt: string
  updatedAt: string
}

export interface Resource {
  id: string
  topicId: string
  title: string
  url: string | null
  resourceType: ResourceType
  notes: string | null
  completed: boolean
  filePath: string | null
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  topicId: string
  body: string
  createdAt: string
  updatedAt: string
}

export interface TopicWithDetails extends Topic {
  resources: Resource[]
  notes: Note[]
}

export interface KnowledgeStats {
  total: number
  inProgress: number
  completed: number
  recentlyUpdated: Topic[]
}

export interface CreateTopicDto {
  title: string
  description?: string
  category: string
  status?: TopicStatus
}

export interface UpdateTopicDto {
  title?: string
  description?: string | null
  category?: string
  status?: TopicStatus
}

export interface CreateResourceDto {
  title: string
  url?: string | null
  resourceType?: ResourceType
  notes?: string
}

export interface UpdateResourceDto {
  title?: string
  url?: string | null
  resourceType?: ResourceType
  notes?: string | null
  completed?: boolean
}

export interface CreateNoteDto {
  body: string
}

export interface UpdateNoteDto {
  body: string
}
