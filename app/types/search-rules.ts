import type { Filter, SearchRuleConditions } from 'meilisearch'
import { isVersionAtLeast } from '@/utils'

export const MIN_SEARCH_RULE_VERSION = '1.54.0'
export const supportsSearchRules = (version?: string | null) => !!version
    && /^v?\d+\.\d+\.\d+(?:[-+].*)?$/.test(version)
    && isVersionAtLeast(version, MIN_SEARCH_RULE_VERSION)
    && !(version.replace(/^v/, '').split('-')[0] === MIN_SEARCH_RULE_VERSION && version.includes('-'))

// The 0.62 SDK sends DSR bodies unchanged, but its action types predate Meilisearch 1.54.
export type RulePin = { id: string; position: number; indexUid?: string | null }
export type RuleScale = { weight: number; ids?: string[]; filter?: Filter; indexUid?: string | null }
export type RuleActions = { pin?: RulePin[]; scale?: RuleScale[] }
export type RuleActionEntry = { type: 'pin'; value: RulePin } | { type: 'scale'; value: RuleScale }
export type Rule = {
    uid: string
    description?: string | null
    precedence?: number | null
    active?: boolean
    conditions?: SearchRuleConditions
    actions: RuleActions
}
export type RuleUpdate = Partial<Omit<Rule, 'uid'>>
