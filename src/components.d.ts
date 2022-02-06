/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { IProp } from "./components/demo-components/demo-playground/demo-playground";
export namespace Components {
    interface DarkModeToggle {
    }
    interface DemoControls {
    }
    interface DemoPlayground {
        "block": boolean;
        "props": IProp[] | string;
        /**
          * query selector for the component to apply props to
         */
        "tag": string;
    }
}
declare global {
    interface HTMLDarkModeToggleElement extends Components.DarkModeToggle, HTMLStencilElement {
    }
    var HTMLDarkModeToggleElement: {
        prototype: HTMLDarkModeToggleElement;
        new (): HTMLDarkModeToggleElement;
    };
    interface HTMLDemoControlsElement extends Components.DemoControls, HTMLStencilElement {
    }
    var HTMLDemoControlsElement: {
        prototype: HTMLDemoControlsElement;
        new (): HTMLDemoControlsElement;
    };
    interface HTMLDemoPlaygroundElement extends Components.DemoPlayground, HTMLStencilElement {
    }
    var HTMLDemoPlaygroundElement: {
        prototype: HTMLDemoPlaygroundElement;
        new (): HTMLDemoPlaygroundElement;
    };
    interface HTMLElementTagNameMap {
        "dark-mode-toggle": HTMLDarkModeToggleElement;
        "demo-controls": HTMLDemoControlsElement;
        "demo-playground": HTMLDemoPlaygroundElement;
    }
}
declare namespace LocalJSX {
    interface DarkModeToggle {
    }
    interface DemoControls {
    }
    interface DemoPlayground {
        "block"?: boolean;
        "onLoaded"?: (event: CustomEvent<HTMLElement>) => void;
        "props"?: IProp[] | string;
        /**
          * query selector for the component to apply props to
         */
        "tag"?: string;
    }
    interface IntrinsicElements {
        "dark-mode-toggle": DarkModeToggle;
        "demo-controls": DemoControls;
        "demo-playground": DemoPlayground;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "dark-mode-toggle": LocalJSX.DarkModeToggle & JSXBase.HTMLAttributes<HTMLDarkModeToggleElement>;
            "demo-controls": LocalJSX.DemoControls & JSXBase.HTMLAttributes<HTMLDemoControlsElement>;
            "demo-playground": LocalJSX.DemoPlayground & JSXBase.HTMLAttributes<HTMLDemoPlaygroundElement>;
        }
    }
}
