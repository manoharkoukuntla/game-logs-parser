import { readFile } from './util';
import path from 'path';
import { fileURLToPath } from 'url';

import { parseLog } from './parser';
import { GameRound, RoundStats } from './game/GameRound';
import {
  PlayerAssistLog,
  PlayerAttackedLog,
  PlayerKilledLog,
  PlayerWeaponPick,
  RoundEvent,
  TeamNameLog,
  TeamScoreLog
} from './types';
import console from 'console';
import { Game } from './game/Game';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function solve() {
  const logs: string[] = await readFile(__dirname + '/logs.txt');
  // const data = parseLog(
  //   '11/28/2021 - 20:33:37: "s1mple<30><STEAM_1:1:36968273><TERRORIST>" [1191 -891 -408] killed "apEX<25><STEAM_1:1:14739219><CT>" [2504 -344 -289] with "ak47" (headshot)\n'
  // );
  // console.log(data);
  const parsedLogs = logs
    .map((log) => parseLog(log))
    .filter((log) => log.logType !== 'log');

  const gameRounds: GameRound[] = [];
  let gameRound = new GameRound();

  parsedLogs.forEach((log) => {
    switch (log.logType) {
      case 'round_event': {
        const roundEvent: RoundEvent = log as RoundEvent;
        if (roundEvent.event === 'Round_Start') {
          gameRound.startTime = roundEvent.logTime.dateTime;
          gameRound.clearPlayerRoundStats();
        } else if (roundEvent.event === 'Round_End') {
          gameRound.endTime = roundEvent.logTime.dateTime;
          gameRounds.push(gameRound);
          gameRound = new GameRound();
        }
        break;
      }
      case 'team_name': {
        const teamNameLog: TeamNameLog = log as TeamNameLog;
        gameRound.updateTeamName(teamNameLog);
        break;
      }
      case 'team_score': {
        const teamScore: TeamScoreLog = log as TeamScoreLog;
        gameRound.updateTeamScore(teamScore);
        break;
      }
      case 'player_assist': {
        const playerAssist: PlayerAssistLog = log as PlayerAssistLog;
        gameRound.updatePlayerAssists(playerAssist);
        break;
      }
      case 'player_killed': {
        const playerKilled: PlayerKilledLog = log as PlayerKilledLog;
        gameRound.updatePlayerKills(playerKilled);
        break;
      }
      case 'player_attacked': {
        const playerAttack: PlayerAttackedLog = log as PlayerAttackedLog;
        gameRound.updatePlayerAttacks(playerAttack);
        break;
      }
      case 'player_weapon_action': {
        const playerWeapon: PlayerWeaponPick = log as PlayerWeaponPick;
        gameRound.addPlayerUsedWeapon(playerWeapon);
        break;
      }
      default:
        break;
    }
  });
  const validRounds = gameRounds.filter(
    (round) => round.startTime !== round.endTime
  );

  const game = new Game(validRounds);
  const stats = game.getGameStats();
  const gameStats = {
    ctRoundsWon: stats.ct,
    terroristRoundsWon: stats.terrorist,
    ctScore: stats.ctScore,
    terroristScore: stats.terroristScore,
    ctName: stats.ctTeamName,
    terroristName: stats.terroristTeamName,
    terroristMvp: stats.terroristMvp,
    ctMvp: stats.ctMvp,
    averageRoundTime: stats.averageRoundTime
  };

  console.log('Game Stats');
  console.table(gameStats);

  stats.gameStats.forEach((round, index) => {
    console.log(
      `<================== Stats for round ${index + 1} ==================>`
    );
    console.table(round.roundStats);
    console.log('Terrorist players stats');
    console.table(round.terroristStats);
    console.log('Counter Terrorist players stats');
    console.table(round.ctStats);
  });
}

await solve();
