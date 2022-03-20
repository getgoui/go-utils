import { Component, Event, EventEmitter, h, Prop, State } from '@stencil/core';

@Component({
  tag: 'wc-output',
})
export class WcOutput {
  @Prop() usage: string = '';

  @State() copied: boolean = false;

  @Event() copy: EventEmitter<any>;
  copyClick() {
    this.copy.emit();
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 2000);
  }

  render() {
    const { copied, usage } = this;
    return (
      <div class="usage">
        <go-accordion multiple>
          <go-accordion-item heading="Usage">
            <div class="output">
              <div class="output-controls">
                <go-button compact outline color="secondary" disabled={copied} onClick={() => this.copyClick()}>
                  {copied ? (
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
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </go-button>
              </div>
              <pre>
                <code>{usage}</code>
              </pre>
            </div>
          </go-accordion-item>
        </go-accordion>
      </div>
    );
  }
}
