import { Dispatcher } from '@base/common/event/dispatcher';
import { Disposable, toDisposable } from '@base/common/lifecycle/lifecycle';

export class BroadcastChannelDispatcher<T> extends Disposable {
  protected channel!: BroadcastChannel;

  private readonly _onMessage = this.addDisposale(new Dispatcher<T>());

  readonly onMessage = this._onMessage.event;

  constructor(private readonly label: string) {
    super();

    const listener = (ev: MessageEvent) => {
      this._onMessage.dispatch(ev.data as T);
    };

    this.channel = new BroadcastChannel(this.label);
    this.channel.addEventListener('message', listener);

    this.addDisposale(
      toDisposable(() => {
        this.channel.removeEventListener('message', listener);
        this.channel.close();
      }),
    );
  }

  postMessage(msg: T) {
    this.channel.postMessage(msg);
  }
}
