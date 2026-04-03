const HaPanelLovelace = customElements.get("ha-panel-lovelace");
const HuiMasonryView = customElements.get("hui-masonry-view");
const LitElement =
  window.LitElement ||
  (HaPanelLovelace ? Object.getPrototypeOf(HaPanelLovelace) : undefined) ||
  (HuiMasonryView ? Object.getPrototypeOf(HuiMasonryView) : undefined);

if (!LitElement) {
  throw new Error("Chamber Card editor could not find LitElement in Home Assistant.");
}

const html = LitElement.prototype.html;

const DEFAULT_CONFIG = {
  chamberCaption: "",
  chamberIcon: "",
  navigation_path: "",
  entity: "",
  description_as_entity: false,
  description_value: "",
  extra_line_as_entity: false,
  extra_line_value: "",
  compact_layout: false,
  active_color: "#fcd663",
  temperature_entity: "",
  humidity_entity: "",
  show_temperature: false,
  show_humidity: false,
  show_brightness: false,
  button1_entity: "",
  button1_action: "more-info",
  button1_color: "",
  button2_entity: "",
  button2_action: "more-info",
  button2_color: "",
  button3_entity: "",
  button3_action: "more-info",
  button3_color: "",
  button4_entity: "",
  button4_action: "more-info",
  button4_color: "",
  button5_entity: "",
  button5_action: "more-info",
  button5_color: "",
  button6_entity: "",
  button6_action: "more-info",
  button6_color: "",
  button7_entity: "",
  button7_action: "more-info",
  button7_color: "",
  button_mapping_version: 2,
};

function normalizeButtonMapping(config) {
  if (!config || config.button_mapping_version === 2) {
    return config;
  }

  return {
    ...config,
    button4_entity: config.button5_entity || "",
    button4_action: config.button5_action || "toggle",
    button4_color: config.button5_color || "",
    button5_entity: config.button6_entity || "",
    button5_action: config.button6_action || "toggle",
    button5_color: config.button6_color || "",
    button6_entity: config.button7_entity || "",
    button6_action: config.button7_action || "toggle",
    button6_color: config.button7_color || "",
    button7_entity: config.button4_entity || "",
    button7_action: config.button4_action || "toggle",
    button7_color: config.button4_color || "",
    button_mapping_version: 2,
  };
}

const TAP_ACTION_OPTIONS = [
  { label: "Toggle", value: "toggle" },
  { label: "More Info", value: "more-info" },
];

class ChamberCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object },
    };
  }

  constructor() {
    super();
    this._config = { ...DEFAULT_CONFIG };
  }

  setConfig(config) {
    this._config = { ...DEFAULT_CONFIG, ...normalizeButtonMapping(config) };
  }

  _computeLabel = (schema) => schema.label;

  _actionSelector() {
    return {
      select: {
        mode: "dropdown",
        options: TAP_ACTION_OPTIONS,
      },
    };
  }

  render() {
    if (!this.hass) return html``;
    if (!this._config) {
      this._config = { ...DEFAULT_CONFIG };
    }

    const schema = [
      {
        name: "chamberCaption",
        type: "string",
        label: "Name",
      },
      {
        name: "chamberIcon",
        selector: {
          icon: {},
        },
        label: "Icon",
      },
      {
        name: "navigation_path",
        type: "string",
        label: "URL",
      },
      {
        name: "entity",
        selector: {
          entity: {},
        },
        label: "Entity",
      },
      {
        name: "active_color",
        type: "string",
        label: "Card Active Color",
      },
      {
        name: "description_as_entity",
        type: "boolean",
        label: "Description - Check for entity state, uncheck for text / template.",
      },
      this._config.description_as_entity
        ? {
            name: "description_value",
            selector: {
              entity: {},
            },
            label: "Description",
          }
        : {
            name: "description_value",
            type: "string",
            label: "Description",
          },
      {
        name: "extra_line_as_entity",
        type: "boolean",
        label: "Info - Check for entity state, uncheck for text / template.",
      },
      this._config.extra_line_as_entity
        ? {
            name: "extra_line_value",
            selector: {
              entity: {},
            },
            label: "Info",
          }
        : {
            name: "extra_line_value",
            type: "string",
            label: "Info",
          },
      {
        name: "show_temperature",
        type: "boolean",
        label: "Show Temperature",
      },
      this._config.show_temperature
        ? {
            name: "temperature_entity",
            selector: {
              entity: {
                domain: "sensor",
              },
            },
            label: "Temperature",
          }
        : {},
      {
        name: "show_humidity",
        type: "boolean",
        label: "Show Humidity",
      },
      this._config.show_humidity
        ? {
            name: "humidity_entity",
            selector: {
              entity: {
                domain: "sensor",
              },
            },
            label: "Humidity",
          }
        : {},
      {
        name: "show_brightness",
        type: "boolean",
        label: "Show Brightness (uses light (group) as card entity).",
      },
      {
        name: "compact_layout",
        type: "boolean",
        label: "Compact Layout (3 Buttons)",
      },
      {
        name: "button1_entity",
        selector: {
          entity: {},
        },
        label: "Button 1 Entity",
      },
      {
        name: "button1_action",
        selector: this._actionSelector(),
        label: "Button 1 Tap Action",
      },
      {
        name: "button1_color",
        type: "string",
        label: "Button 1 Active Color",
      },
      {
        name: "button2_entity",
        selector: {
          entity: {},
        },
        label: "Button 2 Entity",
      },
      {
        name: "button2_action",
        selector: this._actionSelector(),
        label: "Button 2 Tap Action",
      },
      {
        name: "button2_color",
        type: "string",
        label: "Button 2 Active Color",
      },
      {
        name: "button3_entity",
        selector: {
          entity: {},
        },
        label: "Button 3 Entity",
      },
      {
        name: "button3_action",
        selector: this._actionSelector(),
        label: "Button 3 Tap Action",
      },
      {
        name: "button3_color",
        type: "string",
        label: "Button 3 Active Color",
      },
      ...(!this._config.compact_layout
        ? [
            {
              name: "button4_entity",
              selector: {
                entity: {},
              },
              label: "Button 4 Entity",
            },
            {
              name: "button4_action",
              selector: this._actionSelector(),
              label: "Button 4 Tap Action",
            },
            {
              name: "button4_color",
              type: "string",
              label: "Button 4 Active Color",
            },
            {
              name: "button5_entity",
              selector: {
                entity: {},
              },
              label: "Button 5 Entity",
            },
            {
              name: "button5_action",
              selector: this._actionSelector(),
              label: "Button 5 Tap Action",
            },
            {
              name: "button5_color",
              type: "string",
              label: "Button 5 Active Color",
            },
            {
              name: "button6_entity",
              selector: {
                entity: {},
              },
              label: "Button 6 Entity",
            },
            {
              name: "button6_action",
              selector: this._actionSelector(),
              label: "Button 6 Tap Action",
            },
            {
              name: "button6_color",
              type: "string",
              label: "Button 6 Active Color",
            },
            {
              name: "button7_entity",
              selector: {
                entity: {},
              },
              label: "Button 7 Entity",
            },
            {
              name: "button7_action",
              selector: this._actionSelector(),
              label: "Button 7 Tap Action",
            },
            {
              name: "button7_color",
              type: "string",
              label: "Button 7 Active Color",
            },
          ]
        : []),
    ];

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${schema}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  _valueChanged(ev) {
    if (!this._config || !this.hass) {
      return;
    }

    const config = ev.detail.value;
    this._config = { ...DEFAULT_CONFIG, ...normalizeButtonMapping(config) };

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("chamber-card-editor", ChamberCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "chamber-card",
  name: "Chamber Card",
  preview: true,
  description: "An area/room card with quick settings.",
});
