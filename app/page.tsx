'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Settings, BarChart3, Plus, Trash2, Bell, BellOff, CheckCircle, Clock, AlertCircle, Filter, Send, X, Zap, Shield, Globe, Smartphone, TrendingUp, RefreshCw } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────

interface Comment {
  id: string
  name: string
  avatar: string
  text: string
  time: string
  status: 'pending' | 'auto-replied' | 'no-match'
  triggeredRule?: string
  postUrl?: string
}

interface Rule {
  id: string
  keyword: string
  matchMode: 'exact' | 'fuzzy'
  reply: string
  enabled: boolean
  priority: number
  platform: 'facebook' | 'instagram' | 'both'
}

interface Stats {
  today: number
  week: number
  month: number
  avgReplyTime: string
  topRules: { rule: string; count: number }[]
}

// ─── Sample Data ─────────────────────────────────────────────────────────

const SAMPLE_COMMENTS: Comment[] = [
  { id: '1', name: '王小美', avatar: '👩', text: '請問這產品多少錢？', time: '2 分鐘前', status: 'pending' },
  { id: '2', name: '陳志明', avatar: '👨', text: '支持！太棒了', time: '5 分鐘前', status: 'auto-replied', triggeredRule: '優惠關鍵字' },
  { id: '3', name: '林小姐', avatar: '👩‍🦰', text: '可以貨到付款嗎', time: '8 分鐘前', status: 'pending' },
  { id: '4', name: '張大頭', avatar: '🧔', text: '什麼時候到貨', time: '12 分鐘前', status: 'auto-replied', triggeredRule: '物流查詢' },
  { id: '5', name: '李小如', avatar: '👩‍🦱', text: '太貴了吧', time: '15 分鐘前', status: 'no-match' },
  { id: '6', name: '黃先生', avatar: '👨‍🦳', text: '優惠碼可以用嗎', time: '18 分鐘前', status: 'pending' },
  { id: '7', name: '劉曉文', avatar: '👩‍🦰', text: '全省免運嗎', time: '22 分鐘前', status: 'auto-replied', triggeredRule: '運費相關' },
  { id: '8', name: '周杰倫', avatar: '🧑', text: '有興趣！', time: '25 分鐘前', status: 'pending' },
  { id: '9', name: '林志玲', avatar: '👩', text: '可以團購嗎', time: '30 分鐘前', status: 'pending' },
  { id: '10', name: '黃金龍', avatar: '👨', text: '太棒了！', time: '35 分鐘前', status: 'auto-replied', triggeredRule: '優惠關鍵字' },
]

const SAMPLE_RULES: Rule[] = [
  { id: '1', keyword: '多少錢|價格|價錢', matchMode: 'fuzzy', reply: '感謝詢問！您可以在我們的官方網站查看最新價格，或直接私訊我們唷～ 🎁', enabled: true, priority: 1, platform: 'both' },
  { id: '2', keyword: '到貨|寄送|物流|出貨', matchMode: 'fuzzy', reply: '您好！我們一般會在 2-3 個工作天內出貨，週末與國定假日不寄送喔～ 📦', enabled: true, priority: 2, platform: 'both' },
  { id: '3', keyword: '免運', matchMode: 'exact', reply: '滿 $999 即可享有免運優惠！快去選購吧～ 🚚', enabled: true, priority: 1, platform: 'both' },
  { id: '4', keyword: '優惠|折扣|特價', matchMode: 'fuzzy', reply: '感謝關注！我們不定期有優惠活動，歡迎追蹤我們的粉絲專頁獲得最新消息～ ✨', enabled: true, priority: 3, platform: 'both' },
  { id: '5', keyword: '貨到付款', matchMode: 'exact', reply: '您好！我們支援貨到付款，請在結帳時選擇「貨到付款」即可～ 💵', enabled: false, priority: 4, platform: 'facebook' },
]

const SAMPLE_STATS: Stats = {
  today: 142,
  week: 891,
  month: 3420,
  avgReplyTime: '3.2 分鐘',
  topRules: [
    { rule: '優惠關鍵字', count: 89 },
    { rule: '到貨物流', count: 67 },
    { rule: '價格諮詢', count: 54 },
    { rule: '免運條件', count: 31 },
  ],
}

// ─── Components ──────────────────────────────────────────────────────────

