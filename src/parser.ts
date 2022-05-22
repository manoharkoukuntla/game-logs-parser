import { DateTime } from 'luxon';
import { LOG_DATE_TIME_FORMAT } from './constants';
import {
  LogData,
  LogDateTime,
  LogType,
  MatchEvent,
  PlayerAssistLog,
  PlayerAttackedLog,
  PlayerKilledLog,
  PlayerTeamChangeLog,
  PlayerWeaponPick,
  RoundEvent,
  Team,
  TeamNameLog,
  TeamScoreLog,
  TeamScoresLog
} from './types';

const dateTimeRegex =
  /(?<date>\d{2}\/\d{2}\/\d{4}) - (?<time>\d{2}:\d{2}:\d{2})/;

const roundStartRegex = new RegExp(
  'World triggered "(?<event>Round_Start|Match_Start|Round_End)"'
);
const matchStartRegex = new RegExp(
  'World triggered.*"(?<event>.*)".*on.*"(?<map>.*)"'
);
const teamNameRegex = new RegExp('Team playing "(?<team>.*)": (?<teamName>.*)');
const teamScoresRegex = new RegExp(
  'MatchStatus: Score: (?<ctScore>\\d):(?<terroristScore>\\d) on map "(?<map>.*)" RoundsPlayed: (?<roundsPlayed>.*)'
);
const playerTeamChangeRegex = new RegExp(
  '"(?<playerName>.*)<.*><.*>".*switched from team.*<(?<previousTeam>.*)> to <(?<currentTeam>.*)>'
);
const playerKilledRegex = new RegExp(
  '"(?<playerName>.*)<.*><.*><(?<team>.*)>".*killed.*"(?<opponentPlayerName>.*)<.*><.*><(?<opponentTeam>.*)>".*with "(?<weapon>.*)"(?<headShot>.*)'
);
const playerAttackRegex = new RegExp(
  '"(?<playerName>.*)<.*><.*><(?<team>.*)>".*attacked.*"(?<opponentPlayerName>.*)<.*><.*><(?<opponentTeam>.*)>".*with "(?<weapon>.*)".*(damage "(?<damage>.*)").*(damage_armor "(?<damageArmor>.*)").*(health "(?<health>.*)").*(armor "(?<armor>.*)").*(hitgroup "(?<hitGroup>.*)")'
);
const playerAssistRegex = new RegExp(
  '"(?<playerName>.*)<.*><.*><(?<team>.*)>".*assisted killing.*"(?<opponentPlayerName>.*)<.*><.*><(?<opponentTeam>.*)>"'
);
const teamScoreRegex = new RegExp(
  'Team "(?<team>.*)" scored "(?<score>.*)" with "(?<players>.*)" players'
);
const playerWeaponLog = new RegExp(
  '"(?<playerName>.*)<.*><.*><(?<team>.*)>".*picked up.*"(?<weapon>.*)"'
);

const regExpsAndLogs: Array<{ logType: LogType; regEx: RegExp }> = [
  { logType: 'round_event', regEx: roundStartRegex },
  { logType: 'match_event', regEx: matchStartRegex },
  { logType: 'team_name', regEx: teamNameRegex },
  { logType: 'team_scores', regEx: teamScoresRegex },
  { logType: 'player_team_change', regEx: playerTeamChangeRegex },
  { logType: 'player_attacked', regEx: playerAttackRegex },
  { logType: 'player_killed', regEx: playerKilledRegex },
  { logType: 'team_score', regEx: teamScoreRegex },
  { logType: 'player_assist', regEx: playerAssistRegex },
  { logType: 'player_weapon_action', regEx: playerWeaponLog }
];

export function parseLog(log: string): LogData {
  const dateTimeResult = log.match(dateTimeRegex);
  const date: string = dateTimeResult?.groups?.['date'] || '';
  const time: string = dateTimeResult?.groups?.['time'] || '';

  const logTime: LogDateTime = {
    date,
    time,
    dateTime: DateTime.fromFormat(`${date} ${time}`, LOG_DATE_TIME_FORMAT)
  };

  let result: LogData = { logType: 'log', logTime };

  log = log.replace(dateTimeRegex, '');

  regExpsAndLogs.forEach((regExpsAndLog) => {
    const matchResult = log.match(regExpsAndLog.regEx);
    if (matchResult != null) {
      result.logType = regExpsAndLog.logType;
      result = updateLogData(result, matchResult.groups || {});
    }
  });

  return result;
}

