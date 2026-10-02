// @ts-ignore
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
});

// @ts-ignore
globalThis.window = dom.window;
// @ts-ignore
globalThis.document = dom.window.document;
try {
  Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
} catch {
  // @ts-ignore
  globalThis.navigator = dom.window.navigator;
}
// @ts-ignore
globalThis.HTMLElement = dom.window.HTMLElement;
// @ts-ignore
globalThis.HTMLInputElement = dom.window.HTMLInputElement;
// @ts-ignore
globalThis.HTMLButtonElement = dom.window.HTMLButtonElement;
// @ts-ignore
globalThis.customElements = dom.window.customElements;
