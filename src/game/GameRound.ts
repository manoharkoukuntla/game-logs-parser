import { DateTime } from 'luxon';
import { performance } from 'perf_hooks';

import {
  Player,
  PlayerAssistLog,
  PlayerAttackedLog,
  PlayerKilledLog,
  TeamNameLog,
  Team,
  TeamScoreLog,
  PlayerWeaponPick
} from '../types';

export class GameRound {
  startTime: DateTime = DateTime.now();
  endTime: DateTime = DateTime.now();
  ct: RoundTeam = {
    team: 'CT',
    teamName: '',
    score: 0,
    numPlayers: 0,
    won: false
  };
  terrorist: RoundTeam = {
    team: 'TERRORIST',
    teamName: '',
    score: 0,
    numPlayers: 0,
    won: false
  };
  playerPerformances: Array<PlayerRoundPerformance> = [];

  updateTeamScore(team: TeamScoreLog) {
    if (team.team === 'CT') {
      this.ct.numPlayers = team.players;
      this.ct.score = team.score;
    } else if (team.team === 'TERRORIST') {
      this.terrorist.numPlayers = team.players;
      this.terrorist.score = team.score;
    }
    this.updateTeamWon();
  }

  updateTeamName(team: TeamNameLog) {
    if (team.team === 'CT') {
      this.ct.teamName = team.teamName;
    } else if (team.team === 'TERRORIST') {
      this.terrorist.teamName = team.teamName;
    }
  }

  updatePlayerAssists(data: PlayerAssistLog) {
    const player = this.getPlayerByName(
      data.player.playerName,
      data.player.team
    );
    player.assists++;
  }

  updatePlayerAttacks(data: PlayerAttackedLog) {
    const player = this.getPlayerByName(
      data.player.playerName,
      data.player.team
    );
    player.attacks++;
    player.damageDone += data.damage;
    player.weaponsUsed.add(data.weapon);
    if (data.hitGroup === 'head') {
      player.headShots++;
    }
  }

  updateTeamWon() {
    if (this.ct.score > this.terrorist.score) {
      this.ct.won = true;
      this.terrorist.won = false;
    } else {
      this.terrorist.won = true;
      this.ct.won = false;
    }
  }

  updatePlayerKills(data: PlayerKilledLog) {
    const player = this.getPlayerByName(
      data.player.playerName,
      data.player.team
    );
    player.weaponsUsed.add(data.weapon);
    player.kills++;
  }

  addPlayerUsedWeapon(data: PlayerWeaponPick) {
    const player = this.getPlayerByName(
      data.player.playerName,
      data.player.team
    );
    player.weaponsUsed.add(data.weapon);
  }

  getRoundStats(): RoundStats {
    return {
      startTime: this.startTime.toISOTime(),
      endTime: this.endTime.toISOTime(),
      roundTimeSeconds: this.endTime.diff(this.startTime, 'seconds').toObject()
        .seconds,
      teamWon: this.ct.won ? this.ct.team : this.terrorist.team,
      ctTeamName: this.ct.teamName,
      terroristTeamName: this.terrorist.teamName,
      ctScore: this.ct.score,
      terroristScore: this.terrorist.score
    };
  }

  getTerroristPlayerStats(): PlayerRoundPerformance[] {
    return this.playerPerformances.filter(
      (player) => player.team === 'TERRORIST'
    );
  }

  getCtPlayerStats(): PlayerRoundPerformance[] {
    return this.playerPerformances.filter((player) => player.team === 'CT');
  }

  clearPlayerRoundStats() {
    this.playerPerformances.forEach(performance => {
      performance.assists = 0;
      performance.attacks = 0;
      performance.damageDone = 0;
      performance.headShots = 0;
      performance.kills = 0;
      performance.weaponsUsed = new Set<string>()
    })
  }

  private getPlayerByName(
    playerName: string,
    team: Team
  ): PlayerRoundPerformance {
    let player: PlayerRoundPerformance | undefined =
      this.playerPerformances.find(
        (performance) => performance.playerName === playerName
      );

    if (!player) {
      player = {
        playerName,
        team,
        assists: 0,
        kills: 0,
        attacks: 0,
        weaponsUsed: new Set<string>(),
        damageDone: 0,
        headShots: 0
      };
      this.playerPerformances.push(player);
    }
    return player;
  }
}

export interface RoundTeam {
  team: Team;
  teamName: string;
  score: number;
  numPlayers: number;
  won: boolean;
}

export interface PlayerRoundPerformance extends Player {
  kills: number;
  assists: number;
  attacks: number;
  weaponsUsed: Set<string>;
  damageDone: number;
  headShots: number;
}

export interface RoundStats {
  startTime: string;
  endTime: string;
  roundTimeSeconds: number | undefined;
  teamWon: Team;
  ctTeamName: string;
  terroristTeamName: string;
  ctScore: number;
  terroristScore: number;
}
