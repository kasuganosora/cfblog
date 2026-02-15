// Use the full Vue build (includes template compiler for in-DOM templates)
import * as Vue from 'vue/dist/vue.esm-bundler.js';
import TDesignPlugin from 'tdesign-vue-next';
import * as TDesignExports from 'tdesign-vue-next';
import { MdEditor } from 'md-editor-v3';

window.Vue = Vue;
// Merge default export (install method) with named exports (MessagePlugin etc.)
window.TDesign = Object.assign({}, TDesignExports, TDesignPlugin);
window.MdEditor = MdEditor;
