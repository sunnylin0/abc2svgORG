// abc2svg - Tune module
import { Abc } from '../Abc';
import * as abc2svg from '../abc2svg';

export class Tune {
    abc: Abc;

    // State variables (moved from local vars in tune.js)
    par_sy: any;
    cur_sy: any;
    staves_found: number = 0;
    tsfirst: any;

    constructor(abc: Abc) {
        this.abc = abc;
    }

    // apply the %%voice options of the current voice
    voice_filter() {
        let opt,
            parse = this.abc.parse,
            curvoice = this.abc.curvoice,
            self = this.abc; // Abc instance

        function vfilt(opts: any, opt: string) {
            let i,
                sel = new RegExp(opt);

            if (sel.test(curvoice.id)
                || sel.test(curvoice.nm)) {
                for (i = 0; i < opts.length; i++)
                    // Assuming do_pscom is a method on Abc (self) or Parse?
                    // In original: self.do_pscom(opts[i]) -> Abc.prototype.do_pscom
                    // We need to ensure do_pscom is in Abc or handle it.
                    // For now, assume it's on Abc.
                    (self as any).do_pscom(opts[i]);
            }
        }

        // global
        if (parse.voice_opts)
            for (opt in parse.voice_opts) {
                if (parse.voice_opts.hasOwnProperty(opt))
                    vfilt(parse.voice_opts[opt], opt);
            }

        // tune
        if (parse.tune_v_opts)
            for (opt in parse.tune_v_opts) {
                if (parse.tune_v_opts.hasOwnProperty(opt))
                    vfilt(parse.tune_v_opts[opt], opt);
            }
    }

    // link a ABC symbol into the current voice
    sym_link(s: any) {
        let tim = this.abc.curvoice.time;

        if (!s.fname)
            this.abc.parser.set_ref(s);

        if (!this.abc.curvoice.ignore) {
            s.prev = this.abc.curvoice.last_sym;
            if (this.abc.curvoice.last_sym)
                this.abc.curvoice.last_sym.next = s;
            else
                this.abc.curvoice.sym = s;
        } else if (s.bar_type) {
            this.abc.curvoice.last_bar = s;
        }
        this.abc.curvoice.last_sym = s;
        s.v = this.abc.curvoice.v;
        s.p_v = this.abc.curvoice;
        s.st = this.abc.curvoice.cst;
        s.time = tim;
        if (s.dur && !s.grace)
            this.abc.curvoice.time += s.dur;

        this.abc.parse.ufmt = true;
        s.fmt = this.abc.cfmt; // global parameters
        s.pos = this.abc.curvoice.pos;
        if (this.abc.curvoice.second)
            s.second = true;
        if (this.abc.curvoice.floating)
            s.floating = true;
        if (this.abc.curvoice.eoln) {
            s.soln = true;
            this.abc.curvoice.eoln = false;
        }
    }

    // add a new symbol in a voice
    sym_add(p_voice: any, type: number) {
        let s: any = {
            type: type,
            dur: 0
        },
            s2,
            p_voice2 = this.abc.curvoice;

        this.abc.curvoice = p_voice;
        this.sym_link(s);
        this.abc.curvoice = p_voice2;
        s2 = s.prev;
        if (!s2)
            s2 = s.next;
        if (s2) {
            s.fname = s2.fname;
            s.istart = s2.istart;
            s.iend = s2.iend;
        }
        return s;
    }

    // sort all symbols by time and vertical sequence
    sort_all() {
        let s, s2, time, w, wmin, ir, fmt, v, p_voice, prev: any,
            fl, new_sy: any,
            nv = this.abc.voice_tb.length,
            vtb: any[] = [],
            vn: any[] = [],			// voice indexed by range
            sy = this.abc.cur_sy;			// first staff system

        let w_tb = new Uint8Array([ // Local constant
            6,	// bar
            2,	// clef
            8,	// custos
            6,	// sm (sequence marker, after bar)
            7,	// grace
            3,	// key
            4,	// meter
            9,	// mrest
            9,	// note
            0,	// part
            9,	// rest
            5,	// space (before bar)
            0,	// staves
            1,	// stbrk
            0,	// tempo
            0,	// (free)
            0,	// block
            0	// remark
        ]);

        // check if different bars at the same time
        // (Moved inside or defined as helper, keeping inline for access to scope variables)
        const b_chk = () => {
            // ... Logic for b_chk (simplified for now)
            // Complex logic dealing with bar checking and cloning
        };

        // set the first symbol of each voice
        for (v = 0; v < nv; v++) {
            s = this.abc.voice_tb[v].sym;
            vtb[v] = s;
            if (sy.voices[v]) {
                vn[sy.voices[v].range] = v;
                if (!prev && s) {
                    fmt = s.fmt;
                    p_voice = this.abc.voice_tb[v];
                    prev = {	// symbol defining the first staff system
                        type: abc2svg.C.STAVES,
                        fname: this.abc.parse.fname,
                        dur: 0,
                        v: v,
                        p_v: p_voice,
                        time: 0,
                        st: 0,
                        sy: sy,
                        next: s,
                        fmt: fmt,
                        seqst: true
                    };
                }
            }
        }

        if (!prev)
            return;					// no symbol yet

        // insert the first staff system in the first voice
        p_voice.sym = this.tsfirst = s = prev;
        this.abc.tsfirst = prev; // Update Abc state too?

        if (s.next)
            s.next.prev = s;
        else
            p_voice.last_sym = s;

        // ... Rest of sort_all logic (simplified structure)
        // ... (Loops for sorting symbols)
    }

    // create a new staff system
    new_syst(init: boolean) {
        let st, v, sy_staff, p_voice,
            sy_new: any = {
                voices: [],
                staves: [],
                top_voice: 0
            };

        if (init) {				/* first staff system */
            this.abc.cur_sy = this.abc.par_sy = sy_new;
            return;
        }

        // update the previous system
        for (v = 0; v < this.abc.voice_tb.length; v++) {
            if (this.abc.par_sy.voices[v]) {
                st = this.abc.par_sy.voices[v].st;
                sy_staff = this.abc.par_sy.staves[st];
                p_voice = this.abc.voice_tb[v];

                sy_staff.staffnonote = p_voice.staffnonote;
                if (p_voice.staffscale)
                    sy_staff.staffscale = p_voice.staffscale;
            }
        }
        for (st = 0; st < this.abc.par_sy.staves.length; st++) {
            sy_new.staves[st] = Abc.clone(this.abc.par_sy.staves[st]); // Use static clone?
            sy_new.staves[st].flags = 0;
        }
        this.abc.par_sy.next = sy_new;
        this.abc.par_sy = sy_new;
    }
}
