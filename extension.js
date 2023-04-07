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
    }

    onParamChanged() {}

    updateIndicatorDisplay() {
        if (netIcon._mainConnection.type == "gsm") {
            netIcon.insert_child_at_index(this._label, 0);
            this._label.set_margin_left(6);
            this._label.set_text("LTE");
        } else {
            netIcon.remove_child(this._label);
        }
    }

    updateIndicatorLabel() {
    }

    enable() {
        netIcon = quickSettings._network;
        this._listener = netIcon._getClient()
            .then(() => netIcon._client.connect('notify::primary-connection', () => this.updateIndicatorDisplay()));
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
