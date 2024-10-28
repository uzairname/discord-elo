import { Env } from '..'
import { App } from './app/App'
import all_event_listeners from './bot/modules/all_event_listeners'
import all_views from './bot/modules/all_views'

export default (env: Env) => new App(env, all_views, all_event_listeners)
