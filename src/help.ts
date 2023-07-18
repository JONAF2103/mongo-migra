interface CommandSpec {
  command: string;
  usage: string;
  description: string;
}

function showCommandSpec(commandSpec: CommandSpec): void {
  console.log(`Command: ${commandSpec.command}`);
  console.log(`Usage: ${commandSpec.usage}`);
  console.log(`Description: ${commandSpec.description}\n`);
}

function showCommandSpecs(commandSpecs: CommandSpec[]): void {
  for (const commandSpec of commandSpecs) {
    showCommandSpec(commandSpec);
  }
}

export function showHelp(): void {
  console.group('Command Syntax: ');
  console.log('mongo-migra config=<optional> action=<create/delete/init/status/up/down> <parameters:name=value>\n');
  console.groupEnd();
  console.group('Here are a list of available commands:\n');
  showCommandSpecs([
    {
      command: 'create',
      usage: 'mongo-migra action=create name=<some name>',
      description: 'Creates a new migration inside the configured migration folder',
    },
    {
      command: 'delete',
      usage: 'mongo-migra action=delete name=<migration folder name>',
      description: 'Deletes the migration from the configured migration folder',
    },
    {
      command: 'down',
      usage: 'mongo-migra action=down amount=<optional number>',
      description: 'Executes a down operation on the latest amount of executed migrations (by default is only the latest one)',
    },
    {
      command: 'init',
      usage: 'mongo-migra action=init',
      description: 'Generates the initial configuration in order to use this program',
    },
    {
      command: 'status',
      usage: 'mongo-migra action=status',
      description: 'Shows the migrations status on the db',
    },
    {
      command: 'up',
      usage: 'mongo-migra action=up',
      description: 'Executes an up operation to migrate up all the pending migrations',
    }
  ]);
  console.groupEnd();
}