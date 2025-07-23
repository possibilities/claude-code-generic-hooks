// https://gist.github.com/possibilities/3ad34c6c931884219d6890d3ac98b044
// If we keep seeing the error above we can remove this helper and go back to
// displaying errors directly.
export function extractErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return 'Unknown error'
  }

  if (typeof error === 'string') {
    return error
  }

  if (
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  if (
    typeof error === 'object' &&
    'toString' in error &&
    typeof error.toString === 'function'
  ) {
    const stringified = error.toString()
    if (stringified !== '[object Object]') {
      return stringified
    }
  }

  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown error'
  }
}
