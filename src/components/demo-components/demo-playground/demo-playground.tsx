import { Component, Host, h, Element, Prop, Event, EventEmitter, State, Watch } from '@stencil/core';
import JSON5 from 'json5';
import copy from 'copy-text-to-clipboard';

export type PropType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'select' | 'multiselect';
export interface IProp {
  name: string;
  value: string | boolean | number;
  type: PropType;
  default: string | boolean | number;
  options?: string[] | { value: string | null; label: string }[];
}
@Component({
  tag: 'demo-playground',
  styleUrl: 'demo-playground.scss',
  shadow: false,
})
export class DemoPlayground {
  @Element() el: HTMLElement;

  /**
   * query selector for the component to apply props to
   */
  @Prop() tag: string = null;

  @Prop({ mutable: true }) props: IProp[] | string;

  @State() propsArray: IProp[] = [];

  @Event({
    eventName: 'loaded',
  })
  loadedEvent: EventEmitter<HTMLElement>;

  loadedComponent: HTMLElement;

  log(...args: any[]) {
    console.trace('[Demo Playground]', ...args);
  }

  componentWillLoad() {
    this.propsArray = typeof this.props === 'string' ? JSON5.parse(this.props) : this.props;
  }

  private targetEl = null;
  componentDidLoad() {
    this.targetEl = this.el.querySelector(this.tag) as HTMLElement;
    if (!this.targetEl) {
      console.error('[Demo Playground] Target element not found');
      return;
    }

    this.applyProps();

    this.log('loaded component ', this.targetEl, 'with props', this.propsArray);
    this.loadedEvent.emit(this.targetEl);
  }

  @Watch('propsArray')
  propsArrayChanged() {
    if (!this.targetEl) {
      return;
    }
    // update target element with new props
    this.applyProps();
  }

  applyProps() {
    this.propsArray.forEach(({ name, value }) => {
      if (value === 'null' || value === null) {
        this.targetEl.removeAttribute(name);
        return;
      }
      this.targetEl[name] = value;
    });
  }

  getUsage() {
    const glue = '\n  ';
    const propOutputs = this.propsArray
      .map(({ name, value, type }) => {
        if (value === 'null' || value === null) {
          return false;
        }
        if (type === 'boolean' && !value) {
          return false;
        }
        if (type === 'object' || type === 'array') {
          try {
            return `${name}="${JSON5.stringify(value, undefined, 2)}"`;
          } catch (e) {
            return false;
          }
        }
        return `${name}="${value}"`;
      })
      .filter(Boolean);
    return `<${this.tag}${propOutputs.length ? glue : ''}${propOutputs.join(glue)}${propOutputs.length ? glue : ''}></${this.tag}>`;
  }

  @State() copied = false;
  copyUsage() {
    copy(this.getUsage());
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 2000);
  }

  /**
   * Get input type based on prop type
   * @param type PropType
   * @returns type attribute for input element
   */
  getInputFromType(type: PropType): string {
    switch (type) {
      case 'number':
        return 'number';
      case 'boolean':
        return 'checkbox';
      default:
        return 'text';
    }
  }

  updatePropValue(e: Event, propObject: IProp) {
    const { name, type } = propObject;
    this.propsArray = this.propsArray
      .map(p => {
        let newValue = (e.target as HTMLInputElement).value as string | boolean;
        if (type === 'boolean') {
          newValue = (e.target as HTMLInputElement).checked;
        }
        if (type === 'object') {
          try {
            newValue = JSON5.parse((e.target as HTMLInputElement).value);
          } catch (e) {
            newValue = null;
          }
        }

        if (p.name === name) {
          if (newValue === null) {
            return { ...p, value: null };
          }
          p.value = newValue;
        }
        return p;
      })
      .filter(Boolean);
  }

  renderPropControl(propObject: IProp) {
    let { value, type, options, name } = propObject;
    if (type === 'boolean') {
      value = !!value;
    }
    const inputType = this.getInputFromType(type);
    if (['object', 'array'].includes(type)) {
      return (
        <div class="prop-control">
          <label htmlFor={name}>
            {name} ({type})
          </label>
          <textarea rows={5} class="input" id={name} onInput={e => this.updatePropValue(e, propObject)}>
            {JSON5.stringify(value, undefined, 2)}
          </textarea>
        </div>
      );
    }

    if (['select', 'multiselect'].includes(type)) {
      return (
        <div class="prop-control">
          <label htmlFor={name}>{name}</label>
          <select class="input" id={name} onInput={e => this.updatePropValue(e, propObject)}>
            {options.map(option => {
              if (option === null) {
                return <option value={null}>null</option>;
              }
              if (typeof option === 'string') {
                return (
                  <option key={option} value={option}>
                    {option}
                  </option>
                );
              }
              const { value, label } = option;
              if (!label) {
                return (
                  <option key={value} value={value}>
                    {value}
                  </option>
                );
              }
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      );
    }

    return (
      <div class="prop-control">
        <label htmlFor={name}>{name}</label>
        <input
          id={name}
          class="input"
          type={inputType}
          value={value as string}
          onInput={e => this.updatePropValue(e, propObject)}
          checked={type === 'boolean' && value !== false}
        />
      </div>
    );
  }

  @State() showConfigPanel = true;

  closeConfigPanel() {
    this.showConfigPanel = false;
  }
  openConfigPanel() {
    this.showConfigPanel = true;
  }

  render() {
    let debug = false;
    return (
      <Host>
        <div class="container">
          <div class="demo-row">
            <div class="demo">
              <div class="demo-bg"></div>
              <div class="demo-content">
                <slot></slot>
              </div>
              {!this.showConfigPanel ? (
                <go-button round class={{ 'control-panel-opener': true }} color="tertiary" icon flat onClick={() => this.openConfigPanel()} aria-label="Open configuration panel">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </go-button>
              ) : null}
            </div>
            <div
              class={{
                'control-panel': true,
                'show': this.showConfigPanel,
              }}
            >
              <div class="control-header">
                <span>Configuration</span>
                <go-button round compact color="tertiary" flat icon onClick={() => this.closeConfigPanel()} aria-label="Close configuration panel">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </go-button>
              </div>
              <div class="props">
                {debug ? <pre>{JSON5.stringify(this.propsArray, undefined, 2)}</pre> : null}
                {this.propsArray.map(propObj => {
                  return (
                    <div class="prop" key={propObj.name}>
                      <div>{this.renderPropControl(propObj)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-tablet-12">
              <div class="usage">
                <go-accordion multiple>
                  <go-accordion-item heading="Output" active={true}>
                    <div class="output">
                      <div class="output-controls">
                        <go-button compact outline color="secondary" disabled={this.copied} onClick={() => this.copyUsage()}>
                          {this.copied ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              viewBox="0 0 24 24"
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              viewBox="0 0 24 24"
                            >
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                          <span>{this.copied ? 'Copied' : 'Copy'}</span>
                        </go-button>
                      </div>
                      <pre>
                        <code>{this.getUsage()}</code>
                      </pre>
                    </div>
                  </go-accordion-item>
                </go-accordion>
              </div>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
