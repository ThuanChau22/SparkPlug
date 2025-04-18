import { MinHeap } from "@datastructures-js/heap";
import ms from "ms";
import { v4 as uuid } from "uuid";

import StationEvent from "../repositories/station-event.js";

class StreamManager {
  /**
   * @typedef {Object} Stream
   * @property {String} id
   * @property {Number} connectAttempts
   * @property {Object} resumeToken
   * @property {ChangeStream} changeStream
   * @property {Map<Object, Map<String,Function>>} clients
   */
  /**
   * @type {Map<String, Stream>}
   */
  #streamMap = new Map();

  #streamHeap = new MinHeap((id) => {
    return this.#streamMap.get(id).clients.size;
  });

  #clientToStreamId = new Map();

  #limitPerStream = 100;

  #scaleDownTimeoutId = 0;

  #scaleDownTimeoutMs = ms("5m");

  constructor({
    limitPerStream,
    scaleDownTimeoutMs,
  } = {}) {
    if (limitPerStream) {
      this.#limitPerStream = limitPerStream;
    }
    if (scaleDownTimeoutMs) {
      this.#scaleDownTimeoutMs = scaleDownTimeoutMs;
    }
  }

  async addEvent(client, eventName, handler) {
    let streamId = this.#clientToStreamId.get(client);
    if (!streamId) {
      if (this.#streamHeap.size() === 0) {
        await this.#initialize();
      }
      streamId = this.#streamHeap.top();
      const { clients } = this.#streamMap.get(streamId);
      if (clients.size === this.#limitPerStream) {
        await this.#scaleUp();
      }
      streamId = this.#streamHeap.pop();
      this.#clientToStreamId.set(client, streamId);
      const stream = this.#streamMap.get(streamId);
      stream.clients.set(client, new Map());
      this.#streamHeap.push(streamId);
    }
    const stream = this.#streamMap.get(streamId);
    stream.clients.get(client).set(eventName, handler);
    return true;
  }

  async removeEvent(client, eventName) {
    const streamId = this.#clientToStreamId.get(client);
    const stream = this.#streamMap.get(streamId);
    const events = stream?.clients.get(client);
    const deleted = events?.delete(eventName);
    if (events?.size === 0) {
      stream.clients.delete(client);
      this.#clientToStreamId.delete(client);
    }
    return deleted || false;
  }

  async removeAllEvents(client) {
    const streamId = this.#clientToStreamId.get(client);
    const stream = this.#streamMap.get(streamId);
    const deleted = stream?.clients.delete(client);
    this.#clientToStreamId.delete(client);
    return deleted || false;
  }

  async #initialize() {
    await this.#scaleUp();
    this.#schedulePeriodicScaleDown();
  }

  #schedulePeriodicScaleDown() {
    clearTimeout(this.#scaleDownTimeoutId);
    this.#scaleDownTimeoutId = setTimeout(() => {
      // console.log({
      //   heap: this.#streamHeap.toArray().map((id) => {
      //     const { clients } = this.#streamMap.get(id);
      //     return { id, size: clients.size }
      //   }) // Stream load balance logs
      // });

      let clientCount = 0
      for (const [, stream] of this.#streamMap) {
        clientCount += stream.clients.size;
      }
      const limit = this.#limitPerStream;
      const newStreamCount = Math.ceil(clientCount / limit);
      const currentStreamCount = this.#streamHeap.size();
      if (newStreamCount < currentStreamCount) {
        this.#scaleDown();
      } else if (currentStreamCount !== 0) {
        this.#schedulePeriodicScaleDown();
      }
    }, this.#scaleDownTimeoutMs);
  }

  async #scaleUp() {
    const streamId = await this.#newStream();
    this.#streamHeap.push(streamId);
  }

  async #scaleDown() {
    let currentStream;
    const newStreamIds = [];
    const removedStreamIds = [];
    const newClientToStreamId = new Map();
    const limit = this.#limitPerStream;
    for (const stream of [...this.#streamMap.values()]) {
      for (const [client, eventHandlers] of stream.clients) {
        if (!currentStream || currentStream?.clients.size === limit) {
          currentStream = this.#streamMap.get(await this.#newStream());
          newStreamIds.push(currentStream.id);
        }
        currentStream.clients.set(client, eventHandlers);
        newClientToStreamId.set(client, currentStream.id);
      }
      removedStreamIds.push(stream.id);
    }
    this.#clientToStreamId = newClientToStreamId;
    for (const streamId of removedStreamIds) {
      this.#streamMap.delete(streamId);
    }
    this.#streamHeap = MinHeap.heapify(newStreamIds, (id) => {
      return this.#streamMap.get(id).clients.size;
    });
    this.#schedulePeriodicScaleDown();
  }

  async #newStream(streamId) {
    if (!streamId) {
      streamId = uuid();
      this.#streamMap.set(streamId, {
        id: streamId,
        connectAttempts: 0,
        resumeToken: null,
        changeStream: null,
        clients: new Map(),
      });
    }
    const stream = this.#streamMap.get(streamId);
    const options = { resumeAfter: stream.resumeToken };
    const changeStream = await StationEvent.watchEvent({}, options);
    changeStream.on("change", ({ _id, fullDocument }) => {
      stream.resumeToken = _id;
      for (const [, eventHandlers] of stream.clients) {
        for (const [, handleEvent] of eventHandlers) {
          handleEvent(fullDocument);
        }
      }
      stream.connectAttempts = 0;
    });
    changeStream.on("error", (error) => {
      console.log({ name: "StreamManagerNewStream", error });
      if (stream.connectAttempts > 3) {
        throw error;
      }
      stream.connectAttempts++;
      changeStream.close();
      this.#newStream(streamId);
    });
    stream.changeStream = changeStream;
    return streamId;
  };
}

export default StreamManager;
