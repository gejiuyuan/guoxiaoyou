import { Emitter } from '@base/common/event/emitter';
import { Releasable, toReleasable } from '@base/common/lifecycle/releasable';

export class BroadcastChannelDispatcher<T> extends Releasable {
  protected channel!: BroadcastChannel;

  private readonly _onMessage = this.collect(new Emitter<T>());

  readonly onMessage = this._onMessage.on;

  constructor(private readonly label: string) {
    super();

    const listener = (ev: MessageEvent) => {
      this._onMessage.emit(ev.data as T);
    };

    this.channel = new BroadcastChannel(this.label);
    this.channel.addEventListener('message', listener);

    this.collect(
      toReleasable(() => {
        this.channel.removeEventListener('message', listener);
        this.channel.close();
      }),
    );
  }

  postMessage(msg: T) {
    this.channel.postMessage(msg);
  }
}
