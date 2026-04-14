export const abTestService = {
  /**
   * Взвешенный случайный выбор из списка элементов.
   * Каждый элемент должен содержать поле `weight` (положительное число).
   */
  weightedRandom<T extends { weight: number }>(items: T[]): T {
    if (items.length === 0) throw new Error('weightedRandom: empty items array')
    if (items.length === 1) return items[0]!

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
    let random = Math.random() * totalWeight

    for (const item of items) {
      random -= item.weight
      if (random <= 0) return item
    }

    // Fallback (floating point edge case)
    return items[items.length - 1]!
  },
}
