import { describe, expect, it } from 'vitest' // Assuming Vitest for testing
import { rangeStringToNumbers } from '../src/utils'

describe('rangeStringToNumbers', () => {
  it('should parse single numbers correctly', () => {
    expect(rangeStringToNumbers('1')).toEqual([1])
    expect(rangeStringToNumbers('5')).toEqual([5])
    expect(rangeStringToNumbers('0')).toEqual([0])
  })

  it('should parse ranges correctly', () => {
    expect(rangeStringToNumbers('1-3')).toEqual([1, 2, 3])
    expect(rangeStringToNumbers('3-5')).toEqual([3, 4, 5])
    expect(rangeStringToNumbers('0-0')).toEqual([0])
  })

  it('should handle mixed input of numbers and ranges', () => {
    expect(rangeStringToNumbers('1,2-4,6')).toEqual([1, 2, 3, 4, 6])
    expect(rangeStringToNumbers('3-5,7,9-10')).toEqual([3, 4, 5, 7, 9, 10])
  })

  it('should handle overlapping and sequential ranges properly', () => {
    expect(rangeStringToNumbers('1-3,2-4,5')).toEqual([1, 2, 3, 2, 3, 4, 5])
  })

  it('should handle edge cases', () => {
    expect(rangeStringToNumbers('')).toEqual([])
    expect(rangeStringToNumbers('10-10')).toEqual([10])
    expect(rangeStringToNumbers('0-2,4-4,6')).toEqual([0, 1, 2, 4, 6])
  })

  it('should handle invalid input strings gracefully', () => {
    expect(rangeStringToNumbers('a')).toEqual([Number.NaN])
    expect(rangeStringToNumbers('1-')).toEqual([0, 1])
    // Will not generate from -3 to 5
    // It is read as `0-3,5`
    expect(rangeStringToNumbers('-3,5')).toMatchInlineSnapshot([0, 1, 2, 3, 5])
  })
})
