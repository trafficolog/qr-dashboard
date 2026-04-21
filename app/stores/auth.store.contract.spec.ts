import { beforeEach, describe, expect, it } from 'vitest'
import { computed, readonly, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './auth'

describe('pinia v3 contract: auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.assign(globalThis, { ref, computed, readonly })
  })

  it('keeps readonly user exposure while supporting setup-style actions', () => {
    const store = useAuthStore()

    expect(store.isAuthenticated).toBe(false)

    store.setUser({
      id: '5cb7f7d7-8bc2-40a7-b4d2-9790ff4d0800',
      email: 'qa@splat.global',
      name: 'QA',
      role: 'admin',
      avatarUrl: null,
      lastLoginAt: null,
      createdAt: new Date('2026-04-21T00:00:00.000Z'),
      updatedAt: new Date('2026-04-21T00:00:00.000Z'),
    })

    expect(store.user?.email).toBe('qa@splat.global')
    expect(store.isAuthenticated).toBe(true)

    store.clear()
    expect(store.user).toBeNull()
  })
})
