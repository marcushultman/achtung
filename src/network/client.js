import SimpleWebRTC from 'simplewebrtc';

export default class Client {
  constructor(debug = true) {
    this.callbacks = [];
    this.socket = new SimpleWebRTC({
      url: 'https://webrtc.splits.link',
      debug,
      media: {},
      receiveMedia: {}
    });
    this.id = null;
    this.socket.on('connectionReady', id => {
      this.id = id;
    });
    this.socket.on('createdPeer', peer => {
      const channel = peer.getDataChannel('achtung');
      if (channel.readyState != 'open') {
        peer.on('channelOpen', dc => {
          if (dc == channel) {
            this.callbacks.forEach(cb => cb.$join(peer));
          }
        });
      } else {
        this.callbacks.forEach(cb => cb.$join(peer));
      }
    });
    this.socket.on('peerStreamRemoved', peer => {
      this.callbacks.forEach(cb => cb.$left(peer));
    });
    this.session = null;
    this.socket.on('joinedRoom', (session) => {
      this.session = session;
      this.callbacks.forEach(cb => cb.$connected(this.id, this.session));
    })
    this.socket.on('channelMessage', (peer, label, { type, payload }) => {
      if (label === 'achtung') {
        this.callbacks.forEach(cb => cb[type] && cb[type](payload));
      }
    });
  }

  join(session) {
    this.socket.leaveRoom();
    this.socket.joinRoom(session);
  }

  createCallbacks(callbacks = {}) {
    callbacks = Object.assign({}, { $join() {}, $left() {}, $connected() {} }, callbacks);
    if (this.id && this.session) {
      callbacks.$connected(this.id, this.session);
    }
    this.callbacks.push(callbacks);
    return callbacks;
  }

  resetCallbacks(callbacks) {
    const index = this.callbacks.indexOf(callbacks);
    if (index >= 0) {
      this.callbacks.splice(index, 1);
    }
  }

  send(type, payload) {
    this.socket.sendDirectlyToAll('achtung', type, payload);
  }

  disconnect() {
    this.socket.disconnect();
  }
}
