import { useState, useEffect, useMemo } from 'react'
import { Sun, Moon, Languages, Search, Terminal } from 'lucide-react'

const translations = {
  en: {
    title: 'Linux Signals Reference',
    subtitle: 'All standard Linux signals (1–31+): number, name, default action, description. Searchable. Everything client-side.',
    searchPlaceholder: 'Search by number, name, action or description...',
    number: 'No.',
    name: 'Name',
    action: 'Default Action',
    description: 'Description',
    catchable: 'Catchable',
    all: 'All',
    catchableOnly: 'Catchable',
    uncatchable: 'Uncatchable',
    realtime: 'Real-Time',
    noResults: 'No signals match your search.',
    showing: 'Showing',
    of: 'of',
    signals: 'signals',
    yes: 'Yes',
    no: 'No',
    builtBy: 'Built by',
    note: 'SIGKILL (9) and SIGSTOP (19) cannot be caught, blocked, or ignored. All other signals can be handled with signal(2) / sigaction(2).',
  },
  pt: {
    title: 'Referencia de Sinais Linux',
    subtitle: 'Todos os sinais padroes do Linux (1–31+): numero, nome, acao padrao, descricao. Pesquisavel.',
    searchPlaceholder: 'Buscar por numero, nome, acao ou descricao...',
    number: 'No.',
    name: 'Nome',
    action: 'Acao Padrao',
    description: 'Descricao',
    catchable: 'Capturavel',
    all: 'Todos',
    catchableOnly: 'Capturaveis',
    uncatchable: 'Nao-capturaveis',
    realtime: 'Tempo-Real',
    noResults: 'Nenhum sinal corresponde a busca.',
    showing: 'Exibindo',
    of: 'de',
    signals: 'sinais',
    yes: 'Sim',
    no: 'Nao',
    builtBy: 'Criado por',
    note: 'SIGKILL (9) e SIGSTOP (19) nao podem ser capturados, bloqueados ou ignorados. Todos os outros sinais podem ser tratados com signal(2) / sigaction(2).',
  },
} as const

type Lang = keyof typeof translations

type DefaultAction = 'Term' | 'Core' | 'Ign' | 'Stop' | 'Cont'

interface Signal {
  num: number
  name: string
  action: DefaultAction
  catchable: boolean
  realtime: boolean
  description: string
}

