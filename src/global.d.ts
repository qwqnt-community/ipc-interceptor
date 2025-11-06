declare global {
  // LiteLoader 兼容
  declare const LiteLoader: any;

  // ipc-logger 兼容
  declare const Logs: any;

  interface Window {
    navigation: any;
    qwqnt: any;
    lt_logs: () => void;
    lt_errors: () => void;
  }

  interface Peer {
    chatType: 1 | 2 | 100;
    guildId: string;
    peerUid: string;
  }

  interface Element {
    lt_slot?: HTMLElement;
    __VUE__?: any[];
    __vue_app__?: any;
  }
}

export {};
