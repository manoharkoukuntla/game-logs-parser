import { DateTime } from 'luxon';

export type LogType =
  | 'log'
  | 'match_event'
  | 'round_event'
  | 'team_name'
  | 'team_scores'
  | 'player_team_change'
  | 'player_killed'
  | 'player_attacked'
  | 'player_assist'
  | 'team_score'
  | 'player_weapon_action';

export type Team = 'Unassigned' | 'Spectator' | 'TERRORIST' | 'CT';

export interface LogDateTime {
  date: string;
  time: string;
  dateTime: DateTime;
}

export interface Log {
  logType: LogType;
  logTime: LogDateTime;
}

export interface RoundEvent extends Log {
  logType: 'round_event';
  event: string;
}

export interface MatchEvent extends Omit<RoundEvent, 'logType'> {
  logType: 'match_event';
  map: string;
}

export interface TeamNameLog extends Log {
  logType: 'team_name';
  team: Team;
  teamName: string;
}

export interface TeamScoresLog extends Log {
  logType: 'team_scores';
  ctScore: number;
  terroristScore: number;
  roundsPlayed: number;
}

export interface PlayerTeamChangeLog extends Log {
  logType: 'player_team_change';
  player: Player;
  previousTeam: Team;
}

export interface Player {
  playerName: string;
  team: Team;
}

export interface PlayerKilledLog extends Log {
  logType: 'player_killed';
  player: Player;
  opponent: Player;
  weapon: string;
  headShot: boolean;
}

export interface PlayerStatus {
  player: Player;
  health: number;
  armor: number;
}

export interface PlayerAttackedLog extends Log {
  logType: 'player_attacked';
  player: Player;
  opponent: Player;
  opponentStatus: PlayerStatus;
  weapon: string;
  damage: number;
  damageArmor: number;
  hitGroup: string;
}

export interface TeamScoreLog extends Log {
  logType: 'team_score';
  team: Team;
  score: number;
  players: number;
}

export interface PlayerAssistLog extends Log {
  logType: 'player_assist';
  player: Player;
  opponent: Player;
}

export interface PlayerWeaponPick extends Log {
  logType: 'player_weapon_action';
  player: Player;
  weapon: string;
}

export type LogData =
  | Log
  | MatchEvent
  | RoundEvent
  | TeamNameLog
  | TeamScoresLog
  | PlayerTeamChangeLog
  | PlayerAttackedLog
  | PlayerKilledLog
  | TeamScoreLog;