const ACTION_COLORS: Record<DefaultAction, string> = {
  Term: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Core: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Ign: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  Stop: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Cont: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

const ACTION_FULL: Record<DefaultAction, string> = {
  Term: 'Terminate',
  Core: 'Core dump',
  Ign: 'Ignore',
  Stop: 'Stop process',
  Cont: 'Continue',
}

const SIGNALS: Signal[] = [
  { num: 1, name: 'SIGHUP', action: 'Term', catchable: true, realtime: false, description: 'Hangup detected on controlling terminal or death of controlling process. Often used to reload config.' },
  { num: 2, name: 'SIGINT', action: 'Term', catchable: true, realtime: false, description: 'Interrupt from keyboard (Ctrl+C). Can be caught to perform cleanup before exit.' },
  { num: 3, name: 'SIGQUIT', action: 'Core', catchable: true, realtime: false, description: 'Quit from keyboard (Ctrl+\\). Produces a core dump. Can be caught.' },
  { num: 4, name: 'SIGILL', action: 'Core', catchable: true, realtime: false, description: 'Illegal instruction. Generated when CPU encounters an invalid instruction.' },
  { num: 5, name: 'SIGTRAP', action: 'Core', catchable: true, realtime: false, description: 'Trace/breakpoint trap. Used by debuggers.' },
  { num: 6, name: 'SIGABRT', action: 'Core', catchable: true, realtime: false, description: 'Abort signal from abort(3). Sent by the process to itself.' },
  { num: 7, name: 'SIGBUS', action: 'Core', catchable: true, realtime: false, description: 'Bus error (bad memory access, alignment fault).' },
  { num: 8, name: 'SIGFPE', action: 'Core', catchable: true, realtime: false, description: 'Floating-point exception (division by zero, overflow).' },
  { num: 9, name: 'SIGKILL', action: 'Term', catchable: false, realtime: false, description: 'Kill signal. Cannot be caught, blocked, or ignored. Immediately terminates the process.' },
  { num: 10, name: 'SIGUSR1', action: 'Term', catchable: true, realtime: false, description: 'User-defined signal 1. Application-specific use (e.g., reload config in some daemons).' },
  { num: 11, name: 'SIGSEGV', action: 'Core', catchable: true, realtime: false, description: 'Invalid memory reference (segmentation fault). Usually indicates a bug in the program.' },
  { num: 12, name: 'SIGUSR2', action: 'Term', catchable: true, realtime: false, description: 'User-defined signal 2. Application-specific use.' },
  { num: 13, name: 'SIGPIPE', action: 'Term', catchable: true, realtime: false, description: 'Broken pipe: write to pipe with no readers. Often handled to avoid unexpected process death.' },
  { num: 14, name: 'SIGALRM', action: 'Term', catchable: true, realtime: false, description: 'Timer signal from alarm(2). Used for timeouts.' },
  { num: 15, name: 'SIGTERM', action: 'Term', catchable: true, realtime: false, description: 'Termination signal. The default signal sent by kill(1). Can be caught for graceful shutdown.' },
  { num: 16, name: 'SIGSTKFLT', action: 'Term', catchable: true, realtime: false, description: 'Stack fault on coprocessor. Rarely used on modern Linux.' },
  { num: 17, name: 'SIGCHLD', action: 'Ign', catchable: true, realtime: false, description: 'Child stopped or terminated. Sent to parent when child changes state. Used by wait(2).' },
  { num: 18, name: 'SIGCONT', action: 'Cont', catchable: true, realtime: false, description: 'Continue if stopped. Sent by shell when job is resumed (fg). Cannot be blocked.' },
  { num: 19, name: 'SIGSTOP', action: 'Stop', catchable: false, realtime: false, description: 'Stop process. Cannot be caught, blocked, or ignored. Pauses process (like Ctrl+Z at kernel level).' },
  { num: 20, name: 'SIGTSTP', action: 'Stop', catchable: true, realtime: false, description: 'Stop typed at terminal (Ctrl+Z). Can be caught, unlike SIGSTOP.' },
  { num: 21, name: 'SIGTTIN', action: 'Stop', catchable: true, realtime: false, description: 'Terminal input for background process. Process is stopped when trying to read from terminal.' },
  { num: 22, name: 'SIGTTOU', action: 'Stop', catchable: true, realtime: false, description: 'Terminal output for background process. Process is stopped when writing to terminal.' },
  { num: 23, name: 'SIGURG', action: 'Ign', catchable: true, realtime: false, description: 'Urgent condition on socket. Sent when out-of-band data arrives on a socket.' },
  { num: 24, name: 'SIGXCPU', action: 'Core', catchable: true, realtime: false, description: 'CPU time limit exceeded (set with setrlimit(2)).' },
  { num: 25, name: 'SIGXFSZ', action: 'Core', catchable: true, realtime: false, description: 'File size limit exceeded.' },
  { num: 26, name: 'SIGVTALRM', action: 'Term', catchable: true, realtime: false, description: 'Virtual alarm clock (only counts CPU time used by the process).' },
  { num: 27, name: 'SIGPROF', action: 'Term', catchable: true, realtime: false, description: 'Profiling timer expired. Used by profiling tools.' },
  { num: 28, name: 'SIGWINCH', action: 'Ign', catchable: true, realtime: false, description: 'Window resize signal. Sent when terminal window changes size.' },
  { num: 29, name: 'SIGIO', action: 'Term', catchable: true, realtime: false, description: 'I/O now possible on file descriptor. Also SIGPOLL on some systems.' },
  { num: 30, name: 'SIGPWR', action: 'Term', catchable: true, realtime: false, description: 'Power failure. Sent by init on power failure detection.' },
  { num: 31, name: 'SIGSYS', action: 'Core', catchable: true, realtime: false, description: 'Bad system call. Used by seccomp to report disallowed syscalls.' },
  { num: 34, name: 'SIGRTMIN', action: 'Term', catchable: true, realtime: true, description: 'First real-time signal (POSIX). Real-time signals (34-64) are queued and ordered.' },
  { num: 64, name: 'SIGRTMAX', action: 'Term', catchable: true, realtime: true, description: 'Last real-time signal. Range SIGRTMIN–SIGRTMAX is available for application use.' },
]

export default function LinuxSignalsReference() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'catchable' | 'uncatchable' | 'realtime'>('all')

  const t = translations[lang]
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return SIGNALS.filter(s => {
      const matchFilter = filter === 'all' || (filter === 'catchable' && s.catchable) || (filter === 'uncatchable' && !s.catchable) || (filter === 'realtime' && s.realtime)
      const matchSearch = !q || String(s.num).includes(q) || s.name.toLowerCase().includes(q) || s.action.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      return matchFilter && matchSearch
    })
  }, [search, filter])

  const filters = [
    { key: 'all' as const, label: t.all },
    { key: 'catchable' as const, label: t.catchableOnly },
    { key: 'uncatchable' as const, label: t.uncatchable },
    { key: 'realtime' as const, label: t.realtime },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <Terminal size={18} className="text-white" />
            </div>
            <span className="font-semibold">Linux Signals Reference</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Languages size={14} />{lang.toUpperCase()}
            </button>
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="https://github.com/gmowses/linux-signals-reference" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {filters.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${filter === f.key ? 'bg-red-500 border-red-500 text-white' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-zinc-400">{t.showing} {filtered.length} {t.of} {SIGNALS.length} {t.signals}</div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 w-14">{t.number}</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 w-32">{t.name}</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 w-32">{t.action}</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 w-24">{t.catchable}</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">{t.description}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-zinc-400">{t.noResults}</td></tr>
                  ) : filtered.map(s => (
                    <tr key={s.num} className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-colors ${!s.catchable ? 'bg-red-50/50 dark:bg-red-900/5' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}>
                      <td className="px-4 py-3 font-mono font-bold text-red-500 tabular-nums">{s.num}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-xs">{s.name}</span>
                        {s.realtime && <span className="ml-1 text-[9px] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-1 py-0.5 rounded font-medium">RT</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${ACTION_COLORS[s.action]}`}>{ACTION_FULL[s.action]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${s.catchable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400 font-bold'}`}>
                          {s.catchable ? t.yes : t.no}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">{s.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3">{t.note}</p>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>{t.builtBy} <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-red-500 transition-colors">Gabriel Mowses</a></span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
