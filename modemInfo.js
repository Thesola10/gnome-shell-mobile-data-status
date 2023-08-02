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

const MMModem = GObject.registerClass({
    GTypeName: "MMModem",
    Implements: [Gio.DBusInterface],
    Properties: {},
    Signals: {
        'conn-type-changed': {
            param_types: [GObject.TYPE_STRING]
            // might as well send the new connection label
        }
    }
},
class MMModem extends Gio.DBusProxy {
    _init(opath) {
        super._init({
            g_connection: Gio.DBus.system,
            g_name: MM_SERVICE,
            g_object_path: opath,
            g_interface_name: MM_MODEM_SERVICE,
            g_flags: Gio.DBusProxyFlags.GET_INVALIDATED_PROPERTIES
        });

        this.connect('g-properties-changed', (me, changed, invals) => {
            const chgs = changed.deepUnpack()[0];

            if (chgs['AccessTechnologies'] !== undefined) {
                this.emit('conn-type-changed', _labelFromId(chgs['AccessTechnologies']));
            }
        });
    }

    getConnType() {
        const pif = this.get_cached_property('AccessTechnologies').deepUnpack()[0]
        console.log(pif)
        return _labelFromId(pif);
    }
})

var ModemManager = GObject.registerClass({
    GTypeName: 'ModemManager',
    Implements: [Gio.DBusInterface],
    Properties: {},
    Signals: {}
},
class MManager extends Gio.DBusProxy {
    _init() {
        super._init({
            g_connection: Gio.DBus.system,
            g_name: MM_SERVICE,
            g_object_path: MM_PATH,
            g_interface_name: 'org.freedesktop.DBus.ObjectManager',
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
            if (opath.startsWith(MM_MODEM_PFX)) {
                return new MMModem(opath);
            }
        }
    }
});
