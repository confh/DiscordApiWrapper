import { Client, ComponentTypes } from "../client";
import { ButtonInteraction, Interaction, ModalInteraction, StringSelectMenuInteraction } from "./Interactions";
import { Message } from "./Message";

type COLLECTOR_EVENTS = "collect" | "end";
export type InteractionType<T extends ComponentTypes[]> = T[number] extends ComponentTypes.BUTTON ? ButtonInteraction :
  T[number] extends ComponentTypes.STRING_SELECT ? StringSelectMenuInteraction :
  T[number] extends ComponentTypes.TEXT_INPUT ? never :
  Interaction

/** Collector object */
export class Collector<T extends ComponentTypes[]> {
  private timer: Timer;
  private client: Client;
  private listeners: {
    event: COLLECTOR_EVENTS;
    callback: (...args: any[]) => any;
  }[] = [];
  public type: ComponentTypes[];
  public messageId: string;
  public timeout?: number;
  public filter?: (i: InteractionType<T>) => boolean;

  constructor(
    message: Message,
    client: Client,
    options?: {
      timeout?: number;
      component_type?: T;
      filter?: (i: InteractionType<T>) => boolean;
    },
  ) {
    this.messageId = message.id;
    this.client = client;
    this.type = options?.component_type || [ComponentTypes.BUTTON];
    this.filter = options?.filter;
    if (options?.timeout) {
      this.timeout = options?.timeout;
      this.timer = setTimeout(() => {
        this.end();
      }, options.timeout);
    }
  }

  /**
   * Listen for events
   * @param event Event name
   * @param callback The event callback
   */
  on(event: COLLECTOR_EVENTS, callback: (
    interaction: InteractionType<T>
  ) => any) {
    this.listeners.push({
      event,
      callback,
    });
  }

  /**
   * End the collector and execute the end event
   */
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

  /**
   * Reset the collector's timer
   */
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

  /**
   * Emit an event
   * @param event Event name
   * @param type Component type
   * @param args Event arguments
   */
  emit(event: COLLECTOR_EVENTS, type: ComponentTypes, ...args: any[]): void {
    if (!this.type.includes(type)) return;
    for (let i = 0; i < this.listeners.length; i++) {
      const listener = this.listeners[i];
      if (listener.event === event) {
        listener.callback(...args);
        break;
      }
    }
  }
}

/** Modal collector object */
export class ModalCollector {
  private timer: Timer;
  private client: Client;
  private listeners: {
    event: COLLECTOR_EVENTS;
    callback: (i: ModalInteraction) => any;
  }[] = [];
  public customId: string;
  public timeout?: number;
  public filter?: (i: ModalInteraction) => boolean;

  constructor(
    customId: string,
    client: Client,
    options?: {
      timeout?: number;
      filter?: (i: ModalInteraction) => boolean;
    },
  ) {
    this.customId = customId;
    this.client = client;
    this.filter = options?.filter;
    if (options?.timeout) {
      this.timeout = options?.timeout;
      this.timer = setTimeout(() => {
        this.end();
      }, options.timeout);
    }
  }

  /**
   * Listen for events
   * @param event Event name
   * @param callback The event callback
   */
  on(event: COLLECTOR_EVENTS, callback: (i: ModalInteraction) => any) {
    this.listeners.push({
      event,
      callback,
    });
  }

  /**
   * End the collector and execute the end event
   */
  end(): void {
    const endListener = this.listeners.find((a) => a.event === "end");
    if (endListener) endListener.callback(null);
    for (let i = 0; i < this.client.modalCollectors.length; i++) {
      const collector = this.client.modalCollectors[i];
      if (collector.customId === this.customId) {
        this.client.modalCollectors.splice(i, 1);
        break;
      }
    }
  }

  /**
   * Reset the collector's timer
   */
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

  /**
   * Remove a listener
   * @param event Event name
   */
  off(event: COLLECTOR_EVENTS): void {
    for (let i = 0; i < this.listeners.length; i++) {
      const listener = this.listeners[i];
      if (listener.event === event) {
        this.listeners.splice(i, 1);
        break;
      }
    }
  }

  /**
   * Emit an event
   * @param event Event name
   * @param args Event arguments
   */
  emit(event: COLLECTOR_EVENTS, interaction: ModalInteraction): void {
    for (let i = 0; i < this.listeners.length; i++) {
      const listener = this.listeners[i];
      if (listener.event === event) {
        listener.callback(interaction);
        break;
      }
    }
  }
}
