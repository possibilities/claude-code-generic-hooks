import { Command } from 'commander'
import packageJson from '../package.json' assert { type: 'json' }

async function main() {
  const program = new Command()

  program
    .name('commanderjs-template')
    .description('A template for creating CLI tools with Commander.js')
    .version(packageJson.version)
    .action(() => {
      console.log('hello world')
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
