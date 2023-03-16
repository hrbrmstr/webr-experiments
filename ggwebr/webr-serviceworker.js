"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// webR/compat.ts
var IN_NODE = typeof process !== "undefined" && process.release && process.release.name === "node" && typeof process.browser === "undefined";
var loadScript;
if (globalThis.document) {
  loadScript = (url) => new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
} else if (globalThis.importScripts) {
  loadScript = async (url) => {
    try {
      globalThis.importScripts(url);
    } catch (e) {
      if (e instanceof TypeError) {
        await Promise.resolve().then(() => __toESM(require(url)));
      } else {
        throw e;
      }
    }
  };
} else if (IN_NODE) {
  loadScript = async (url) => {
    const nodePathMod = (await Promise.resolve().then(() => __toESM(require("path")))).default;
    await Promise.resolve().then(() => __toESM(require(nodePathMod.resolve(url))));
  };
} else {
  throw new Error("Cannot determine runtime environment");
}

// webR/utils.ts
function promiseHandles() {
  const out = {
    resolve: (_value) => {
    },
    reject: (_reason) => {
    },
    promise: null
  };
  const promise = new Promise((resolve, reject) => {
    out.resolve = resolve;
    out.reject = reject;
  });
  out.promise = promise;
  return out;
}

// webR/chan/message.ts
var encoder = new TextEncoder();
var decoder = new TextDecoder("utf-8");
function encodeData(data) {
  return encoder.encode(JSON.stringify(data));
}
function decodeData(data) {
  return JSON.parse(decoder.decode(data));
}

// webR/chan/serviceworker.ts
var requests = {};
function handleInstall() {
  console.log("webR service worker installed");
  self.skipWaiting();
}
function handleActivate(event) {
  console.log("webR service worker activating");
  event.waitUntil(self.clients.claim());
}
var sendRequest = async (clientId, uuid) => {
  const client = await self.clients.get(clientId);
  if (!client) {
    throw new Error("Service worker client not found");
  }
  if (!(uuid in requests)) {
    requests[uuid] = promiseHandles();
    client.postMessage({ type: "request", data: uuid });
  }
  const response = await requests[uuid].promise;
  const headers = { "Cross-Origin-Embedder-Policy": "require-corp" };
  return new Response(encodeData(response), { headers });
};
var handleFetch = (event) => {
  const wasmMatch = /__wasm__\/webr-fetch-request\//.exec(event.request.url);
  if (!wasmMatch) {
    return;
  }
  const requestBody = event.request.arrayBuffer();
  const requestReponse = requestBody.then(async (body) => {
    const data = decodeData(new Uint8Array(body));
    return await sendRequest(data.clientId, data.uuid);
  });
  event.waitUntil(requestReponse);
  event.respondWith(requestReponse);
};
function handleMessage(event) {
  switch (event.data.type) {
    case "register-client-main": {
      self.clients.claim();
      const source = event.source;
      self.clients.get(source.id).then((client) => {
        if (!client) {
          throw new Error("Can't respond to client in service worker message handler");
        }
        client.postMessage({
          type: "registration-successful",
          clientId: source.id
        });
      });
      break;
    }
    case "wasm-webr-fetch-response": {
      if (event.data.uuid in requests) {
        requests[event.data.uuid].resolve(event.data.response);
        delete requests[event.data.uuid];
      }
      break;
    }
    default:
      throw new Error(`Unknown service worker message type: ${event.data.type}`);
  }
}
self.addEventListener("install", handleInstall);
self.addEventListener("activate", handleActivate);
self.addEventListener("fetch", handleFetch);
self.addEventListener("message", handleMessage);
//# sourceMappingURL=webr-serviceworker.js.map
