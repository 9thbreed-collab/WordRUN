export type WheelLayoutMode = 'topFixedRandom' | 'clockwiseOrdered'

export function layoutLetters(
  letters: string[],
  radius: number,
  mode: WheelLayoutMode,
  seed: string // word id to keep runs stable
): { x:number; y:number; ch:string }[] {
  const TWO_PI = Math.PI*2
  const top = -Math.PI/2
  const n = letters.length
  if (n <= 0) return []

  if (mode === 'clockwiseOrdered') {
    return letters.map((ch, i) => {
      const a = top + (i * TWO_PI / n)
      return { x: Math.cos(a)*radius, y: Math.sin(a)*radius, ch }
    })
  } else {
    const rest = letters.slice(1)
    const slots = Array.from({length:n-1}, (_,i)=>i+1) // 1..n-1
    const rng = mulberry32(hash(seed))
    shuffleInPlace(slots, rng)
    const all = [{ idx:0, ch:letters[0] }, ...rest.map((ch, i)=>({ idx: slots[i], ch }))]
    return all.map(({idx, ch}) => {
      const a = top + (idx * TWO_PI / n)
      return { x: Math.cos(a)*radius, y: Math.sin(a)*radius, ch }
    })
  }
}

function hash(s:string){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mulberry32(a:number){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
function shuffleInPlace<T>(arr:T[], rng:()=>number){for(let i=arr.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}}