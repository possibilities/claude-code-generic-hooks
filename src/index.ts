import { Command } from 'commander'
import packageJson from '../package.json' assert { type: 'json' }
import { storeCommand } from './commands/store.js'
import { yoloCommand } from './commands/yolo.js'
import {
  activityStartCommand,
  activityStopCommand,
} from './commands/activity.js'
import { extractErrorMessage } from './utils/errorHandling.js'

async function main() {
  const program = new Command()

  program
    .name('claude-code-generic-hooks')
    .description('Generic hooks for Claude')
    .version(packageJson.version)

  program
    .command('store')
    .description('Store JSON data from stdin into SQLite database')
    .argument('<database>', 'Path to SQLite database file')
    .action(async (database: string) => {
      await storeCommand(database)
    })

  program
    .command('yolo')
    .description('Approve or reject tool usage based on JSON input from stdin')
    .action(async () => {
      await yoloCommand()
    })

  const activityCommand = program
    .command('activity')
    .description('Track activity start and stop events')

  activityCommand
    .command('start')
    .description('Record activity start event')
    .argument('<database>', 'Path to SQLite database file')
    .action(async (database: string) => {
      await activityStartCommand(database)
    })

  activityCommand
    .command('stop')
    .description('Record activity stop event and show duration')
    .argument('<database>', 'Path to SQLite database file')
    .action(async (database: string) => {
      await activityStopCommand(database)
    })

  try {
    program.exitOverride()
    program.configureOutput({
      writeErr: str => process.stderr.write(str),
    })

    await program.parseAsync(process.argv)
  } catch (error: any) {
    if (
      error.code === 'commander.help' ||
      error.code === 'commander.helpDisplayed' ||
      error.code === 'commander.version'
    ) {
      process.exit(0)
    }
    console.error('Error:', extractErrorMessage(error))
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
