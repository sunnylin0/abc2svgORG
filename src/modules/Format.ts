// abc2svg - Format module
import { Abc } from '../Abc';
import * as abc2svg from '../abc2svg';

export class Format {
    abc: Abc;

    constructor(abc: Abc) {
        this.abc = abc;
    }

    // get a length with a unit - return the number of pixels
    get_unit(param: string): number {
        let v_match = param.toLowerCase().match(/(-?[\d.]+)(.*)/);
        if (!v_match)
            return NaN;

        let val = +v_match[1];
        switch (v_match[2]) {
            case "cm":
                return val * 37.8; // CM constant
            case "in":
                return val * 96; // IN constant
            case "pt":		// paper point in 1/72 inch
                return val / .75;
            case "px":		// screen pixel in 1/96 inch
            case "":
                return val;
        }
        return NaN;
    }

    // set the page layout (margin, width)
    set_page() {
        let img = this.abc.img;
        let cfmt = this.abc.cfmt;

        if (!img.chg)
            return;

        img.chg = false;
        img.lm = cfmt.leftmargin - cfmt.printmargin;
        if (img.lm < 0)
            img.lm = 0;

        img.rm = cfmt.rightmargin - cfmt.printmargin;
        if (img.rm < 0)
            img.rm = 0;

        img.width = cfmt.pagewidth - 2 * cfmt.printmargin;

        // must have 100pt at least as the staff width
        if (img.width - img.lm - img.rm < 100) {
            // this.abc.error(0, undefined, "Bad staff width"); // warning
            img.width = img.lm + img.rm + 150;
        }

        // this.abc.set_posx(); // TODO: check if set_posx is needed here (it is in original)
    }

    // set/unset the fields to write
    set_writefields(parm: string) {
        let c, i,
            a = parm.split(/\s+/);

        // helper for get_bool
        const get_bool = (p: string) => /^(1|true|yes|on)$/i.test(p);

        if (get_bool(a[1])) {
            for (i = 0; i < a[0].length; i++) {	// set
                c = a[0][i];
                if (this.abc.cfmt.writefields.indexOf(c) < 0)
                    this.abc.cfmt.writefields += c;
            }
        } else {
            for (i = 0; i < a[0].length; i++) {	// unset
                c = a[0][i];
                if (this.abc.cfmt.writefields.indexOf(c) >= 0)
                    this.abc.cfmt.writefields = this.abc.cfmt.writefields.replace(c, '');
            }
        }
    }

    // set text option
    get_textopt(v: string) {
        let textopt: any = {
            align: 'j',
            center: 'c',
            fill: 'f',
            justify: 'j',
            obeylines: 'l',
            ragged: 'f',
            right: 'r',
            skip: 's',
            // abcm2ps compatibility
            "0": 'l',
            "1": 'j',
            "2": 'f',
            "3": 'c',
            "4": 's',
            "5": 'r'
        };
        let i = v.indexOf(' ');
        if (i > 0)
            v = v.slice(0, i);
        return textopt[v];
    }

    // set a format parameter (main entry point)
    set_format(cmd: string, param: string) {
        let f, v, i;
        let cfmt = this.abc.cfmt;
        let img = this.abc.img;

        //fixme: should check the type and limits of the parameter values
        if (/.+font(-[\d])?$/.test(cmd)) {
            if (cmd == "soundfont")
                cfmt.soundfont = param;
            else
                this.param_set_font(cmd, param);
            return;
        }

        // duplicate the global parameters if already used by symbols
        // if (this.abc.sfmt[cmd] && this.abc.parse.ufmt) // Logic to handle ufmt cloning
        //    this.abc.cfmt = Object.create(this.abc.cfmt)

        switch (cmd) {
            case "aligncomposer":
            case "barsperstaff":
            case "infoline":
            case "measurenb":
            case "rbmax":
            case "rbmin":
            case "measrepnb":
            case "shiftunison":
            case "systnames":
            case "systvoices":
                v = parseInt(param);
                if (isNaN(v)) {
                    // syntax error
                    break;
                }
                if (cmd == "systnames") {	// compatibility
                    switch (v) {
                        case -1: v = 3; break;
                        case 1: v = 2; break;
                        case 2: v = 1; break;
                    }
                    cmd = "systvoices";
                }
                cfmt[cmd] = v;
                break;
            case "abc-version":
            case "bgcolor":
            case "fgcolor":
            case "propagate-accidentals":
            case "writeout-accidentals":
                cfmt[cmd] = param;
                break;
            case "beamslope":
            case "breaklimit":			// float values
            case "lineskipfac":
            case "maxshrink":
            case "pagescale":
            case "parskipfac":
            case "scale":
            case "slurheight":
            case "stemheight":
            case "tieheight":
                f = +param;
                if (isNaN(f) || !param || f < 0) {
                    // syntax error
                    break;
                }
                switch (cmd) {
                    case "scale":			// old scale
                        f /= .75;
                    // fallthru
                    case "pagescale":
                        if (f < .1)
                            f = .1;		// smallest scale
                        cmd = "scale";
                        img.chg = true;
                        break;
                }
                cfmt[cmd] = f;
                break;
            // ... more cases (gutter, indent, margins, etc.)
            case "botmargin":
            case "composerspace":
            case "gutter":
            case "indent":
            case "leftmargin":
            case "musicspace":
            case "checkmargin": // printmargin
            case "rightmargin":
            case "staffsep":
            case "staffwidth": // pagewidth
            case "subtitlespace":
            case "sysstaffsep": // maxstaffsep
            case "textspace":
            case "titlespace":
            case "topmargin":
            case "topspace":
            case "vocalspace":
            case "wordsspace":
                // alias handling
                if (cmd == "staffwidth") cmd = "pagewidth";
                if (cmd == "checkmargin") cmd = "printmargin";
                if (cmd == "sysstaffsep") cmd = "maxstaffsep";

                f = this.get_unit(param);
                if (isNaN(f)) {
                    // syntax error
                    break;
                }
                cfmt[cmd] = f;
                if (cmd == "pagewidth"
                    || cmd == "leftmargin"
                    || cmd == "rightmargin"
                    || cmd == "printmargin") {
                    img.chg = true;
                }
                break;

            // ... other cases
            case "writefields":
                this.set_writefields(param);
                break;
        }
    }

    // set a font parameter
    param_set_font(cmd: string, p: string) {
        // ... (simplified logic)
        // this.abc.set_font_fac(font) // call helper
    }

    set_font_fac(font: any) {
        // ...
    }
}
