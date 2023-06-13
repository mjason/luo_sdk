export class Messages {

  messages: Array<{ role: string, content: string }>;
  systemContent: string;

  constructor() {
    this.messages = [];
  }

  add(role, content) {
    this.messages.push({ role, content });
    return this;
  }

  user(content) {
    return this.add('user', content);
  }

  assistant(content) {
    return this.add('assistant', content);
  }

  system(content) {
    this.systemContent = content;
    return this;
  }

  toArray() {
    if (this.systemContent) {
      this.messages.unshift({ role: 'system', content: this.systemContent });
    }
    return this.messages;
  }
}

export function messagesBuilder() {
  return new Messages();
}