function CommentCard({ comment, onReply, onDismiss }: {
  comment: Comment
  onReply?: (id: string, text: string) => void
  onDismiss?: (id: string) => void
}) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')

  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-900/20', label: '待回覆' },
    'auto-replied': { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20', label: '已回覆' },
    'no-match': { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-900/20', label: '無符合規則' },
  }
  const cfg = statusConfig[comment.status]

  function handleSendReply() {
    if (!replyText.trim()) return
    onReply?.(comment.id, replyText)
    setReplyText('')
    setShowReply(false)
  }

  return (
    <div className={`rounded-2xl p-4 border transition-all animate-fade-in ${comment.status === 'pending' ? 'border-yellow-500/30 bg-yellow-900/10' : 'border-[var(--border)] bg-[var(--bg-card)]'}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-xl flex-shrink-0">
          {comment.avatar}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{comment.name}</span>
            <span className="text-xs text-[var(--text-muted)]">{comment.time}</span>
            <div className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${cfg.bg} ${cfg.color}`}>
              <cfg.icon size={10} />
              {cfg.label}
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-2">{comment.text}</p>

          {comment.triggeredRule && (
            <div className="inline-flex items-center gap-1 text-xs text-violet-400 bg-violet-900/20 px-2 py-0.5 rounded-full mb-2">
              <Zap size={10} />
              觸發：{comment.triggeredRule}
            </div>
          )}

          {showReply ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="輸入回覆內容..."
                className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] resize-none focus:outline-none focus:border-blue-500"
                rows={2}
              />
              <div className="flex gap-2">
                <button onClick={handleSendReply} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-1">
                  <Send size={12} /> 發送
                </button>
                <button onClick={() => setShowReply(false)} className="px-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-dark)] text-[var(--text-muted)] text-sm py-2 rounded-xl transition-colors">
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-1">
              <button onClick={() => setShowReply(true)} className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                <Send size={10} /> 回覆
              </button>
              {comment.status === 'pending' && (
                <button onClick={() => onDismiss?.(comment.id)} className="text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  <CheckCircle size={10} /> 標記已讀
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RuleCard({ rule, onToggle, onDelete, onEdit }: {
  rule: Rule
  onToggle?: (id: string) => void
  onDelete?: (id: string) => void
  onEdit?: (rule: Rule) => void
}) {
  return (
    <div className={`rounded-xl p-4 border transition-all ${rule.enabled ? 'border-[var(--border)] bg-[var(--bg-card)]' : 'border-[var(--border)]/50 bg-[var(--bg-card)]/50 opacity-60'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{rule.keyword}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${rule.matchMode === 'exact' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'}`}>
              {rule.matchMode === 'exact' ? '精確' : '模糊'}
            </span>
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              {rule.platform === 'both' ? <><Globe size={10} className="text-blue-500" /><Smartphone size={10} className="text-pink-500" /></> : rule.platform === 'facebook' ? <Globe size={10} className="text-blue-500" /> : <Smartphone size={10} className="text-pink-500" />}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">{rule.reply}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onToggle?.(rule.id)} className={`p-1.5 rounded-lg transition-colors ${rule.enabled ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>
            {rule.enabled ? <Bell size={14} /> : <BellOff size={14} />}
          </button>
          <button onClick={() => onEdit?.(rule)} className="p-1.5 rounded-lg bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 transition-colors">
            ✏️
          </button>
          <button onClick={() => onDelete?.(rule.id)} className="p-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-black text-[var(--text)] mb-0.5">{value}</div>
      {sub && <div className="text-xs text-[var(--text-muted)]">{sub}</div>}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────

export default function Home() {
  const [tab, setTab] = useState<'dashboard' | 'rules' | 'stats' | 'settings'>('dashboard')
  const [comments, setComments] = useState<Comment[]>(SAMPLE_COMMENTS)
  const [rules, setRules] = useState<Rule[]>(SAMPLE_RULES)
  const [stats] = useState<Stats>(SAMPLE_STATS)
  const [filter, setFilter] = useState<'all' | 'pending' | 'auto-replied' | 'no-match'>('all')
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true)
  const [showAddRule, setShowAddRule] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [newRule, setNewRule] = useState<any>({ keyword: '', reply: '', matchMode: 'fuzzy', enabled: true, priority: 5, platform: 'both' })
  const [fbConnected, setFbConnected] = useState(false)
  const [syncInterval, setSyncInterval] = useState('30')
  const [pageId, setPageId] = useState('')
  const [accessToken, setAccessToken] = useState('')

  const filteredComments = comments.filter(c => filter === 'all' || c.status === filter)

  const handleAddRule = () => {
    if (!newRule.keyword?.trim() || !newRule.reply?.trim()) return
    const rule: Rule = {
      id: Date.now().toString(),
      keyword: newRule.keyword!,
      matchMode: newRule.matchMode as 'exact' | 'fuzzy',
      reply: newRule.reply!,
      enabled: newRule.enabled ?? true,
      priority: newRule.priority ?? 5,
      platform: newRule.platform as 'facebook' | 'instagram' | 'both',
    }
    setRules(prev => [...prev, rule])
    setNewRule({ keyword: '', reply: '', matchMode: 'fuzzy', enabled: true, priority: 5, platform: 'both' })
    setShowAddRule(false)
  }

  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id))
  }

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const handleReply = (id: string, text: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, status: 'auto-replied' as const, triggeredRule: '手動回覆' } : c))
  }

  const handleDismiss = (id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, status: 'auto-replied' as const } : c))
  }

  const tabs = [
    { key: 'dashboard', label: '留言總覽', icon: MessageSquare },
    { key: 'rules', label: '回覆規則', icon: Zap },
    { key: 'stats', label: '數據統計', icon: BarChart3 },
    { key: 'settings', label: '設定', icon: Settings },
  ]

  const pendingCount = comments.filter(c => c.status === 'pending').length

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <MessageSquare size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-sm">社群留言自動回覆</h1>
              <div className="flex items-center gap-1.5 text-xs">
                <div className={`w-2 h-2 rounded-full ${autoReplyEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-[var(--text-muted)]">{autoReplyEnabled ? '自動回覆已開啟' : '自動回覆已關閉'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoReplyEnabled(v => !v)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${autoReplyEnabled ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
            >
              {autoReplyEnabled ? <><Bell size={12} className="inline mr-1" />開啟</> : <><BellOff size={12} className="inline mr-1" />關閉</>}
            </button>
            <button className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-sm">👤</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4 pb-2">
          <div className="flex gap-1 bg-[var(--bg-card)] rounded-2xl p-1">
            {tabs.map(t => {
              const Icon = t.icon
              const isActive = tab === t.key
              const count = t.key === 'dashboard' ? pendingCount : 0
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as typeof tab)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all relative ${isActive ? 'bg-blue-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                >
                  <Icon size={13} />
                  {t.label}
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4 pb-8">
        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <>
            {/* Filter bar */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[var(--text-muted)]" />
              {(['all', 'pending', 'auto-replied', 'no-match'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)]'}`}
                >
                  {f === 'all' ? '全部' : f === 'pending' ? '待回覆' : f === 'auto-replied' ? '已回覆' : '無符合'}
                  {f !== 'all' && <span className="ml-1 opacity-70">({comments.filter(c => c.status === f).length})</span>}
                </button>
              ))}
              <button className="ml-auto flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                <RefreshCw size={12} /> 刷新
              </button>
            </div>

            {/* Comment list */}
            <div className="space-y-3">
              {filteredComments.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-muted)]">
                  <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                  <p>目前沒有留言</p>
                </div>
              ) : (
                filteredComments.map(c => (
                  <CommentCard key={c.id} comment={c} onReply={handleReply} onDismiss={handleDismiss} />
                ))
              )}
            </div>
          </>
        )}

        {/* Rules Tab */}
        {tab === 'rules' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm">回覆規則</h2>
                <p className="text-xs text-[var(--text-muted)]">{rules.filter(r => r.enabled).length} 條規則啟用中</p>
              </div>
              <button
                onClick={() => setShowAddRule(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-xl font-bold transition-colors"
              >
                <Plus size={14} /> 新增規則
              </button>
            </div>

            <div className="space-y-3">
              {rules.map(r => (
                <RuleCard
                  key={r.id}
                  rule={r}
                  onToggle={handleToggleRule}
                  onDelete={handleDeleteRule}
                  onEdit={rule => { setEditingRule(rule); setNewRule(rule); setShowAddRule(true) }}
                />
              ))}
            </div>

            {rules.length === 0 && (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <Zap size={40} className="mx-auto mb-3 opacity-30" />
                <p>尚無回覆規則</p>
                <p className="text-xs mt-1">點擊上方「新增規則」開始設定</p>
              </div>
            )}
          </>
        )}

        {/* Stats Tab */}
        {tab === 'stats' && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatsCard label="今日回覆" value={stats.today.toString()} sub="較昨日 +12%" icon={MessageSquare} color="bg-blue-600/20 text-blue-400" />
              <StatsCard label="本週回覆" value={stats.week.toString()} sub="每日平均 127 筆" icon={BarChart3} color="bg-purple-600/20 text-purple-400" />
              <StatsCard label="本月回覆" value={stats.month.toString()} sub="持續成長中" icon={TrendingUp} color="bg-green-600/20 text-green-400" />
              <StatsCard label="平均回覆" value={stats.avgReplyTime} sub="自動回覆速度" icon={Clock} color="bg-yellow-600/20 text-yellow-400" />
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
              <h3 className="font-bold text-sm mb-4">🔥 熱門關鍵字排行榜</h3>
              <div className="space-y-3">
                {stats.topRules.map((item, i) => (
                  <div key={item.rule} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-orange-600 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.rule}</span>
                        <span className="text-xs text-[var(--text-muted)]">{item.count} 次觸發</span>
                      </div>
                      <div className="h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${(item.count / stats.topRules[0].count) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <>
            {/* Platform connection */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
              <h3 className="font-bold text-sm mb-4">🔗 平台連結</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                      <Globe size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Facebook 粉絲專頁</div>
                      <div className={`text-xs ${fbConnected ? 'text-green-400' : 'text-[var(--text-muted)]'}`}>
                        {fbConnected ? `已連結：${pageId || '我的專頁'}` : '尚未連結'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setFbConnected(v => !v)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${fbConnected ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                  >
                    {fbConnected ? '中斷連結' : '連結專頁'}
                  </button>
                </div>

                {fbConnected && (
                  <div className="space-y-3 pl-2 border-l-2 border-blue-500/30">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-1">Page ID</label>
                      <input value={pageId} onChange={e => setPageId(e.target.value)} placeholder="輸入 Page ID" className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-1">Access Token</label>
                      <input type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="輸入長期 Access Token" className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-3">
                      <Shield size={12} className="text-yellow-400 flex-shrink-0" />
                      <span>Access Token 僅儲存於瀏覽器本地，不會上傳至任何伺服器</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-600/20 flex items-center justify-center">
                      <Smartphone size={20} className="text-pink-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Instagram 商業帳號</div>
                      <div className="text-xs text-[var(--text-muted)]">敬請期待</div>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] bg-gray-800 px-3 py-1.5 rounded-lg">即將支援</span>
                </div>
              </div>
            </div>

            {/* Sync settings */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
              <h3 className="font-bold text-sm mb-4">⚙️ 同步設定</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">同步頻率</div>
                    <div className="text-xs text-[var(--text-muted)]">多久檢查一次新留言</div>
                  </div>
                  <select
                    value={syncInterval}
                    onChange={e => setSyncInterval(e.target.value)}
                    className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-blue-500"
                  >
                    <option value="15">每 15 分鐘</option>
                    <option value="30">每 30 分鐘</option>
                    <option value="60">每 60 分鐘</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">自動回覆</div>
                    <div className="text-xs text-[var(--text-muted)]">符合規則時自動回覆粉絲</div>
                  </div>
                  <button
                    onClick={() => setAutoReplyEnabled(v => !v)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${autoReplyEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${autoReplyEnabled ? 'translate-x-6.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Demo mode notice */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap size={16} className="text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-blue-300 mb-1">Demo 模式</div>
                  <p className="text-xs text-blue-200/70 leading-relaxed">
                    目前顯示範例留言資料。若要連結真實 Facebook 粉絲專頁，請在上方填入 Page ID 與 Access Token。Access Token 需具備 <code>pages_read_engagement</code> 與 <code>pages_manage_messages</code> 權限。
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Add/Edit Rule Modal */}
      {showAddRule && (
        <Modal title={editingRule ? '編輯規則' : '新增回覆規則'} onClose={() => { setShowAddRule(false); setEditingRule(null); setNewRule({ keyword: '', reply: '', matchMode: 'fuzzy', enabled: true, priority: 5, platform: 'both' }) }}>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-1.5">關鍵字</label>
              <input
                value={newRule.keyword || ''}
                onChange={e => setNewRule((r: any) => ({ ...r, keyword: e.target.value }))}
                placeholder="例如：多少錢|價格（用 | 分隔多個關鍵字）"
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">用 | 分隔多個關鍵字（OR 邏輯）</p>
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-1.5">比對模式</label>
              <div className="flex gap-2">
                {(['exact', 'fuzzy'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setNewRule((r: any) => ({ ...r, matchMode: m }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${newRule.matchMode === m ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)]'}`}
                  >
                    {m === 'exact' ? '精確比對' : '模糊比對'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-1.5">回覆內容</label>
              <textarea
                value={newRule.reply || ''}
                onChange={e => setNewRule((r: any) => ({ ...r, reply: e.target.value }))}
                placeholder="輸入自動回覆的內容..."
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] block mb-1.5">適用平台</label>
              <div className="flex gap-2">
                {(['both', 'facebook', 'instagram'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setNewRule((r: any) => ({ ...r, platform: p }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${newRule.platform === p ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)]'}`}
                  >
                    {p === 'both' ? <><Globe size={12} /><Smartphone size={12} /></> : p === 'facebook' ? <Globe size={12} /> : <Smartphone size={12} />}
                    {p === 'both' ? '兩者' : p === 'facebook' ? 'Facebook' : 'Instagram'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddRule}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {editingRule ? '儲存變更' : '新增規則'}
              </button>
              <button
                onClick={() => { setShowAddRule(false); setEditingRule(null) }}
                className="px-6 bg-[var(--bg-card)] hover:bg-[var(--bg-dark)] text-[var(--text-muted)] font-medium py-3 rounded-xl transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

