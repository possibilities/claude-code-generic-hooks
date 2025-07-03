import { Command } from 'commander'
import packageJson from '../package.json' assert { type: 'json' }
import { storeCommand } from './commands/store.js'
import { yoloCommand } from './commands/yolo.js'

async function main() {
  const program = new Command()

  program
    .name('claude-code-generic-hooks')
    .description('Generic hooks for Claude Code')
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

  try {
    program.exitOverride()
    program.configureOutput({
      writeErr: str => process.stderr.write(str),
    })

    await program.parseAsync(process.argv)
  } catch (error: any) {
    if (
      error.code === 'commander.help' ||
      error.code === 'commander.helpDisplayed'
    ) {
      process.exit(0)
    }
    console.error('Error:', error.message || error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
