/**
 * Mobile Data Status label
 *
 * I add mobile data status label.
 *
 * @author Karim Vergnes <me@thesola.io>
 */

/* exported init */

const ExtensionUtils = imports.misc.extensionUtils;
const { GLib, Gio, St } = imports.gi;
const quickSettings = imports.ui.main.panel.statusArea.quickSettings;
const Me = ExtensionUtils.getCurrentExtension();

const ModemInfo = Me.imports.modemInfo;

var netIcon = quickSettings._network;

class MobileDataLabel {
    constructor() {
        this._label = new St.Label();
        this._label.set_y_align(2);
        this._manager = new ModemInfo.ModemManager();
    }

    onParamChanged() {}

    updateIndicatorDisplay() {
        if (netIcon._mainConnection.type == "gsm") {
            netIcon.insert_child_at_index(this._label, 0);
            this._label.set_margin_left(6);
        } else {
            netIcon.remove_child(this._label);
        }
    }

    //TODO: Call this whenever modem is invalidated (e.g. suspend/resume)
    async connectModem() {
        this._modem = await this._manager.getModem();

        this._modem.connect('conn-type-changed', (m, txt) => {
            this._label.set_text(txt)
        });
    }

    enable() {
        netIcon = quickSettings._network;
        this._iconListener = netIcon._getClient()
            .then(() =>
                netIcon._client.connect('notify::primary-connection', () => this.updateIndicatorDisplay()
            ));
        this.connectModem().then(console.log("Modem events connected"))

        // if we were enabled after session start, e.g. thru extension manager
        if (netIcon._mainConnection != null)
            this.updateIndicatorDisplay();
    }

    disable() {
        netIcon.remove_child(this._label);
        netIcon._client.disconnect(this._listener);
    }
}

function init() {
    ExtensionUtils.initTranslations();
    return new MobileDataLabel();
}
