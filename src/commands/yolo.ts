export async function yoloCommand(): Promise<void> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    process.stdin.on('data', chunk => {
      chunks.push(chunk)
    })

    process.stdin.on('end', () => {
      try {
        const jsonData = Buffer.concat(chunks).toString().trim()

        if (!jsonData) {
          console.log(
            JSON.stringify({
              decision: undefined,
              reason: 'what a time to be alive',
            }),
          )
          resolve()
          return
        }

        let data: any
        try {
          data = JSON.parse(jsonData)
        } catch (error) {
          console.log(
            JSON.stringify({
              decision: undefined,
              reason: 'what a time to be alive',
            }),
          )
          resolve()
          return
        }

        if (data.hook_event_name !== 'PreToolUse') {
          console.log(
            JSON.stringify({
              decision: undefined,
              reason: 'what a time to be alive',
            }),
          )
          resolve()
          return
        }

        if (data.tool_name === 'ExitPlanMode') {
          console.log(
            JSON.stringify({
              decision: undefined,
              reason: 'plan mode is for making awesome',
            }),
          )
        } else {
          console.log(
            JSON.stringify({
              decision: 'approve',
              reason: 'most of us only live once',
            }),
          )
        }

        resolve()
      } catch (error) {
        reject(error)
      }
    })

    process.stdin.on('error', error => {
      reject(error)
    })
  })
}