export function updateLogData(
  logData: LogData,
  data: { [index: string]: string }
): LogData {
  switch (logData.logType) {
    case 'log':
      return logData;
    case 'match_event': {
      const result: MatchEvent = {
        ...logData,
        event: data['event'],
        logType: 'match_event',
        map: data['map']
      };
      return result;
    }
    case 'round_event': {
      const result: RoundEvent = {
        ...logData,
        event: data['event'],
        logType: 'round_event'
      };
      return result;
    }
    case 'player_team_change': {
      const result: PlayerTeamChangeLog = {
        ...logData,
        player: {
          playerName: data['playerName'],
          team: getTeam(data['currentTeam'])
        },
        previousTeam: getTeam(data['previousTeam']),
        logType: 'player_team_change'
      };
      return result;
    }
    case 'team_name': {
      const result: TeamNameLog = {
        ...logData,
        logType: 'team_name',
        team: getTeam(data['team']),
        teamName: data['teamName']
      };
      return result;
    }
    case 'team_score': {
      const result: TeamScoreLog = {
        ...logData,
        logType: 'team_score',
        team: getTeam(data['team']),
        score: Number(data['score']),
        players: Number(data['players'])
      };
      return result;
    }
    case 'team_scores': {
      const result: TeamScoresLog = {
        ...logData,
        logType: 'team_scores',
        terroristScore: Number(data['terroristScore']),
        ctScore: Number(data['ctScore']),
        roundsPlayed: Number(data['roundsPlayed'])
      };
      return result;
    }
    case 'player_attacked': {
      const result: PlayerAttackedLog = {
        ...logData,
        logType: 'player_attacked',
        player: {
          playerName: data['playerName'],
          team: getTeam(data['team'])
        },
        opponent: {
          playerName: data['opponentPlayerName'],
          team: getTeam(data['opponentTeam'])
        },
        opponentStatus: {
          player: {
            playerName: data['opponentPlayerName'],
            team: getTeam(data['opponentTeam'])
          },
          armor: Number(data['armor']),
          health: Number(data['health'])
        },
        weapon: data['weapon'],
        damage: Number(data['damage']),
        damageArmor: Number(data['damageArmor']),
        hitGroup: data['hitGroup']
      };
      return result;
    }
    case 'player_killed': {
      const result: PlayerKilledLog = {
        ...logData,
        logType: 'player_killed',
        player: {
          playerName: data['playerName'],
          team: getTeam(data['team'])
        },
        opponent: {
          playerName: data['opponentPlayerName'],
          team: getTeam(data['opponentTeam'])
        },
        weapon: data['weapon'],
        headShot: (data['headShot'] || '').includes('headshot')
      };
      return result;
    }
    case 'player_assist': {
      const result: PlayerAssistLog = {
        ...logData,
        logType: 'player_assist',
        player: {
          playerName: data['playerName'],
          team: getTeam(data['team'])
        },
        opponent: {
          playerName: data['opponentPlayerName'],
          team: getTeam(data['opponentTeam'])
        }
      };
      return result;
    }
    case 'player_weapon_action': {
      const result: PlayerWeaponPick = {
        ...logData,
        logType: 'player_weapon_action',
        player: {
          playerName: data['playerName'],
          team: getTeam(data['team'])
        },
        weapon: data['weapon']
      };
      return result;
    }
    default:
      return logData;
  }
}

export function getTeam(name: string): Team {
  switch (name) {
    case 'Unassigned':
      return 'Unassigned';
    case 'Spectator':
      return 'Spectator';
    case 'CT':
      return 'CT';
    case 'TERRORIST':
      return 'TERRORIST';
    default:
      return 'Unassigned';
  }
}
