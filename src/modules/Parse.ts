// abc2svg - Parse module
import { Abc } from '../Abc';
import * as abc2svg from '../abc2svg';

export class Parse {
    abc: Abc;
    a_dcn: string[] = [];

    // Character definition table
    char_tb: string[] = [
        "0", "0", "0", "0", "0", "0", "0", "0", "0", " ", "\n", "0", "0", "0", "0", "0",
        "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0",
        " ", "!", '"', "i", "\n", "0", "&", "0", "(", ")", "i", "0", "0", "-", "!dot!", "0",
        "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "|", "i", "<", "n", "<", "i",
        "i", "n", "n", "n", "n", "n", "n", "n", "!fermata!", "d", "d", "d", "!emphasis!", "!lowermordent!", "d", "!coda!",
        "!uppermordent!", "d", "d", "!segno!", "!trill!", "d", "d", "d", "n", "d", "n", "[", "\\", "|", "n", "n",
        "i", "n", "n", "n", "n", "n", "n", "n", "d", "d", "d", "d", "d", "d", "d", "d",
        "d", "d", "d", "d", "d", "!upbow!", "!downbow!", "d", "n", "n", "n", "{", "|", "}", "!gmark!", "0"
    ];

    maps: any = {};
    qplet_tb: Int8Array = new Int8Array([0, 1, 3, 2, 3, 0, 2, 0, 3, 0]);
    ntb: string = "CDEFGABcdefgab";

    // State for parsing
    tp: any[] | null = null;
    tpn: number = -1;
    tps: any = null;
    stemless: boolean = false;
    repeat_n: number = 0;
    repeat_k: number = 0;
    bol: number = 0; // beginning of line index
    pq: any = {};
    pq_d: any[] = [];

    constructor(abc: Abc) {
        this.abc = abc;
    }

    set_ref(s: any) {
        s.fname = this.abc.parse.fname;
        s.istart = this.abc.parse.istart;
        s.iend = this.abc.parse.iend;
    }

    new_clef(clef_def: string) {
        let s: any = {
            type: abc2svg.C.CLEF,
            clef_line: 2,
            clef_type: "t",
            v: this.abc.curvoice.v,
            p_v: this.abc.curvoice,
            time: this.abc.curvoice.time,
            dur: 0,
            clef_small: 1
        };
        let i = 1;

        this.set_ref(s);

        switch (clef_def[0]) {
            case '"':
                i = clef_def.indexOf('"', 1);
                s.clef_name = clef_def.slice(1, i);
                i++;
                break;
            case 'a':
                if (clef_def[1] == 'u') {	// auto
                    s.clef_type = "a";
                    s.clef_auto = true;
                    i = 4;
                    break;
                }
                i = 4;				// alto
            case 'C':
                s.clef_type = "c";
                s.clef_line = 3;
                break;
            case 'b':				// bass
                i = 4;
            case 'F':
                s.clef_type = "b";
                s.clef_line = 4;
                break;
            case 'n':				// none
                i = 4;
                s.invis = true;
                s.clef_none = 1;
                break;
            case 't':
                if (clef_def[1] == 'e') {	// tenor
                    s.clef_type = "c";
                    s.clef_line = 4;
                    break;
                }
                i = 6;
            case 'G':
                break;
            case 'p':
                i = 4;
            case 'P':				// perc
                s.clef_type = "p";
                s.clef_line = 3;
                break;
            default:
                this.abc.syntax(1, "Unknown clef '$1'", clef_def);
                return;
        }

        if (clef_def[i] >= '1' && clef_def[i] <= '9') {
            s.clef_line = +clef_def[i];
            i++;
        }

        // handle the octave
        delete this.abc.curvoice.snd_oct;
        if (clef_def[i + 1] != '8' && clef_def[i + 1] != '1')
            return s;

        switch (clef_def[i]) {
            case '^':
                s.clef_oct_transp = true;
            case '+':
                s.clef_octave = clef_def[i + 1] == '8' ? 7 : 14;
                if (!s.clef_oct_transp)
                    this.abc.curvoice.snd_oct = clef_def[i + 1] == '8' ? 12 : 24;
                break;
            case '_':
                s.clef_oct_transp = true;
            case '-':
                s.clef_octave = clef_def[i + 1] == '8' ? -7 : -14;
                if (!s.clef_oct_transp)
                    this.abc.curvoice.snd_oct = clef_def[i + 1] == '8' ? -12 : -24;
                break;
        }
        return s;
    }

    new_key(param: string) {
        let i, key_end, c, tmp, note,
            sf = "FCGDAEB".indexOf(param[0]) - 1,
            mode = 0,
            s: any = {
                type: abc2svg.C.KEY,
                dur: 0
            };

        this.set_ref(s);

        i = 1;
        if (sf < -1) {
            // simplified logic
            if (param.startsWith("none")) {
                s.k_none = true;
                sf = 0;
            }
        }

        // Simplified key parsing logic
        s.k_sf = sf;
        // set the map of the notes with accidentals
        s.k_map = (abc2svg.keys && abc2svg.keys[sf + 7]) ? abc2svg.keys[sf + 7] : [];

        s.k_mode = mode;
        return s;
    }

    // convert an interval to a base-40 interval
    get_interval(param: string | any, score?: boolean) {
        let i, note, pit: number[] = [];
        return 0; // Placeholder
    }

    // transpose a note
    nt_trans(nt: any, a: any) {
        let ak, an, d, b40, n;

        if (typeof a == "object") {		// if microtonal accidental
            n = a[0];			// numerator
            d = a[1];			// denominator
            a = n > 0 ? 1 : -1;		// base accidental for transpose
        }

        b40 = abc2svg.pab40(nt.pit, a)
            + this.abc.curvoice.tr_sco;		// base-40 transposition

        nt.pit = abc2svg.b40p(b40);		// new pitch
        an = abc2svg.b40a(b40);			// new accidental

        if (!d) {				// if not a microtonal accidental
            if (an == -3)			// if triple sharp/flat
                return an;
            if (a && !an)
                an = 3;			// needed for %%map
            a = an;
            if (!nt.acc			// if no old accidental
                && !this.abc.curvoice.ckey.k_none)	// and normal key
                a = 0;			// no accidental
            nt.acc = a;
            return an;
        }
        return an;
    }

    new_meter(p: string) {
        // stub implementation
    }

    new_bar(type?: any) {
        // stub
    }

    new_note(grace: any, sls: any) {
        // stub
    }

    parse_music_line(line: string) {
        // stub implementation
        console.log("Parsing music line:", line);
    }
}
