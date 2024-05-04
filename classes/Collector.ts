import { ComponentTypes } from "../Client";
import Message from "./Message";

type COLLECTOR_EVENTS = "collect" | "end"

export default class Collector {
    public type: ComponentTypes
    public messageId: string
    public listeners: {
        event: COLLECTOR_EVENTS,
        callback: (...args) => any
    }[] = []

    constructor(message: Message, options?: {
        timeout?: number,
        component_type?: ComponentTypes
    }) {
        this.messageId = message.id
        this.type = options?.component_type || ComponentTypes.BUTTON
    }

    on(event: COLLECTOR_EVENTS, callback: (...args) => any) {
        this.listeners.push({
            event,
            callback
        })
    }

    off(event: COLLECTOR_EVENTS) {
        for (let i = 0; i < this.listeners.length; i++) {
            const listener = this.listeners[i];
            if (listener.event === event) {
                this.listeners.splice(i, 1)
                break
            }
        }
    }

    emit(event: COLLECTOR_EVENTS, type: ComponentTypes, ...args) {
        if (type !== this.type) return;
        for (let i = 0; i < this.listeners.length; i++) {
            const listener = this.listeners[i];
            if (listener.event === event) {
                listener.callback(...args)
                break
            }
        }
    }
}