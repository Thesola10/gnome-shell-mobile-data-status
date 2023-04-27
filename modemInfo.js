/**
 * Modem Info
 *
 * ModemManager D-Bus interfacing classes.
 *
 * @author Karim Vergnes <me@thesola.io>
 */

const { GLib, Gio, GObject } = imports.gi;

const MM_SERVICE = 'org.freedesktop.ModemManager1'
const MM_MODEM_SERVICE = 'org.freedesktop.ModemManager1.Modem'
const MM_PATH = '/org/freedesktop/ModemManager1'
const MM_MODEM_PFX = '/org/freedesktop/ModemManager1/Modem'

/**
 * @param {?number} MMModemAccessTechnology enum value representing
 *                  the network type to display.
 * @private
 */
function _labelFromId(label) {
    switch (label) {

    case 1<<3:        return '2G';
    case 1<<4:        return 'EDGE';
    case 1<<5:
    case 1<<10:
    case 1<<11:       return '3G';
    case 1<<12:
    case 1<<13:       return '3G+';
    case 1<<6:
    case 1<<7:
    case 1<<8:        return 'H';
    case 1<<9:        return 'H+';
    case 1<<14:       return 'LTE';
    case 1<<15:       return '5G';
    case 1<<15|1<<14: return '5G'; // 5G/NSA is reported as both LTE and 5G
    default:          return '';
    }
}

class MMModem extends Gio.DBusProxy {
    _init(opath) {
        super._init({
            g_bus_type: Gio.BusType.SYSTEM,
            g_name: MM_SERVICE,
            g_object_path: opath,
            g_interface_name: 'org.freedesktop.DBus.Properties',
            g_flags: Gio.DBusProxyFlags.NONE
        });
    }

    async getConnType() {
        const pif = await new Promise((resolve, reject) => {
            this.call('Get',
                'AccessTechnologies',
                Gio.DBusCallFlags.NONE,
                -1, null,
                (proxy, res) => {
                    try {
                        const variant = proxy.call_finish(res);
                        resolve(variant.deepUnpack()[0]);
                    } catch (e) {
                        Gio.DBusError.strip_remote_error(e);
                        reject(e);
                    }
                });
        });
        return _labelFromId(pif);
    }
}

var ModemManager = GObject.registerClass({
    GTypeName: 'ModemManager',
    Implements: [Gio.DBusInterface],
    Properties: {},
    Signals: {}
},
class MManager extends Gio.DBusProxy {
    _init() {
        super._init({
            g_bus_type: Gio.BusType.SYSTEM,
            g_name: MM_SERVICE,
            g_object_path: MM_PATH,
            g_interface_name: 'org.freedesktop.DBus.ObjectManager',
            g_flags: Gio.DBusProxyFlags.NONE
        });
    }
    async getModem() {
        const objs = await new Promise((resolve, reject) => {
            this.call('GetManagedObjects',
                null,
                Gio.DBusCallFlags.NONE,
                -1, null,
                (proxy, res) => {
                    try {
                        const variant = proxy.call_finish(res);
                        resolve(variant.deepUnpack()[0]);
                    } catch (e) {
                        Gio.DBusError.strip_remote_error(e);
                        reject(e);
                    }
                });
        });

        for (const [opath, obj] of Object.entries(objs)) {
            print(opath)
            if (opath.startsWith(MM_MODEM_PFX)) {
                return new MMModem(opath);
            }
        }
    }
});


