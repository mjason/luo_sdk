import { expect, it } from 'vitest';
import { SparkClient } from '../spark.js';
import { messagesBuilder } from '../../schema.js';

it('should be able to create a spark client', async () => {
  const token = process.env.LISTENAI_ACCESS_TOKEN;
  const client = new SparkClient({ token });
  expect(client).toBeDefined();
});

it('should be able to get completions', async () => {
  const token = process.env.LISTENAI_ACCESS_TOKEN;
  const client = new SparkClient({ token });
  const messages = messagesBuilder().user('广州有什么东西玩，十个字内回复').toArray();
  const completions = await client.completions({ messages });

  console.log(JSON.stringify(completions));

  expect(completions).toBeDefined();
});

it('should be able to get completions stream', async () => {
  const token = process.env.LISTENAI_ACCESS_TOKEN;
  const client = new SparkClient({ token });
  const messages = messagesBuilder().user('广州有什么东西玩，十个字内回复').toArray();

  const streamCallback = (chunk, content) => {
    console.log(chunk);
  }

  const completions = await client.completions({ messages, stream: true, streamCallback });

  console.log(JSON.stringify(completions));

  expect(completions).toBeDefined();
});

it('should be able to get embeddings', async () => {
  const token = process.env.LISTENAI_ACCESS_TOKEN;
  const client = new SparkClient({ token });

  const embeddings = await client.embedding({ input: "this is token" });

  console.log(embeddings);

  expect(embeddings).toBeDefined();
})