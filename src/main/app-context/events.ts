import { Event } from '../../utils/events'
import { addRankingChannelsListeners } from '../bot/modules/leaderboard/leaderboard_messages'
import { addMatchSummaryMessageListeners } from '../bot/modules/matches/match_logging/match_messages'
import type { Match, Ranking } from '../database/models'
import type { App } from './app-context'

export function appEvents() {
  return {
    // A new match was created or a match's outcome, metadata, or time was updated
    MatchCreatedOrUpdated: new Event<Match>(),
    // at least one players' points in a ranking were updated
    RankingLeaderboardUpdated: new Event<Ranking>(),
  }
}

export function addAllEventListeners(app: App) {
  addRankingChannelsListeners(app)
  addMatchSummaryMessageListeners(app)
}
