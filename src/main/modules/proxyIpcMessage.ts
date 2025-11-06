import { BrowserWindow } from "electron";
import { createLogger } from "./createLogger";

type WebContents = {
  _events: Record<string | symbol, any>;
  session: { _events: Record<string | symbol, any>; partition: string };
};

let log = createLogger("IPC Proxy");

// 由于不能互相引用，所以这边只能延迟重新创建
setTimeout(() => {
  log = createLogger("IPC Proxy");
  log("loaded");
}, 100);

// 接收端 & 发送端回调集合（全局）
const ipcReceiveHandlers: Set<IpcCallback> = new Set();
const ipcSendHandlers: Set<IpcCallback> = new Set();
const interceptIpcReceiveHandlers: Set<IpcInterceptCallback> = new Set();
const interceptIpcSendHandlers: Set<IpcInterceptCallback> = new Set();

// 按事件名区分的监听器
const ipcReceiveEventHandlers: Map<string, Set<IpcCallback>> = new Map();
const ipcSendEventHandlers: Map<string, Set<IpcCallback>> = new Map();
const interceptIpcReceiveEventHandlers: Map<string, Set<IpcInterceptCallback>> = new Map();
const interceptIpcSendEventHandlers: Map<string, Set<IpcInterceptCallback>> = new Map();

const proxyFlag = Symbol("isProxyed");

let isProxySession = false;

// 工具函数：确保事件名是数组
function normalizeEventNames(eventName: EventName): string[] {
  return Array.isArray(eventName) ? eventName : [eventName];
}

function normalizeEvents(args: any[], direction: "in" | "out") {
  const len = args.length;
  if (direction === "out") {
    if (isProxySession) {
      return len === 4 ? [args[0], args[2], args[3]] : args.slice(0, 3);
    } else {
      return len === 3 ? [args[0], false, args[1], args[2]] : args.slice(0, 4);
    }
  }
  return len === 3 ? [args[0], false, args[1], args[2]] : args.slice(0, 4);
}

// 添加监听
function onIpcReceive(callback: IpcCallback): Unsubscribe {
  if (typeof callback === "function") {
    ipcReceiveHandlers.add(callback);
    return () => offIpcReceive(callback);
  }
  return () => {};
}

function onIpcSend(callback: IpcCallback): Unsubscribe {
  if (typeof callback === "function") {
    ipcSendHandlers.add(callback);
    return () => offIpcSend(callback);
  }
  return () => {};
}

function onIpcReceiveEvents(eventName: EventName, callback: IpcCallback): Unsubscribe {
  if (typeof callback !== "function") return () => {};
  const names = normalizeEventNames(eventName);
  names.forEach((name) => {
    if (!ipcReceiveEventHandlers.has(name)) {
      ipcReceiveEventHandlers.set(name, new Set());
    }
    ipcReceiveEventHandlers.get(name)!.add(callback);
  });
  return () => offIpcReceiveEvents(eventName, callback);
}

function onIpcSendEvents(eventName: EventName, callback: IpcCallback): Unsubscribe {
  if (typeof callback !== "function") return () => {};
  const names = normalizeEventNames(eventName);
  names.forEach((name) => {
    if (!ipcSendEventHandlers.has(name)) {
      ipcSendEventHandlers.set(name, new Set());
    }
    ipcSendEventHandlers.get(name)!.add(callback);
  });
  return () => offIpcSendEvents(eventName, callback);
}

function interceptIpcReceive(callback: IpcInterceptCallback): Unsubscribe {
  if (typeof callback === "function") {
    interceptIpcReceiveHandlers.add(callback);
    return () => offInterceptIpcReceive(callback);
  }
  return () => {};
}

function interceptIpcSend(callback: IpcInterceptCallback): Unsubscribe {
  if (typeof callback === "function") {
    interceptIpcSendHandlers.add(callback);
    return () => offInterceptIpcSend(callback);
  }
  return () => {};
}

