import { WcOutput } from './wc-output';
import { Component, Host, h, Element, Prop, Event, EventEmitter, State } from '@stencil/core';
import JSON5 from 'json5';
import copy from 'copy-text-to-clipboard';
import kebabCase from 'lodash.kebabcase';
import { IProp } from './prop.type';

export interface ISlot {
  name: string;
  docs?: string;
  checked?: boolean;
}
@Component({
  tag: 'wc-playground',
  styleUrl: 'wc-playground.scss',
  shadow: false,
})
export class WcPlayground {
  @Element() el: HTMLElement;

  /**
   * query selector for the component to apply props to
   */
  @Prop({ mutable: true }) tag: string;

  @Prop({ mutable: true }) props: IProp[] | string;

  @State() propsArray: IProp[] = [];

  @Prop() slots: ISlot[] | string;

  @State() slotsArray: ISlot[] = [];

  @Prop() code: string = '';

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
  }

  private targetEl: HTMLElement = null;
  componentDidLoad() {
    this.initiateDOM();
    this.loadedEvent.emit(this.targetEl);
  }
  /**
   * initialise demo content with some DOM magic
   */
  demoContentEl: HTMLElement;
  initiateDOM() {
    const { tag } = this;

    this.demoContentEl = this.el.querySelector('#demo-content');
    // parse the code prop and store the initial html for slot usage rendering
    this.demoContentEl.innerHTML = this.code;

    this.targetEl = this.demoContentEl.querySelector(this.tag) as HTMLElement;
    if (!this.targetEl) {
      console.error('[WebComponent Playground] Target element not found');
      return;
    }

    // apply props to target element
    this.propsArray = this.propsArray.map(prop => {
      const attribute = prop.attr ? prop.attr : kebabCase(prop.name);
      return {
        ...prop,
        value: this.targetEl.getAttribute(attribute),
      };
    });

    const patternTagStart = `<${tag}(.*)>`;
    const patternTagEnd = `</${tag}>`;
    const pattern = `${patternTagStart}(.|\n)*?${patternTagEnd}`;

    const matches = this.code.match(new RegExp(pattern, 'gi'));
    if (!matches) {
      console.error('[WebComponent Playground] Tag not found in code');
      return;
    }
    const outerString = matches[0];
    const innerString = outerString
      .replace(new RegExp(patternTagStart, 'gi'), '')
      .replace(new RegExp(patternTagEnd, 'gi'), '')
      .trim();

    const tempSlotsHolder = document.createElement('template');
    tempSlotsHolder.innerHTML = innerString;
    // show/hide options for slots
    console.log(tempSlotsHolder);
  }

  getUsage() {
    if (!this.targetEl) {
      return '';
    }

    const glue = '\n  ';
    const propOutputs = this.propsArray
      .map(({ name, attr, value, type }) => {
        const attribute = attr ? attr : kebabCase(name);
        if (value === 'null' || value === null) {
          return false;
        }
        if (type === 'boolean' && !value) {
          return false;
        }
        if (type === 'object' || type === 'array') {
          try {
            return `${attribute}="${JSON5.stringify(value, undefined, 4)}"`;
          } catch (e) {
            return false;
          }
        }
        return `${attribute}="${value}"`;
      })
      .filter(Boolean);

    const tagName = this.tag;
    return `<${tagName}${propOutputs.length ? glue : ''}${propOutputs.join(glue)}${
      propOutputs.length ? glue : ''
    }></${tagName}>`;
  }

  copyUsage() {
    copy(this.getUsage());
  }

  @State() showConfigPanel = true;

  closeConfigPanel() {
    this.showConfigPanel = false;
  }
  openConfigPanel() {
    this.showConfigPanel = true;
  }

  /**
   * Handle the prop changes
   * @param e propChange custom event from props-panel
   */
  handlePropsChange(e: CustomEvent<IProp[]>) {
    if (!this.targetEl) {
      return;
    }
    // update target element with new props
    this.propsArray = e.detail;
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

  render() {
    const { block, debug } = this;
    return (
      <Host>
        <div class="container">
          <div class="demo-row">
            <div class="demo">
              <div class="demo-bg"></div>
              <div id="demo-content" class={{ 'demo-content': true, block }}>
                <slot></slot>
              </div>
              {!this.showConfigPanel ? (
                <go-button
                  compact
                  class={{ 'control-panel-opener': true }}
                  color="primary"
                  onClick={() => this.openConfigPanel()}
                  aria-label="Open configuration panel"
                >
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
                <go-button
                  round
                  compact
                  color="tertiary"
                  flat
                  icon
                  onClick={() => this.closeConfigPanel()}
                  aria-label="Close configuration panel"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </go-button>
              </div>
              <go-accordion class="props" multiple={true}>
                <go-accordion-item heading="Props" active>
                  <props-panel
                    debug={debug}
                    values={this.propsArray}
                    onPropChange={e => this.handlePropsChange(e)}
                  ></props-panel>
                </go-accordion-item>
              </go-accordion>
              <slot name="controls" />
            </div>
          </div>
          <wc-output onCopy={() => this.copyUsage()} usage={this.getUsage()} />
        </div>
      </Host>
    );
  }
}
