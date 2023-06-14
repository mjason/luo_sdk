import got, { type ExtendOptions, type Got } from 'got';
import { randomUUID } from "crypto";
import {pipeline as streamPipeline} from 'node:stream/promises';
import stream from 'node:stream';

export interface SparkClientOptions {
  token: string;
  url?: string;
  limit?: number;
}

export interface SparkCompletionsOptions {
  temperature?: number;
  messages?: Array<{role: string, content: string}>;
  uid?: string;
  auditing?: string;
  domain?: string;
  max_tokens?: number;
  stream?: boolean;
  streamCallback?: (chunk: any, content: string) => void;
}

export interface SparkEmbeddingOptions {
  input: string;
}

export interface ChatCompletion {
  choices: Choice[];
  created: number;
  id: string;
  object: string;
  usage: Usage;
}

export interface Choice {
  finish_reason: null | string;
  index: number;
  message: Message;
}

export interface Message {
  content: string;
  role: string;
}

export interface Usage {
  completion_tokens: number;
  prompt_tokens: number;
  question_tokens: number;
  total_tokens: number;
}


export class SparkClient {
  private client: Got;
  private retry: number;
  constructor(options: SparkClientOptions) {
    const retry = options.limit || 0;
    const url = options.url || 'https://api.listenai.com/v1';

    const clientOptions: ExtendOptions = {
      retry: {
        limit: retry
      },
      responseType: 'json',
      prefixUrl: url,
      headers: {
        'Authorization': `Bearer ${options.token}`
      }
    };
    this.client = got.extend(clientOptions);
    this.retry = retry;
  }

  async completions(options: SparkCompletionsOptions) : Promise<ChatCompletion> {
    const messages = options.messages;
    const temperature = options.temperature || 0;
    const uid = options.uid || randomUUID().replace(/-/g, '');
    const auditing = options.auditing || 'default';
    const domain = options.domain || 'general';
    const max_tokens = options.max_tokens || 1024;
    const stream = options.stream || false;

    const requestOptions = {
      json: {
        random_threshold: temperature,
        messages,
        uid,
        auditing,
        domain,
        max_tokens,
        stream,
      }
    };
    if (stream) {
      return this.completions_stream('spark/completions', requestOptions, options.streamCallback);
    }
    let response = await this.client.post<ChatCompletion>('spark/completions', requestOptions);
    return response.body;
  }

  async completions_stream(path: string, options: any, callback: (chunk: any, content: string) => void) {
    var body: any = {};
    var content = '';
    const regex = /data: (.+?)\n(?!data: \[DONE\])/;
    const fn = async function*(source){
      for await (const chunk of source) {
        let result = chunk.toString();
        if (regex.exec(result)) {
          const json = JSON.parse(regex.exec(result)[1]);
          content += json?.choices?.[0]?.delta?.content;
          body = json
        }

        body.choices[0].message = { content: content, role: 'assistant' };
        body.object = 'chat.completion';
        delete body.choices[0].delta;

        if (callback) {
          await callback(result, content);
        }
        yield chunk;
      }
    }
    await streamPipeline(this.client.stream.post(path, options), fn, new stream.PassThrough());
    return body;
  }

  async embedding(options: SparkEmbeddingOptions) {
    return this.client.post('embedding', {json: options});
  }
}