function interceptIpcReceiveEvents(eventName: EventName, callback: IpcInterceptCallback): Unsubscribe {
  if (typeof callback !== "function") return () => {};
  const names = normalizeEventNames(eventName);
  names.forEach((name) => {
    if (!interceptIpcReceiveEventHandlers.has(name)) {
      interceptIpcReceiveEventHandlers.set(name, new Set());
    }
    interceptIpcReceiveEventHandlers.get(name)!.add(callback);
  });
  return () => offInterceptIpcReceiveEvents(eventName, callback);
}

function interceptIpcSendEvents(eventName: EventName, callback: IpcInterceptCallback): Unsubscribe {
  if (typeof callback !== "function") return () => {};
  const names = normalizeEventNames(eventName);
  names.forEach((name) => {
    if (!interceptIpcSendEventHandlers.has(name)) {
      interceptIpcSendEventHandlers.set(name, new Set());
    }
    interceptIpcSendEventHandlers.get(name)!.add(callback);
  });
  return () => offInterceptIpcSendEvents(eventName, callback);
}

// 取消监听
function offIpcReceive(callback: IpcCallback) {
  ipcReceiveHandlers.delete(callback);
}

function offIpcSend(callback: IpcCallback) {
  ipcSendHandlers.delete(callback);
}

function offIpcReceiveEvents(eventName: EventName, callback: IpcCallback) {
  const names = normalizeEventNames(eventName);
  names.forEach((name) => {
    const set = ipcReceiveEventHandlers.get(name);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        ipcReceiveEventHandlers.delete(name);
      }
    }
  });
}

function offIpcSendEvents(eventName: EventName, callback: IpcCallback) {
  const names = normalizeEventNames(eventName);
  names.forEach((name) => {
    const set = ipcSendEventHandlers.get(name);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        ipcSendEventHandlers.delete(name);
      }
    }
  });
}

function offInterceptIpcReceive(callback: IpcInterceptCallback) {
  interceptIpcReceiveHandlers.delete(callback);
}

function offInterceptIpcSend(callback: IpcInterceptCallback) {
  interceptIpcSendHandlers.delete(callback);
}

function offInterceptIpcReceiveEvents(eventName: EventName, callback: IpcInterceptCallback) {
  const names = normalizeEventNames(eventName);
  names.forEach((name) => {
    const set = interceptIpcReceiveEventHandlers.get(name);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        interceptIpcReceiveEventHandlers.delete(name);
      }
    }
  });
}

function offInterceptIpcSendEvents(eventName: EventName, callback: IpcInterceptCallback) {
  const names = normalizeEventNames(eventName);
  names.forEach((name) => {
    const set = interceptIpcSendEventHandlers.get(name);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        interceptIpcSendEventHandlers.delete(name);
      }
    }
  });
}

