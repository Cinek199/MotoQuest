
export function getRank(level:number) {
  if(level >= 50) return "Legenda";
  if(level >= 25) return "Weteran";
  if(level >= 10) return "Podróżnik";
  return "Nowicjusz";
}
