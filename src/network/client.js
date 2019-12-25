import SimpleWebRTC from 'simplewebrtc';

export default class Client {
  constructor(debug = true) {
    this.callbacks = {
      connected() {},
      join() {},
      left() {},
      message: {},
    };
    this.socket = new SimpleWebRTC({
      url: 'https://webrtc.splits.link',
      debug,
      media: {},
      receiveMedia: {}
    });
    this.id = null;
    this.socket.on('readyToCall', id => {
      this.id = id;
      this.socket.joinRoom('achtung');
      this.callbacks.connected(id);
    });
    this.socket.on('createdPeer', peer => {
      const channel = peer.getDataChannel('achtung');
      if (channel.readyState != 'open') {
        this.socket.on('channelOpen', dc => dc == channel && this.callbacks.join(peer));
      } else {
        this.callbacks.join(peer);
      }
    });
    this.socket.on('peerStreamRemoved', peer => {
      this.callbacks.left(peer);
    });
    this.socket.on('channelMessage', (peer, label, { type, payload }) => {
      if (label === 'achtung') {
        this.callbacks.message[type] && this.callbacks.message[type](payload);
      }
    });
  }

  onConnected(callback) {
    if (this.id) {
      callback(this.id);
    }
    this.callbacks.connected = callback;
  }

  onPeerJoin(callback) {
    this.callbacks.join = callback;
  }

  onPeerLeft(callback) {
    this.callbacks.left = callback;
  }

  on(type, callback) {
    this.callbacks.message[type] = callback;
  }

  send(type, payload) {
    this.socket.sendDirectlyToAll('achtung', type, payload);
  }

  disconnect() {
    this.socket.disconnect();
  }
}
