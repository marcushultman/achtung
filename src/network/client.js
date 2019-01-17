import SimpleWebRTC from 'simplewebrtc';

let handleSeq = 0;

class Client {
  constructor() {
    this.callbacks = {};
    this.socket = new SimpleWebRTC({
      url: 'https://webrtc.splits.link',
      debug: true,
      media: {},
      receiveMedia: {}
    });
    this.id = null;
    this.socket.on('readyToCall', id => {
      this.id = id;
      this.socket.joinRoom('achtung');
      Object.values(this.callbacks)
          .filter(callbacks => callbacks.connected)
          .forEach(callbacks => callbacks.connected(id));
    });
    this.socket.on('createdPeer', peer => {
      Object.values(this.callbacks)
          .filter(callbacks => callbacks.join)
          .forEach(callbacks => callbacks.join(peer));
    });
    this.socket.on('peerStreamRemoved', peer => {
      Object.values(this.callbacks)
          .filter(callbacks => callbacks.left)
          .forEach(callbacks => callbacks.left(peer));
    });
    this.socket.on('channelMessage', (peer, label, { type, payload }) => {
      if (label !== 'achtung') {
        return;
      }
      Object.values(this.callbacks)
          .filter(callbacks => callbacks.message[type])
          .forEach(callbacks => callbacks.message[type](payload));
    });
  }

  createHandle() {
    this.callbacks[handleSeq] = { message: {} };
    return handleSeq++;
  }
  releaseHandle(handle) {
    delete this.callbacks[handle];
  }

  onConnected(handle, callback) {
    if (this.id) {
      callback(this.id);
    } else {
      let callbacks = this.callbacks[handle];
      callbacks && (callbacks.connected = callback);
    }
  }
  onPeerJoin(handle, callback) {
    let callbacks = this.callbacks[handle];
    callbacks && (callbacks.join = callback);
  }
  onPeerLeft(handle, callback) {
    let callbacks = this.callbacks[handle];
    callbacks && (callbacks.left = callback);
  }
  on(handle, type, callback) {
    let callbacks = this.callbacks[handle];
    callbacks && (callbacks.message[type] = callback);
  }

  send(type, payload) {
    this.socket.sendDirectlyToAll('achtung', type, payload);
  }
}

const client = new Client();

export default client;
