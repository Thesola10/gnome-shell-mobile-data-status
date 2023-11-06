/**
 * Mobile Data Status label
 *
 * I add mobile data status label.
 *
 * @author Karim Vergnes <me@thesola.io>
 */

/* exported init */
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { MMModem, ModemManager } from './modemInfo.js';

const quickSettings = Main.panel.statusArea.quickSettings;

var netIcon = quickSettings._network;

export default class MobileDataLabel {
    constructor() {
        this._label = new St.Label();
        this._label.set_y_align(2);
        this._manager = new ModemManager();
        this._manager.connect('modem-removed', (m, pat) => {
            if (pat == this._modem.g_object_path)
                this.connectModem().then(console.log("Modem events refreshed"));
        });
        this._manager.connect('modem-added', (m, mod) => {
            this.connectModem(mod).then(console.log("New modem acquired"));
        });
    }

    onParamChanged() {}

    updateIndicatorDisplay() {
        netIcon.remove_child(this._label);
        if (netIcon._mainConnection.type == "gsm") {
            netIcon.insert_child_at_index(this._label, 0);
            this._label.set_margin_left(6);
        }
    }

    updateIndicatorText(m, txt) {
        this._label.set_text(txt);
        this.updateIndicatorDisplay();
    }

    async connectModem(mdm = null) {
        if (this._modem != undefined) {
            this._modem.disconnect('conn-type-changed');
            delete this._modem;
        }
        if (mdm != null)
            this._modem = mdm;
        else
            this._modem = await this._manager.getModem();

        if (this._modem == null) {
            this._label.set_text("")
        } else {
            this._label.set_text(this._modem.getConnType())
            this._modem.connect('conn-type-changed', this.updateIndicatorText.bind(this));
        }
        // good opportunity to reload label on boot
        this.updateIndicatorDisplay();
    }

    enable() {
        netIcon = quickSettings._network;
        this._iconListener = netIcon._getClient()
            .then(() =>
                netIcon._client.connect('notify::primary-connection',
                                        this.updateIndicatorDisplay.bind(this))
            );
        this.connectModem().then(console.log("Modem events connected"))

        // if we were enabled after session start, e.g. thru extension manager
        if (netIcon._mainConnection != null)
            this.updateIndicatorDisplay();
    }

    disable() {
        netIcon.remove_child(this._label);
        netIcon._client.disconnect(this._listener);
        this._modem.disconnect('conn-type-changed');
        delete this._modem;
    }
}
