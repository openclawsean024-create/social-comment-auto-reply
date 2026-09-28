// ─── Types ───────────────────────────────────────────────────────────────
// Backwards compatible: all existing fields preserved. `isImage` and
// `language` are additive optional fields on Comment for the refreshed UI.
// The localStorage key (STORAGE_KEY) is unchanged so v3 user data still
// hydrates correctly.

export type Platform = 'facebook' | 'instagram' | 'twitter' | 'threads' | 'generic'

export const PLATFORMS: Platform[] = ['facebook', 'instagram', 'twitter', 'threads', 'generic']

export const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter / X',
  threads: 'Threads',
  generic: '通用',
}

export type MatchMode = 'exact' | 'fuzzy'
export type CommentStatus = 'pending' | 'auto-replied' | 'no-match' | 'needs-review'

export interface Rule {
  id: string
  keyword: string
  matchMode: MatchMode
  reply: string
  enabled: boolean
  priority: number
  platform: Platform
}

export interface Comment {
  id: string
  name: string
  avatar: string
  text: string
  time: string
  status: CommentStatus
  triggeredRule?: string
  postUrl?: string
  /** True when the comment contains an image indicator and should bypass
   *  automatic matching — image comments require a human. */
  isImage?: boolean
  /** Detected language code for the pasted comment text. */
  language?: 'zh' | 'en' | 'mixed'
}

export interface Post {
  content: string
  url: string
  platform: Platform
}

export interface AppState {
  post: Post
  rules: Rule[]
  comments: Comment[]
  theme: 'dark' | 'light'
}

export const DEFAULT_STATE: AppState = {
  post: { content: '', url: '', platform: 'facebook' },
  rules: [],
  comments: [],
  theme: 'light',
}

export const STORAGE_KEY = 'sc-app-store-v2'
