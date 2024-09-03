import { Client, ComponentTypes } from "../client";
import { Message } from "./Message";

type COLLECTOR_EVENTS = "collect" | "end";

export class Collector {
  private timer: Timer;
  private client: Client;
  private listeners: {
    event: COLLECTOR_EVENTS;
    callback: (...args: any[]) => any;
  }[] = [];
  public type: ComponentTypes;
  public messageId: string;
  public timeout?: number;

  constructor(
    message: Message,
    client: Client,
    options?: {
      timeout?: number;
      component_type?: ComponentTypes;
    },
  ) {
    this.messageId = message.id;
    this.client = client;
    this.type = options?.component_type || ComponentTypes.BUTTON;
    if (options?.timeout) {
      this.timeout = options?.timeout;
      this.timer = setTimeout(() => {
        this.end();
      }, options.timeout);
    }
  }

  on(event: COLLECTOR_EVENTS, callback: (...args: any[]) => any) {
    this.listeners.push({
      event,
      callback,
    });
  }

  end(): void {
    const endListener = this.listeners.find((a) => a.event === "end");
    if (endListener) endListener.callback();
    for (let i = 0; i < this.client.collectors.length; i++) {
      const collector = this.client.collectors[i];
      if (collector.messageId === this.messageId) {
        this.client.collectors.splice(i, 1);
        break;
      }
    }
  }

  resetTimer(): void {
    if (this.timeout) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.end();
      }, this.timeout);
    } else {
      console.warn("This collector does not have a timer.");
    }
  }

  off(event: COLLECTOR_EVENTS): void {
    for (let i = 0; i < this.listeners.length; i++) {
      const listener = this.listeners[i];
      if (listener.event === event) {
        this.listeners.splice(i, 1);
        break;
      }
    }
  }

  emit(event: COLLECTOR_EVENTS, type: ComponentTypes, ...args: any[]): void {
    if (type !== this.type) return;
    for (let i = 0; i < this.listeners.length; i++) {
      const listener = this.listeners[i];
      if (listener.event === event) {
        listener.callback(...args);
        break;
      }
    }
  }
}
