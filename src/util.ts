import events from 'events';
import fs from 'fs';
import readline from 'readline';

export async function readFile(filePath: string): Promise<string[]> {
  const lines: string[] = [];
  try {
    const lineReader = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    });

    lineReader.on('line', (line) => {
      lines.push(line);
    });

    await events.once(lineReader, 'close');

    return lines;
  } catch (err) {
    console.log('There was an error while processing the logs file');
    console.error(err);
    return [];
  }
}
