import { Dispatcher } from '@base/common/event/dispatcher';
import { Releasable, toReleasable } from '@base/common/lifecycle/releasable';

export class BroadcastChannelDispatcher<T> extends Releasable {
  protected channel!: BroadcastChannel;

  private readonly _onMessage = this.collect(new Dispatcher<T>());

  readonly onMessage = this._onMessage.event;

  constructor(private readonly label: string) {
    super();

    const listener = (ev: MessageEvent) => {
      this._onMessage.dispatch(ev.data as T);
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
