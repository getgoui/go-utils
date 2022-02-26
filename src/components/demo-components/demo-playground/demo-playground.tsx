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

export interface ISlot {
  name: string;
  docs?: string;
  checked?: boolean;
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

  @Prop() slots: ISlot[] | string;

  @State() slotsArray: ISlot[] = [];

  @Event({
    eventName: 'loaded',
  })
  loadedEvent: EventEmitter<HTMLElement>;

  loadedComponent: HTMLElement;

  @Prop() block: boolean = false;

  debug = false;

  log(...args: any[]) {
    if (this.debug) {
      console.trace('[Demo Playground]', ...args);
    }
  }

  componentWillLoad() {
    this.propsArray = typeof this.props === 'string' ? JSON5.parse(this.props) : this.props;
    this.slotsArray = typeof this.slots === 'string' ? JSON5.parse(this.slots) : this.slots;
    // console.log(this.el);
    // this.getSlotContents();
  }

  private targetEl = null;
  // @State() slotContents = {};
  componentDidLoad() {
    this.targetEl = this.el.querySelector(this.tag) as HTMLElement;
    if (!this.targetEl) {
      console.error('[Demo Playground] Target element not found');
      return;
    }

    this.handlePropsChange();
    // this.handleSlotsChange();

    this.loadedEvent.emit(this.targetEl);
  }

  @Watch('propsArray')
  handlePropsChange() {
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

  // watch slots array
  // @Watch('slotsArray')
  // handleSlotsChange() {
  //   if (!this.targetEl) {
  //     return;
  //   }
  //   // update target element with new slots
  //   this.applySlots();
  // }

  // get original slot contents and remember them
  // getSlotContents() {
  //   const slots = this.targetEl.querySelectorAll('[slot]');
  //   slots.forEach(slottedEl => {
  //     const slotName = slottedEl.getAttribute('slot');
  //     slottedEl.id = `${slotName}`;
  //     this.slotContents = {
  //       ...this.slotContents,
  //       [slotName]: slottedEl,
  //     };
  //     slottedEl.remove();
  //   });

  //   console.log(this.slotContents);
  // }

  // applySlots() {
  //   this.slotsArray.forEach(({ name, checked }) => {
  //     if (!this.slotContents[name]) {
  //       // no example slot provided.
  //       return;
  //     }
  //     if (checked) {
  //       console.log('add slot', name);
  //       this.targetEl.appendChild(this.slotContents[name]);
  //     } else {
  //       this.slotContents[name].remove();
  //     }
  //   });
  // }

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
            return `${name}="${JSON5.stringify(value, undefined, 4)}"`;
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

  renderSlotControl(slotObject: ISlot) {
    const { name, docs, checked } = slotObject;

    return (
      <div>
        <input
          type="checkbox"
          id={name}
          checked={checked}
          onChange={e => {
            this.slotsArray = this.slotsArray.map(s => {
              if (s.name === name) {
                s.checked = (e.target as HTMLInputElement).checked;
              }
              return s;
            });
          }}
          aria-describedby={name + '_hint'}
        />
        <label htmlFor={name}>{name}</label>
        <p id={name + '_hint'}>{docs}</p>
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
    const { block } = this;
    return (
      <Host>
        <div class="container">
          <div class="demo-row">
            <div class="demo">
              <div class="demo-bg"></div>
              <div class={{ 'demo-content': true, block }}>
                <slot></slot>
              </div>
              {!this.showConfigPanel ? (
                <go-button compact class={{ 'control-panel-opener': true }} color="primary" onClick={() => this.openConfigPanel()} aria-label="Open configuration panel">
                  Configure
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
              <go-accordion class="props" multiple={true}>
                <go-accordion-item heading="Props" active>
                  {this.debug ? <pre>{JSON5.stringify(this.propsArray, undefined, 2)}</pre> : null}
                  {this.propsArray.map(propObj => {
                    return (
                      <div class="prop" key={propObj.name}>
                        <div>{this.renderPropControl(propObj)}</div>
                      </div>
                    );
                  })}
                </go-accordion-item>
                {/* <go-accordion-item heading="Slots" active>
                  {this.debug ? <pre>{JSON5.stringify(this.slotsArray, undefined, 2)}</pre> : null}
                  {this.slotsArray.map(slotObj => {
                    return (
                      <div class="slot" key={slotObj.name}>
                        <div>{this.renderSlotControl(slotObj)}</div>
                      </div>
                    );
                  })}
                </go-accordion-item> */}
              </go-accordion>
            </div>
          </div>
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
      </Host>
    );
  }
}
