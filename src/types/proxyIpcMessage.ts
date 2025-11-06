type Unsubscribe = () => void;
type EventName = string | string[];
type IpcCallback = (...args: any[]) => void;

/**
 * 拦截器返回值约定
 * - `action = "replace"` 时，会替换事件参数为 `args`
 * - `action = "block"` 时，会阻止本次事件
 * - `action = "pass"` 或不返回值时，事件正常传递
 */
interface InterceptResult {
  /** 动作类型 */
  action: "replace" | "block" | "pass";
  /** 当 action = "replace" 时生效，替换事件参数 */
  args?: any[];
}

/**
 * IPC 拦截回调函数
 * - 可以返回 InterceptResult 来明确控制事件行为
 * - 也可以直接返回新的参数数组，等同于 `action = "replace"`
 * - 不返回值时，等同于 `action = "pass"`
 */
type IpcInterceptCallback = (...args: any[]) => InterceptResult | any[] | void;

/** IPC 拦截与监听接口 */
interface IpcInterceptorType {
  /**
   * 监听所有 IpcReceive 事件
   * - **不建议修改事件内容，只做观察或副作用处理**
   */
  onIpcReceive(callback: IpcCallback): Unsubscribe;

  /**
   * 监听所有 IpcSend 事件
   * - **不建议修改事件内容，只做观察或副作用处理**
   */
  onIpcSend(callback: IpcCallback): Unsubscribe;

  /**
   * 监听指定事件的 IpcReceive
   * - **不建议修改事件内容，只做观察或副作用处理**
   */
  onIpcReceiveEvents(eventName: EventName, callback: IpcCallback): Unsubscribe;

  /**
   * 监听指定事件的 IpcSend
   * - **不建议修改事件内容，只做观察或副作用处理**
   */
  onIpcSendEvents(eventName: EventName, callback: IpcCallback): Unsubscribe;

  /** 移除 onIpcReceive 全局监听 */
  offIpcReceive(callback: IpcCallback): void;

  /** 移除 onIpcSend 全局监听 */
  offIpcSend(callback: IpcCallback): void;

  /** 移除指定事件的 IpcReceive 监听 */
  offIpcReceiveEvents(eventName: EventName, callback: IpcCallback): void;

  /** 移除指定事件的 IpcSend 监听 */
  offIpcSendEvents(eventName: EventName, callback: IpcCallback): void;

  /** 拦截所有 IpcReceive 事件 */
  interceptIpcReceive(callback: IpcInterceptCallback): Unsubscribe;

  /** 拦截所有 IpcSend 事件 */
  interceptIpcSend(callback: IpcInterceptCallback): Unsubscribe;

  /** 拦截指定事件的 IpcReceive */
  interceptIpcReceiveEvents(eventName: EventName, callback: IpcInterceptCallback): Unsubscribe;

  /** 拦截指定事件的 IpcSend */
  interceptIpcSendEvents(eventName: EventName, callback: IpcInterceptCallback): Unsubscribe;

  /** 移除 interceptIpcReceive 全局拦截 */
  offInterceptIpcReceive(callback: IpcInterceptCallback): void;

  /** 移除 interceptIpcSend 全局拦截 */
  offInterceptIpcSend(callback: IpcInterceptCallback): void;

  /** 移除指定事件的 IpcReceive 拦截 */
  offInterceptIpcReceiveEvents(eventName: EventName, callback: IpcInterceptCallback): void;

  /** 移除指定事件的 IpcSend 拦截 */
  offInterceptIpcSendEvents(eventName: EventName, callback: IpcInterceptCallback): void;
}

declare const IpcInterceptor: IpcInterceptorType;
