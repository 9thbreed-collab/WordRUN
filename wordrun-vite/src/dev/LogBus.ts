type LogLevel = 'info'|'warn'|'error'
type LogEntry = { t:number; lvl:LogLevel; tag:string; msg:string; data?:any }

class Bus {
  private entries: LogEntry[] = []
  private listeners: Array<(e:LogEntry)=>void> = []
  max = 1000
  paused = true

  on(fn:(e:LogEntry)=>void){ this.listeners.push(fn) }
  off(fn:(e:LogEntry)=>void){ this.listeners = this.listeners.filter(f=>f!==fn) }

  private push(e:LogEntry){
    if (this.paused) return
    this.entries.push(e)
    if (this.entries.length > this.max) this.entries.shift()
    for (const fn of this.listeners) try { fn(e) } catch {}
  }

  all(){ return [...this.entries] }
  clear(){ this.entries = [] }

  log(tag:string, msg:string, data?:any){ this.push({t:Date.now(), lvl:'info', tag, msg, data}) }
  warn(tag:string, msg:string, data?:any){ this.push({t:Date.now(), lvl:'warn', tag, msg, data}) }
  error(tag:string, msg:string, data?:any){ this.push({t:Date.now(), lvl:'error', tag, msg, data}) }
}

export const LogBus = new Bus()
export type { LogEntry, LogLevel }