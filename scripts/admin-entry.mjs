import * as Vue from 'vue';
import TDesignPlugin from 'tdesign-vue-next';
import * as TDesignExports from 'tdesign-vue-next';
import { MdEditor } from 'md-editor-v3';

window.Vue = Vue;
// Merge default export (install method) with named exports (MessagePlugin etc.)
window.TDesign = Object.assign({}, TDesignExports, TDesignPlugin);
window.MdEditor = MdEditor;
