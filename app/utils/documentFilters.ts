import type { FilterableAttributes, GranularFilterableAttribute, IndexField } from 'meilisearch'
import { isVersionAtLeast } from '@/utils'

type FilterFeatures = GranularFilterableAttribute['features']
export type FilterField = Pick<IndexField, 'name'> & FilterFeatures['filter'] & Pick<FilterFeatures, 'facetSearch'>

export const filterValueTypes = [
    { label: 'Text', value: 'text' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
] as const
export type FilterValueType = typeof filterValueTypes[number]['value']

export const filterOperators = [
    { label: 'is (=)', value: '=' },
    { label: 'is not (!=)', value: '!=' },
    { label: 'greater than (>)', value: '>' },
    { label: 'at least (>=)', value: '>=' },
    { label: 'less than (<)', value: '<' },
    { label: 'at most (<=)', value: '<=' },
    { label: 'any of (IN)', value: 'IN' },
    { label: 'none of (NOT IN)', value: 'NOT IN' },
    { label: 'exists', value: 'EXISTS' },
    { label: 'does not exist', value: 'NOT EXISTS' },
    { label: 'is null', value: 'IS NULL' },
    { label: 'is not null', value: 'IS NOT NULL' },
    { label: 'is empty', value: 'IS EMPTY' },
    { label: 'is not empty', value: 'IS NOT EMPTY' },
] as const
export type FilterOperator = typeof filterOperators[number]['value']
export type FilterCondition = { id: number, field: string, operator: FilterOperator, valueType: FilterValueType, value: string }
export type FilterGroup = { id: number, join: 'AND' | 'OR', conditions: FilterCondition[] }
export type FilterBuilderState = { join: FilterGroup['join'], groups: FilterGroup[], nextId: number }

export function createFilterBuilderState(): FilterBuilderState {
    return { join: 'AND', groups: [{ id: 1, join: 'AND', conditions: [] }], nextId: 1 }
}

export function filterFields(settings: FilterableAttributes | null | undefined, knownFields: string[]): FilterField[] {
    const names = new Set<string>(knownFields)
    for (const entry of settings ?? []) {
        if (typeof entry === 'string' && !entry.includes('*')) names.add(entry)
        if (typeof entry !== 'string') {
            for (const pattern of entry.attributePatterns) if (!pattern.includes('*')) names.add(pattern)
        }
    }

    return [...names].filter(name => name !== '_geo' && name !== '_geojson').map((name) => {
        const features = { name, equality: false, comparison: false, facetSearch: false }
        for (const entry of settings ?? []) {
            if (typeof entry === 'string') {
                if (matchesPattern(entry, name) || (!entry.includes('*') && name.startsWith(`${entry}.`))) {
                    Object.assign(features, { equality: true, comparison: true, facetSearch: true })
                    break
                }
            } else if (entry.attributePatterns.some(pattern => matchesPattern(pattern, name))) {
                Object.assign(features, { equality: entry.features.filter.equality, comparison: entry.features.filter.comparison, facetSearch: entry.features.facetSearch })
                break
            }
        }
        return features
    }).filter(field => field.equality || field.comparison || field.facetSearch).sort((a, b) => a.name.localeCompare(b.name))
}

function matchesPattern(pattern: string, field: string): boolean {
    const escaped = pattern.split('*').map(part => part.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')).join('.*')
    return new RegExp(`^${escaped}$`).test(field)
}

export function quoteFilterValue(value: string): string {
    return `'${value.replace(/\\|'/g, char => `\\${char}`).replaceAll('\u0000', '\\0')}'`
}

export function quoteFilterField(name: string): string {
    return /^[\p{L}_][\p{L}\p{N}_.-]*$/u.test(name) && !/^(AND|OR|NOT|IN|TO|EXISTS|IS|NULL|EMPTY)$/i.test(name)
        ? name
        : quoteFilterValue(name)
}

export function compileCondition(condition: FilterCondition, fields: FilterField[], version: string | null): string {
    const field = fields.find(item => item.name === condition.field)
    if (!field) throw new Error('Choose a filterable attribute.')
    const comparison = ['>', '>=', '<', '<='].includes(condition.operator)
    if (comparison ? !field.comparison : !field.equality) throw new Error(`${field.name} does not support this operator.`)
    if (comparison && condition.valueType === 'boolean') throw new Error('Boolean values cannot be compared as a range.')
    if (comparison && condition.valueType === 'text' && (!version || !isVersionAtLeast(version, '1.15.0'))) {
        throw new Error('Text comparisons require Meilisearch 1.15 or later.')
    }
    if (['IS NULL', 'IS NOT NULL', 'IS EMPTY', 'IS NOT EMPTY'].includes(condition.operator) && (!version || !isVersionAtLeast(version, '1.2.0'))) {
        throw new Error('This operator requires Meilisearch 1.2 or later.')
    }

    const name = quoteFilterField(condition.field)
    if (['EXISTS', 'NOT EXISTS', 'IS NULL', 'IS NOT NULL', 'IS EMPTY', 'IS NOT EMPTY'].includes(condition.operator)) return `${name} ${condition.operator}`
    const rawValue = String(condition.value)
    const rawValues = ['IN', 'NOT IN'].includes(condition.operator) ? rawValue.split(',').map(value => value.trim()) : [rawValue.trim()]
    if (rawValues.some(value => !value)) throw new Error(`Enter a value for ${condition.field}.`)
    const values = rawValues.map((value) => {
        if (condition.valueType === 'number') {
            const number = Number(value)
            if (!Number.isFinite(number)) throw new Error(`${condition.field} needs a valid number.`)
            return String(number)
        }
        if (condition.valueType === 'boolean') {
            if (value !== 'true' && value !== 'false') throw new Error(`Choose true or false for ${condition.field}.`)
            return value
        }
        return quoteFilterValue(value)
    })
    return ['IN', 'NOT IN'].includes(condition.operator)
        ? `${name} ${condition.operator} [${values.join(', ')}]`
        : `${name} ${condition.operator} ${values[0]}`
}

export function compileGroups(groups: FilterGroup[], join: 'AND' | 'OR', fields: FilterField[], version: string | null): string | null {
    const expressions = groups.filter(group => group.conditions.length).map((group) => {
        const parts = group.conditions.map(condition => compileCondition(condition, fields, version))
        return parts.length > 1 ? `(${parts.join(` ${group.join} `)})` : parts[0]!
    })
    return expressions.length ? expressions.join(` ${join} `) : null
}
