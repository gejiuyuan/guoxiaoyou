import { Releasable } from '@base/common/lifecycle/releasable';

export interface IPlugin<S extends object> {
  readonly name?: string | symbol;
  activate(ctx: IPluginContext<S>): void;
  deactivate(ctx: IPluginContext<S>): void;
}

export interface IPluginContext<S extends object> {
  readonly sdk: S;
  readonly subscriptions: Releasable;
}

interface IPluginFactory<S extends object> extends IPlugin<S> {
  readonly sdk: S;
  readonly context: IPluginContext<S>;
  activate(): void;
  deactivate(): void;
}

class Plugin<S extends object> implements IPluginFactory<S> {
  readonly name?: string | symbol;

  constructor(
    readonly sdk: S,
    private _pluginApi: IPlugin<S>,
  ) {
    this.name = _pluginApi.name;
  }

  #context!: IPluginContext<S>;
  public get context() {
    if (!this.#context) {
      const _this = this;
      this.#context = {
        get sdk() {
          return _this.sdk;
        },
        subscriptions: new Releasable(),
      };
    }
    return this.#context;
  }
  activate(): void {
    this._pluginApi.activate(this.context);
  }

  deactivate(): void {
    if (this.#context) {
      this._pluginApi.deactivate(this.context);
      this.clear();
    }
  }

  clear() {
    if (this.#context) {
      this.#context.subscriptions.release();
      this.#context = null!;
    }
  }
}

export abstract class Pluginable extends Releasable {
  get plugins() {
    return [...this.#enabledPluginMap.keys(), ...this.#disabledPluginMap.keys()];
  }

  get enabledPlugins() {
    return [...this.#enabledPluginMap.keys()];
  }

  get disabledPlugins() {
    return [...this.#disabledPluginMap.keys()];
  }

  readonly #enabledPluginMap = new Map<IPlugin<this>, Plugin<this>>();
  readonly #disabledPluginMap = new Map<IPlugin<this>, Plugin<this>>();

  #hasPlugin(plugin: IPlugin<this>) {
    return this.#enabledPluginMap.has(plugin) || this.#disabledPluginMap.has(plugin);
  }

  installPlugin(plugin: OneOrN<IPlugin<this>>) {
    if (Array.isArray(plugin)) {
    } else {
      plugin = [plugin];
    }
    for (const _plugin of plugin) {
      if (!this.#hasPlugin(_plugin)) {
        this.enablePlugin(_plugin);
      }
    }
    return this;
  }

  uninstallPlugin(plugin: OneOrN<IPlugin<this>>) {
    if (Array.isArray(plugin)) {
    } else {
      plugin = [plugin];
    }
    for (const _plugin of plugin) {
      if (this.#hasPlugin(_plugin)) {
        this.disablePlugin(_plugin);
        this.#disabledPluginMap.delete(_plugin);
      }
    }
    return this;
  }

  enablePlugin(plugin: OneOrN<IPlugin<this>>) {
    if (Array.isArray(plugin)) {
    } else {
      plugin = [plugin];
    }
    for (const _plugin of plugin) {
      if (!this.#enabledPluginMap.has(_plugin)) {
        let pluginInstance!: Plugin<this>;
        if (this.#disabledPluginMap.has(_plugin)) {
          pluginInstance = this.#disabledPluginMap.get(_plugin)!;
          this.#disabledPluginMap.delete(_plugin);
        } else {
          pluginInstance = new Plugin(this, _plugin);
        }
        this.#enabledPluginMap.set(_plugin, pluginInstance);
        pluginInstance.activate();
      }
    }
    return this;
  }

  disablePlugin(plugin: OneOrN<IPlugin<this>>) {
    if (Array.isArray(plugin)) {
    } else {
      plugin = [plugin];
    }
    for (const _plugin of plugin) {
      if (this.#enabledPluginMap.has(_plugin) && !this.#disabledPluginMap.has(_plugin)) {
        const pluginInstance = this.#enabledPluginMap.get(_plugin)!;
        this.#enabledPluginMap.delete(_plugin);
        this.#disabledPluginMap.set(_plugin, pluginInstance);
        pluginInstance.deactivate();
      }
    }
    return this;
  }

  release(): void {
    super.release();
    this.uninstallPlugin(this.plugins);
  }
}
