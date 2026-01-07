export const ThemeSwitch = { useSupabase:false, active:'winter' as 'base'|'winter' };

export const Styles = {
  base:{ bgGradient:[0x0d0f14,0x151a22], lineColor:0xffffff, lineAlpha:0.9, dotFill:0x00e5ff, vignetteAlpha:0.35, greatPill:{fill:0xffffff,text:0x2a2f38}, wheel:{lineWidth:6,nodeRadius:26,glow:true} },
  winter:{ bgGradient:[0x0a0e14,0x0e2430], lineColor:0xbfe9ff, lineAlpha:1.0, dotFill:0xffffff, vignetteAlpha:0.45, greatPill:{fill:0xffffff,text:0x103142}, wheel:{lineWidth:6,nodeRadius:26,glow:true} }
};

export function localTheme(){ return Styles[ThemeSwitch.active]; }