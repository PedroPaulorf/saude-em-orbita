/** Educational mission simulation; input rates are hypothetical, not NASA IMM parameters. */
export interface Scenario {
  seed: number; trials: number; crewSize: number; days: number; availableResources: number
  conditions: { id: string; ratePerPersonDay: number; resourcesPerEvent: number }[]
}

export const scenarioSchema = {
  type: 'object', additionalProperties: false,
  required: ['seed', 'trials', 'crewSize', 'days', 'availableResources', 'conditions'],
  properties: {
    seed: { type: 'integer', minimum: 0, maximum: 4294967295 },
    trials: { type: 'integer', minimum: 100, maximum: 5000 },
    crewSize: { type: 'integer', minimum: 1, maximum: 12 }, days: { type: 'integer', minimum: 1, maximum: 1000 },
    availableResources: { type: 'integer', minimum: 0, maximum: 1000000 },
    conditions: { type: 'array', minItems: 1, maxItems: 10, items: {
      type: 'object', additionalProperties: false, required: ['id', 'ratePerPersonDay', 'resourcesPerEvent'],
      properties: { id: { type: 'string', minLength: 1, maxLength: 80 },
        ratePerPersonDay: { type: 'number', minimum: 0, maximum: 0.01 },
        resourcesPerEvent: { type: 'integer', minimum: 0, maximum: 1000 } },
    } },
  },
}

export function simulate(input: Scenario) {
  let state = input.seed >>> 0
  const random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return (state + 0.5) / 4294967296 }
  const events: number[] = [], resources: number[] = []
  let shortfalls = 0
  for (let t = 0; t < input.trials; t++) {
    let count = 0, used = 0
    for (const condition of input.conditions) {
      const mean = condition.ratePerPersonDay * input.days * input.crewSize
      // Poisson arrivals sampled using exponential waiting times.
      let clock = -Math.log(random()), n = 0
      while (clock < mean) { n++; clock += -Math.log(random()) }
      count += n
      used += n * condition.resourcesPerEvent
    }
    events.push(count); resources.push(used)
    if (used > input.availableResources) shortfalls++
  }
  const summary = (values: number[]) => {
    values.sort((a, b) => a - b)
    return { mean: values.reduce((a, b) => a + b, 0) / values.length,
      p05: values[Math.floor((values.length - 1) * 0.05)], p95: values[Math.floor((values.length - 1) * 0.95)] }
  }
  return { modelVersion: 'health7-educational-poisson-v1', simulated: true, referenceId: '20180006877',
    notice: 'Hypothetical educational scenario. Not NASA IMM, a diagnosis or a validated risk prediction.',
    assumptions: ['Independent events with constant rates', 'One shared resource unit', 'No treatment effects, evacuation or mortality modeled'],
    seed: input.seed, trials: input.trials, events: summary(events), resources: summary(resources),
    resourceShortfallFraction: shortfalls / input.trials }
}
