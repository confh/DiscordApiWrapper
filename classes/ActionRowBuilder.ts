import ButtonBuilder from "./ButtonBuilder";

type SUPPORTED_ELEMENTS = ButtonBuilder

export default class ActionRowBuilder {
    public components!: Array<SUPPORTED_ELEMENTS>;

    setComponents(...args: Array<SUPPORTED_ELEMENTS>) {
        this.components = args
        return this
    }

    setComponentsArray(components: Array<SUPPORTED_ELEMENTS>) {
        this.components = components
        return this
    }

    toJson() {
        const JSONArray: any[] = []
        for (let i = 0; i < this.components.length; i++) {
            const component = this.components[i];
            JSONArray.push(component.toJson())
        }

        return {
            type: 1,
            components: JSONArray
        }
    }
}