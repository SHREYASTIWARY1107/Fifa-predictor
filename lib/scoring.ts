export function calculatePoints(
  homePred: number,
  awayPred: number,
  homeScore: number,
  awayScore: number
): number {
  if (homePred === homeScore && awayPred === awayScore) {
    return 3;
  }

  const predResult = Math.sign(homePred - awayPred);
  const actualResult = Math.sign(homeScore - awayScore);

  return predResult === actualResult ? 1 : 0;
}
