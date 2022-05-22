import { GameRound, RoundStats } from './GameRound';

export class Game {
  constructor(private rounds: GameRound[]) {}

  getGameStats() {
    const gameStats = this.rounds.map((round) => {
      const roundStats: RoundStats = round.getRoundStats();
      const terrorists = round.getTerroristPlayerStats();
      const terroristStats = terrorists.map((terrorist) => ({
        ...terrorist,
        weaponsUsed: Array.from(terrorist.weaponsUsed).join(', ')
      }));
      const cts = round.getCtPlayerStats();
      const ctStats = cts.map((ct) => ({
        ...ct,
        weaponsUsed: Array.from(ct.weaponsUsed).join(', ')
      }));

      return {
        terroristStats,
        ctStats,
        roundStats
      };
    });

    const teamStats = gameStats.reduce(
      (result, stat) => ({
        ...result,
        ct: result.ct + (stat.roundStats.teamWon === 'CT' ? 1 : 0),
        terrorist:
          result.terrorist + (stat.roundStats.teamWon === 'TERRORIST' ? 1 : 0),
        ctScore: result.ctScore + stat.roundStats.ctScore,
        terroristScore: result.terroristScore + stat.roundStats.terroristScore
      }),
      { ct: 0, terrorist: 0, ctScore: 0, terroristScore: 0 }
    );

    let terroristMvp = '',
      ctMvp = '';
    const ctKills: { [index: string]: number } = {};
    const terroristKills: { [index: string]: number } = {};

    const kills = {
      ct: ctKills,
      terrorist: terroristKills
    };

    gameStats.forEach((stat) => {
      stat.ctStats.forEach((ctStat) => {
        if (kills.ct[ctStat.playerName])
          kills.ct[ctStat.playerName] += ctStat.kills;
        else kills.ct[ctStat.playerName] = ctStat.kills;
      });

      stat.terroristStats.forEach((terroristStat) => {
        if (kills.terrorist[terroristStat.playerName])
          kills.terrorist[terroristStat.playerName] += terroristStat.kills;
        else kills.terrorist[terroristStat.playerName] = terroristStat.kills;
      });
    });

    let maxCtKills = 0,
      maxTerroristKills = 0;
    for (const player in kills.ct) {
      if (kills.ct[player] > maxCtKills) {
        ctMvp = player;
        maxCtKills = kills.ct[player];
      }
    }
    for (const player in kills.terrorist) {
      if (kills.terrorist[player] > maxTerroristKills) {
        terroristMvp = player;
        maxTerroristKills = kills.terrorist[player];
      }
    }

    const totalRoundsTime = gameStats.reduce(
      (result, stat) => result + (stat.roundStats.roundTimeSeconds || 0),
      0
    );
    const averageRoundTime = totalRoundsTime / gameStats.length;

    return {
      ...gameStats[0].roundStats,
      ...teamStats,
      gameStats,
      winner: teamStats.ctScore > teamStats.terrorist ? 'CT' : 'TERRORIST',
      terroristMvp,
      ctMvp,
      averageRoundTime
    };
  }
}