// 代理逻辑
function proxyIpcMessages(window: BrowserWindow) {
  if (!(window instanceof BrowserWindow)) {
    throw new TypeError("Expected a BrowserWindow instance");
  }

  if ((window as any)[proxyFlag]) return;
  (window as any)[proxyFlag] = true;

  const webContents = window.webContents as unknown as WebContents;
  let events = webContents._events;

  log(`Proxying IPC for window: ${window.id}`);

  if (!events["-ipc-message"]) {
    isProxySession = true;
    events = webContents.session._events;
    log(`Proxying IPC receive for session`);
  } else {
    log(`Proxying IPC receive for webContents`);
  }

  if (!events) {
    log("No events found on webContents or session.");
    return;
  }

  // 代理接收端
  if (events["-ipc-message"] && !events[proxyFlag]) {
    events[proxyFlag] = true;
    const originalReceive = events["-ipc-message"];
    events["-ipc-message"] = new Proxy(originalReceive, {
      apply(target, thisArg, args) {
        const legacyArgs = normalizeEvents(args, "in");
        // 拦截器
        for (const handler of interceptIpcReceiveHandlers) {
          try {
            const result = handler(...legacyArgs);
            if (result) {
              if (Array.isArray(result)) {
                args = normalizeEvents(result, "out");
              } else {
                if (result.action === "replace" && result.args) {
                  args = normalizeEvents(result.args, "out");
                } else if (result.action === "block") {
                  return;
                }
              }
            }
          } catch (err: any) {
            log("Intercept receive handler error:", err, err?.stack);
          }
        }
        // 按事件名拦截器
        const ipcRecvInterceptorsSet = interceptIpcReceiveEventHandlers.get(legacyArgs?.[3]?.[1]?.cmdName);
        if (ipcRecvInterceptorsSet) {
          for (const handler of ipcRecvInterceptorsSet) {
            try {
              const result = handler(...legacyArgs);
              if (result) {
                if (Array.isArray(result)) {
                  args = normalizeEvents(result, "out");
                } else {
                  if (result.action === "replace" && result.args) {
                    args = normalizeEvents(result.args, "out");
                  } else if (result.action === "block") {
                    return;
                  }
                }
              }
            } catch (err: any) {
              log("Intercept receive event handler error:", err, err?.stack);
            }
          }
        }
        // 全局监听器
        for (const handler of ipcReceiveHandlers) {
          try {
            handler(...legacyArgs);
          } catch (err: any) {
            log("Receive handler error:", err, err?.stack);
          }
        }
        // 按事件名监听器
        const ipcReceiveHandlersSet = ipcReceiveEventHandlers.get(legacyArgs?.[3]?.[1]?.cmdName);
        if (ipcReceiveHandlersSet) {
          for (const handler of ipcReceiveHandlersSet) {
            try {
              handler(...legacyArgs);
            } catch (err: any) {
              log("Receive event handler error:", err, err?.stack);
            }
          }
        }
        return target.apply(thisArg, args);
      },
    });
  } else if (events[proxyFlag]) {
    log("'-ipc-message' already proxied.");
  } else {
    log("No '-ipc-message' listener found.");
  }

  // 代理发送端
  const originalSend = window.webContents.send;
  window.webContents.send = new Proxy(originalSend, {
    apply(target, thisArg, args) {
      // 拦截器
      for (const handler of interceptIpcSendHandlers) {
        try {
          const result = handler(...args);
          if (result) {
            if (Array.isArray(result)) {
              args = result;
            } else {
              if (result.action === "replace" && result.args) {
                args = result.args;
              } else if (result.action === "block") {
                return;
              }
            }
          }
        } catch (err: any) {
          log("Intercept send handler error:", err, err?.stack);
        }
      }
      // 按事件名拦截器
      const ipcSendInterceptorsSet = interceptIpcSendEventHandlers.get(args?.[2]?.cmdName);
      if (ipcSendInterceptorsSet) {
        for (const handler of ipcSendInterceptorsSet) {
          try {
            const result = handler(...args);
            if (result) {
              if (Array.isArray(result)) {
                args = result;
              } else {
                if (result.action === "replace" && result.args) {
                  args = result.args;
                } else if (result.action === "block") {
                  return;
                }
              }
            }
          } catch (err: any) {
            log("Intercept send event handler error:", err, err?.stack);
          }
        }
      }
      // 全局监听器
      for (const handler of ipcSendHandlers) {
        try {
          handler(...args);
        } catch (err: any) {
          log("Send handler error:", err, err?.stack);
        }
      }
      // 按事件名监听器
      const ipcSendHandlersSet = ipcSendEventHandlers.get(args?.[2]?.cmdName);
      if (ipcSendHandlersSet) {
        for (const handler of ipcSendHandlersSet) {
          try {
            handler(...args);
          } catch (err: any) {
            log("Send event handler error:", err, err?.stack);
          }
        }
      }
      return target.apply(thisArg, args as [string, ...any[]]);
    },
  });
}

const IpcInterceptor = {
  onIpcReceive,
  onIpcSend,
  onIpcReceiveEvents,
  onIpcSendEvents,
  offIpcReceive,
  offIpcSend,
  offIpcReceiveEvents,
  offIpcSendEvents,
  interceptIpcReceive,
  interceptIpcSend,
  interceptIpcReceiveEvents,
  interceptIpcSendEvents,
  offInterceptIpcReceive,
  offInterceptIpcSend,
  offInterceptIpcReceiveEvents,
  offInterceptIpcSendEvents,
};

export { proxyIpcMessages, IpcInterceptor };
