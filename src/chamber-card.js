import "./chamber-card-editor.js";

const HaPanelLovelace = customElements.get("ha-panel-lovelace");
const HuiMasonryView = customElements.get("hui-masonry-view");
const LitElement =
  window.LitElement ||
  (HaPanelLovelace ? Object.getPrototypeOf(HaPanelLovelace) : undefined) ||
  (HuiMasonryView ? Object.getPrototypeOf(HuiMasonryView) : undefined);

if (!LitElement) {
  throw new Error("Chamber Card could not find LitElement in Home Assistant.");
}

const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const DEFAULT_ACTIVE_COLOR = "#fcd663";

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

class ChamberCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
      descriptionContent: { type: String },
      extraLineContent: { type: String },
    };
  }

  constructor() {
    super();
    this._holdTimeout = null;
    this._holdThreshold = 700;
    this._heldEntity = null;
    this._tapTimeout = null;
    this._tapCount = 0;
    this._actionTriggered = false;
    this._suppressNextClick = false;
  }

  static getConfigElement() {
    return document.createElement("chamber-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "sensor.example",
      name: "Chamber",
      chamberCaption: "",
      chamberIcon: "mdi:sofa",
      navigation_path: "",
      temperature_entity: "sensor.temperature",
      humidity_entity: "sensor.humidity",
      description_as_entity: false,
      description_value: "",
      extra_line_as_entity: false,
      extra_line_value: "",
      compact_layout: false,
      active_color: DEFAULT_ACTIVE_COLOR,
      show_brightness: false,
      show_temperature: true,
      show_humidity: true,
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
  }

  setConfig(config) {
    const normalizedConfig = normalizeButtonMapping(config);

    this.config = {
      active_color: DEFAULT_ACTIVE_COLOR,
      ...normalizedConfig,
      buttons: normalizedConfig.buttons || Array(7).fill({ entity: "", tap_action: {}, hold_action: {} }),
    };
  }

  getCardSize() {
    return this._isCompactLayout() ? 2 : 3;
  }

  _isCompactLayout() {
    return Boolean(this.config?.compact_layout);
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      ha-card {
        display: grid;
        grid-template-rows: auto 1fr auto;
        grid-template-columns: 2fr 1fr;
        container-type: size;
        padding: 1%;
        font-family: var(--paper-font-body1_-_font-family, var(--primary-font-family));
        height: 100%;
        box-sizing: border-box;
        aspect-ratio: 1 / 1;
        overflow: hidden;
        position: relative;
      }
      ha-card.compact-layout {
        height: auto;
        min-height: 0;
        aspect-ratio: 4 / 3;
      }
      .header {
        display: flex;
        flex-direction: column;
        align-items: start;
        justify-content: start;
        position: absolute;
        left: 0;
        top: 0;
        right: 25%;
        bottom: 28%;
        padding-left: 6%;
        padding-top: 4%;
        padding-right: 5%;
        padding-bottom: 2.8%;
        overflow: hidden;
      }
      .header.compact-layout {
        bottom: 0;
        padding-right: 6%;
        padding-bottom: 3.8%;
      }
      .chamber-caption-text {
        font-weight: bold;
        font-size: clamp(0.92rem, 7.8cqi, 1.24rem);
        line-height: 1.15;
        letter-spacing: 0.015em;
        text-align: left;
        width: 100%;
        box-sizing: border-box;
      }
      .header-content {
        flex: 1 1 auto;
        min-height: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .chamber-condition-text {
        font-size: clamp(0.72rem, 5.8cqi, 1rem);
        line-height: 1.25;
        color: rgba(221, 221, 221, 0.35);
        font-weight: bold;
        max-width: 100%;
        margin-top: 0.1em;
        letter-spacing: 0.015em;
        width: 100%;
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 0.2em;
        overflow: hidden;
        white-space: normal;
        text-align: left;
      }
      .header.compact-layout .chamber-condition-text {
        font-size: clamp(0.64rem, 5.1cqi, 0.92rem);
        line-height: 1.18;
        gap: 0.14em;
      }
      .description-line {
        flex: 0 0 auto;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .metrics-slot {
        flex: 1 1 auto;
        min-height: 0.6em;
        display: flex;
        align-items: center;
        overflow: hidden;
      }
      .metric-list {
        display: flex;
        flex-direction: column;
        gap: 0.15em;
        max-width: 100%;
        overflow: hidden;
      }
      .header.compact-layout .metric-list {
        gap: 0.08em;
      }
      .metric-row {
        display: flex;
        align-items: center;
        gap: 0.35em;
        min-height: 0;
        max-width: 100%;
        overflow: hidden;
      }
      .metric-row span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .metric-icon {
        --mdc-icon-size: clamp(0.86rem, 5.1cqi, 1.1em);
        position: static;
        display: inline-flex;
        width: clamp(0.86rem, 5.1cqi, 1.1em);
        height: clamp(0.86rem, 5.1cqi, 1.1em);
        min-width: clamp(0.86rem, 5.1cqi, 1.1em);
        color: currentColor;
      }
      .inline-icon-text {
        display: inline-flex;
        align-items: center;
        gap: 0.35em;
      }
      .extra-line {
        flex: 0 0 auto;
        margin-top: auto;
        margin-bottom: 0;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-height: 1.1em;
      }
      .chamber-icon-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        grid-column: 1 / 3;
        height: 100%;
        width: 100%;
        padding: 0;
        margin: 0;
        z-index: 0;
      }
      .background-circle {
        width: 72%;
        aspect-ratio: 1 / 1;
        border-radius: 12.5% 12.5% 25% 12.5%;
        background-color: rgba(221, 221, 221, 0.05);
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        left: 1%;
        top: 2%;
      }
      .warning-badge {
        position: absolute;
        top: 10%;
        right: 10%;
        width: 24%;
        max-width: 2.2em;
        aspect-ratio: 1 / 1;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 193, 7, 0.18);
        border: 1px solid rgba(255, 193, 7, 0.55);
        z-index: 2;
      }
      .warning-badge ha-icon {
        position: static;
        width: 60%;
        height: 60%;
        color: #ffc107;
      }
      ha-icon {
        --mdc-icon-size: 75%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        height: 50%;
        width: 50%;
        bottom: 14%;
        right: 10%;
        color: rgba(221, 221, 221, 0.35);
      }
      .buttons-bottom-container {
        width: 75%;
        height: 25%;
        position: absolute;
        bottom: 0;
        left: 0;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        padding: 0;
        z-index: 1;
        color: rgba(221, 221, 221, 0.35);
      }
      .bottom-button-container {
        background-color: rgba(221, 221, 221, 0.05);
        border-radius: 50%;
        width: 30%;
        aspect-ratio: 1 / 1;
        display: flex;
        align-items: center;
        justify-content: flex-center;
        flex-direction: row;
        margin: 2%;
        position: relative;
      }
      .bottom-button-icon-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }
      .bottom-button-icon-container ha-icon {
        width: 100%;
        height: 100%;
        color: rgba(221, 221, 221, 0.35);
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }
      .bottom-button-icon-container ha-state-icon,
      .right-button-icon-container ha-state-icon {
        width: 100%;
        height: 100%;
        color: rgba(221, 221, 221, 0.35);
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }
      .buttons-right-container {
        width: 25%;
        height: 100%;
        position: absolute;
        top: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        padding: 0;
        z-index: 1;
        color: rgba(221, 221, 221, 0.35);
      }
      .buttons-right-container.compact-layout {
        height: auto;
        top: 2%;
        bottom: 2%;
        justify-content: flex-start;
      }
      .buttons-right-container.compact-layout .right-button-container {
        width: auto;
        height: 30%;
        margin: 6%;
      }
      .right-button-container {
        background-color: rgba(221, 221, 221, 0.05);
        border-radius: 50%;
        height: 22%;
        margin: 6%;
        aspect-ratio: 1 / 1;
        display: flex;
        align-items: center;
        justify-content: flex-center;
        flex-direction: row;
        position: relative;
      }
      .right-button-icon-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }
      .right-button-icon-container ha-icon {
        width: 100%;
        height: 100%;
        color: rgba(221, 221, 221, 0.35);
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }
      .bottom-button-container, .right-button-container {
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
      .bottom-button-container:hover, .right-button-container:hover {
        background-color: rgba(252, 214, 99, 0.3);
      }
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this._updateDescription();
  }

  updated(changedProps) {
    super.updated(changedProps);
    if (changedProps.has("config")) {
      this._updateDescription();
    }
  }

  async _updateDescription() {
    this.descriptionContent = await this._getDescriptionValue(this.config.description_value);
    this.extraLineContent = await this._getDescriptionValue(
      this.config.extra_line_value,
      this.config.extra_line_as_entity
    );
  }

  async _getDescriptionValue(descriptionValue, isEntity = this.config?.description_as_entity) {
    if (!descriptionValue) {
      return "";
    }

    if (isEntity) {
      const entity = this.hass?.states?.[descriptionValue];
      return entity ? entity.state : "";
    } else if (typeof descriptionValue === "string" && (descriptionValue.includes("{{") || descriptionValue.includes("{%"))) {
      try {
        const renderedTemplate = await this.hass.callApi("POST", "template", { template: descriptionValue });
        return renderedTemplate || "";
      } catch (error) {
        console.error("Error rendering template:", error);
        return "Template Error";
      }
    } else {
      return descriptionValue;
    }
  }

  _renderInlineIconText(content) {
    if (!content || typeof content !== "string") {
      return content || "";
    }

    const iconPattern = /(mdi:[a-z0-9-]+)/gi;
    const matches = [...content.matchAll(iconPattern)];

    if (!matches.length) {
      return content;
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match) => {
      const [icon] = match;
      const index = match.index ?? 0;

      if (index > lastIndex) {
        parts.push(content.slice(lastIndex, index));
      }

      parts.push(html`<ha-icon class="metric-icon" icon="${icon}"></ha-icon>`);
      lastIndex = index + icon.length;
    });

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return html`
      <span class="inline-icon-text">
        ${parts}
      </span>
    `;
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    const entityId = this.config.entity;
    const entity = entityId ? this.hass.states[entityId] : null;
    const mainEntityUnavailable = this._isMainEntityUnavailable(entityId, entity);

    const chamberCaption = this.config.chamberCaption || "Unnamed";
    const chamberIcon = this.config.chamberIcon || "mdi:sofa";
    const temperature = this.config.show_temperature ? this._getSensorValue(this.config.temperature_entity) : null;
    const humidity = this.config.show_humidity ? this._getSensorValue(this.config.humidity_entity) : null;
    const brightness = this.config.show_brightness && !mainEntityUnavailable
      ? this._getBrightness(entity?.attributes?.brightness)
      : null;
    const compactLayout = this._isCompactLayout();
    const isEntityActive = mainEntityUnavailable ? false : this._isEntityActive(entity);
    const cardActiveColor = this._getActiveColor(this.config.active_color);
    const cardStyle = isEntityActive ? `background-color: ${this._mixColor(cardActiveColor, 10)};` : "";
    const iconStyle = isEntityActive ? `color: ${cardActiveColor};` : "";
    const backgroundCircleStyle = isEntityActive
      ? `background-color: ${this._mixColor(cardActiveColor, 20)};`
      : "background-color: rgba(221, 221, 221, 0.05);";
    const textStyle = isEntityActive ? `color: ${cardActiveColor};` : "";
    const cardClass = compactLayout ? "compact-layout" : "";
    const headerClass = compactLayout ? "header compact-layout" : "header";
    const rightButtonsClass = compactLayout ? "buttons-right-container compact-layout" : "buttons-right-container";
    const infoRows = [];

    if (temperature !== null) {
      infoRows.push(html`
        <div class="metric-row">
          <ha-icon class="metric-icon" icon="mdi:thermometer"></ha-icon>
          <span>${temperature}\u00B0</span>
        </div>
      `);
    }

    if (humidity !== null) {
      infoRows.push(html`
        <div class="metric-row">
          <ha-icon class="metric-icon" icon="mdi:water-percent"></ha-icon>
          <span>${humidity}%</span>
        </div>
      `);
    }

    if (brightness !== null) {
      infoRows.push(html`
        <div class="metric-row">
          <ha-icon class="metric-icon" icon="mdi:brightness-6"></ha-icon>
          <span>${brightness}%</span>
        </div>
      `);
    }

    return html`
      <ha-card class="${cardClass}" style="${cardStyle}">
        <div class="${headerClass}">
          <div class="chamber-caption-text" style="${textStyle}">${chamberCaption}</div>
          <div class="header-content">
            <div class="chamber-condition-text" style="${textStyle}">
              ${this.descriptionContent
                ? html`<div class="description-line">${this._renderInlineIconText(this.descriptionContent)}</div>`
                : ""}
              ${infoRows.length
                ? html`
                    <div class="metrics-slot">
                      <div class="metric-list">${infoRows}</div>
                    </div>
                  `
                : html`<div class="metrics-slot"></div>`}
              ${this.extraLineContent
                ? html`<div class="extra-line">${this._renderInlineIconText(this.extraLineContent)}</div>`
                : ""}
            </div>
          </div>
        </div>
        <div
          class="chamber-icon-container"
          @pointerdown="${(e) => this._startHold(e, entityId)}"
          @pointerup="${(e) => this._endHold(e)}"
          @pointercancel="${() => this._cancelHold()}"
          @pointerleave="${() => this._cancelHold()}"
          @click="${(e) => this._handleTap(e, this.config.navigation_path, "navigate") }"
        >
          <div class="background-circle" style="${backgroundCircleStyle}">
            <ha-icon icon="${chamberIcon}" style="${iconStyle}"></ha-icon>
            ${mainEntityUnavailable
              ? html`
                  <div class="warning-badge" title="Main entity unavailable">
                    <ha-icon icon="mdi:alert-circle"></ha-icon>
                  </div>
                `
              : html``}
          </div>
        </div>
        <div class="${rightButtonsClass}">
          ${this._renderRightButton(this.config.button1_entity, this.config.button1_action, this.config.button1_color)}
          ${this._renderRightButton(this.config.button2_entity, this.config.button2_action, this.config.button2_color)}
          ${this._renderRightButton(this.config.button3_entity, this.config.button3_action, this.config.button3_color)}
          ${compactLayout ? html`` : this._renderRightButton(this.config.button7_entity, this.config.button7_action, this.config.button7_color)}
        </div>
        ${compactLayout ? html`` : html`
          <div class="buttons-bottom-container">
            ${this._renderBottomButton(this.config.button4_entity, this.config.button4_action, this.config.button4_color)}
            ${this._renderBottomButton(this.config.button5_entity, this.config.button5_action, this.config.button5_color)}
            ${this._renderBottomButton(this.config.button6_entity, this.config.button6_action, this.config.button6_color)}
          </div>
        `}
      </ha-card>
    `;
  }

  _renderRightButton(buttonEntity, buttonAction, buttonColor) {
    if (!buttonEntity || buttonEntity === "") {
      return html``;
    }

    const entity = this.hass.states[buttonEntity];
    const isOn = this._isEntityActive(entity);
    const activeColor = this._getActiveColor(buttonColor);

    return html`
      <div
        class="right-button-container"
        style="background-color: ${isOn ? this._mixColor(activeColor, 20) : "rgba(221, 221, 221, 0.05)"};"
        @pointerdown="${(e) => this._startHold(e, buttonEntity)}"
        @pointerup="${(e) => this._endHold(e)}"
        @pointercancel="${() => this._cancelHold()}"
        @pointerleave="${() => this._cancelHold()}"
        @click="${(e) => this._handleTap(e, buttonEntity, buttonAction)}"
      >
        <div class="right-button-icon-container ha-icon">
          <ha-state-icon
            .hass=${this.hass}
            .stateObj=${entity}
            .state=${entity}
            style="color: ${isOn ? activeColor : "rgba(221, 221, 221, 0.35)"};"
          ></ha-state-icon>
        </div>
      </div>
    `;
  }

  _renderBottomButton(buttonEntity, buttonAction, buttonColor) {
    if (!buttonEntity || buttonEntity === "") {
      return html``;
    }

    const entity = this.hass.states[buttonEntity];
    const isOn = this._isEntityActive(entity);
    const activeColor = this._getActiveColor(buttonColor);

    return html`
      <div
        class="bottom-button-container"
        style="background-color: ${isOn ? this._mixColor(activeColor, 20) : "rgba(221, 221, 221, 0.05)"};"
        @pointerdown="${(e) => this._startHold(e, buttonEntity)}"
        @pointerup="${(e) => this._endHold(e)}"
        @pointercancel="${() => this._cancelHold()}"
        @pointerleave="${() => this._cancelHold()}"
        @click="${(e) => this._handleTap(e, buttonEntity, buttonAction)}"
      >
        <div class="bottom-button-icon-container ha-icon">
          <ha-state-icon
            .hass=${this.hass}
            .stateObj=${entity}
            .state=${entity}
            style="color: ${isOn ? activeColor : "rgba(221, 221, 221, 0.35)"};"
          ></ha-state-icon>
        </div>
      </div>
    `;
  }

  _getActiveColor(colorValue) {
    return colorValue || this.config?.active_color || DEFAULT_ACTIVE_COLOR;
  }

  _mixColor(colorValue, percentage) {
    return `color-mix(in srgb, ${colorValue} ${percentage}%, transparent)`;
  }

  _getSensorValue(sensorId) {
    if (!sensorId) {
      return null;
    }

    const sensor = this.hass.states[sensorId];
    if (!sensor || typeof sensor.state !== "string") {
      return null;
    }

    const normalizedState = sensor.state.toLowerCase();
    if (["unknown", "unavailable"].includes(normalizedState)) {
      return null;
    }

    const value = parseFloat(sensor.state);
    return isNaN(value) ? null : Math.round(value);
  }

  _getBrightness(brightness) {
    if (brightness === null || typeof brightness !== "number" || brightness <= 0) {
      return null;
    }
    return Math.max(1, Math.round((brightness / 255) * 100));
  }

  _isMainEntityUnavailable(entityId, entity) {
    if (!entityId) {
      return false;
    }

    if (!entity || typeof entity.state !== "string") {
      return true;
    }

    return ["unavailable", "unknown"].includes(entity.state.toLowerCase());
  }

  _isEntityActive(entity) {
    if (!entity || typeof entity.state !== "string") {
      return false;
    }

    const normalizedState = entity.state.toLowerCase();
    const domain = entity.entity_id?.split(".")[0];

    if (domain === "media_player") {
      return !["off", "unavailable", "unknown"].includes(normalizedState);
    }

    if (["person", "device_tracker"].includes(domain)) {
      return normalizedState === "home";
    }

    if (["on", "open", "opening", "unlocked", "true", "home"].includes(normalizedState)) {
      return true;
    }

    if (["off", "closed", "closing", "locked", "false", "not_home"].includes(normalizedState)) {
      return false;
    }

    return false;
  }

  _navigate(url) {
    if (url.startsWith("http")) {
      window.open(url, "_blank");
    } else {
      window.history.pushState({}, "", url);
      window.dispatchEvent(new Event("location-changed"));
    }
  }

  _startHold(e, buttonEntity) {
    this._cancelHold();
    this._actionTriggered = false;
    this._heldEntity = buttonEntity;
    this._holdTimeout = setTimeout(() => {
      if (this._actionTriggered) {
        return;
      }

      this._actionTriggered = true;
      this._suppressNextClick = true;
      this._handleHoldAction(this._heldEntity);
    }, this._holdThreshold);
  }

  _endHold(e) {
    this._cancelHold();
    if (this._actionTriggered) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  _cancelHold() {
    if (this._holdTimeout) {
      clearTimeout(this._holdTimeout);
      this._holdTimeout = null;
    }
  }

  _handleTap(e, buttonEntity, buttonAction) {
    if (this._suppressNextClick) {
      e.preventDefault();
      e.stopPropagation();
      this._suppressNextClick = false;
      this._actionTriggered = false;
      return;
    }

    this._tapCount++;
    if (this._tapCount === 1) {
      this._tapTimeout = setTimeout(() => {
        if (this._tapCount === 1) {
          this._handleAction(buttonAction, buttonEntity);
        }
        this._tapCount = 0;
      }, 300);
    } else if (this._tapCount === 2) {
      clearTimeout(this._tapTimeout);
      this._handleAction("double-tap", buttonEntity);
      this._tapCount = 0;
    }
  }

  _handleHoldAction(buttonEntity) {
    if (buttonEntity === this.config.entity) {
      if (this._isMainEntityUnavailable(this.config.entity, this.hass?.states?.[this.config.entity])) {
        return;
      }
      this._handleAction("toggle", buttonEntity);
    } else {
      this._handleAction("more-info", buttonEntity);
    }
  }

  _handleAction(action, entityId) {
    console.log("Action received:", action, "for entity:", entityId);

    if (!action || typeof action !== "string") {
      console.error("Invalid action:", action);
      return;
    }

    switch (action) {
      case "toggle":
        this._toggleEntity(entityId);
        break;
      case "more-info":
        this._showMoreInfo(entityId);
        break;
      case "navigate":
        this._navigate(entityId);
        break;
      default:
        console.error("Unknown action:", action);
    }
  }

  _toggleEntity(actionEntityID) {
    if (actionEntityID) {
      this.hass.callService("homeassistant", "toggle", {
        entity_id: actionEntityID,
      });
    }
  }

  _showMoreInfo(actionEntityID) {
    console.log("More info for entity:", actionEntityID);
    const event = new Event("hass-more-info", { bubbles: true, composed: true });
    event.detail = { entityId: actionEntityID };
    this.dispatchEvent(event);
  }
}

customElements.define("chamber-card", ChamberCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "chamber-card",
  name: "Chamber Card",
  description: "A room and area card with status text, sensors, and quick actions.",
  preview: true,
});
