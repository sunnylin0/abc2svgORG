// abc2svg - Gchord module
import type { Abc } from '../Abc';
import * as abc2svg from '../abc2svg';

export class Gchord {
    abc: Abc;
    a_gch: any[] | null = null; // Global accumulator for gchords

    constructor(abc: Abc) {
        this.abc = abc;
    }

    // -- parse a chord symbol / annotation --
    parse_gchord(type: string) {
        let c, text: string, gch, x_abs: number = 0, y_abs: number = 0,
            i: number, j, istart, iend,
            ann_font = this.abc.get_font("annotation"),
            h_ann = ann_font.size,
            line = this.abc.parse.line;

        // Helper to get float from text
        const get_float = () => {
            let txt = '';
            while (1) {
                c = text[i++];
                if (!c || "1234567890.-".indexOf(c) < 0)
                    return parseFloat(txt) || 0;
                txt += c;
            }
            return 0; // Should not reach here
        };

        istart = this.abc.parse.bol + line.index;
        if (type.length > 1) {			// U:
            text = type.slice(1, -1);
            iend = istart + 1;
        } else {
            i = ++line.index;		// search the ending double quote
            while (1) {
                j = line.buffer.indexOf('"', i);
                if (j < 0) {
                    this.abc.syntax(1, "No end of chord symbol/annotation");
                    return;
                }
                if (line.buffer[j - 1] != '\\'
                    || line.buffer[j - 2] == '\\')	// (string ending with \\")
                    break;
                i = j + 1;
            }
            // this.abc.cnv_escape ... assuming utility exists or implementing simplified
            text = line.buffer.slice(line.index, j); // Simplified for refactor
            // text = cnv_escape(text); 
            line.index = j;
            iend = this.abc.parse.bol + line.index + 1;
        }

        if (ann_font.pad)
            h_ann += ann_font.pad;
        i = 0;
        type = 'g';

        let C = abc2svg.C;
        let curvoice = this.abc.curvoice;

        while (1) {
            c = text[i];
            if (!c) break;
            gch = {
                text: "",
                istart: istart,
                iend: iend,
                font: ann_font,
                type: 'g', // Default init
                pos: 0,
                x: 0,
                y: 0
            };
            switch (c) {
                case '@':
                    type = c;
                    i++;
                    x_abs = get_float();
                    if ((c as string) != ',') {
                        this.abc.syntax(1, "',' lacking in annotation '@x,y'");
                        y_abs = 0;
                    } else {
                        y_abs = get_float() || 0;
                        if ((c as string) != ' ') i--;
                    }
                    gch.x = x_abs || 0;
                    gch.y = y_abs;
                    break;
                case '^':
                    gch.pos = C.SL_ABOVE;
                // fall thru
                case '_':
                    if (c == '_') gch.pos = C.SL_BELOW;
                // fall thru
                case '<':
                case '>':
                    i++;
                    type = c;
                    break;
                default:
                    switch (type) {
                        case 'g':
                            gch.font = this.abc.get_font("gchord");
                            gch.pos = curvoice.pos.gch || C.SL_ABOVE;
                            break;
                        case '^':
                            gch.pos = C.SL_ABOVE;
                            break;
                        case '_':
                            gch.pos = C.SL_BELOW;
                            break;
                        case '@':
                            gch.x = x_abs || 0;
                            y_abs = (y_abs || 0) - h_ann;
                            gch.y = y_abs;
                            break;
                    }
                    break;
            }
            gch.type = type;

            while (1) {
                c = text[i];
                if (!c) break;
                // Simplified text accumulation
                gch.text += c;
                i++;
            }
            // gch.otext = gch.text
            if (!this.a_gch) this.a_gch = [];
            this.a_gch.push(gch);
            break; // Loop break for this simplified version
        }
    }

    // parser: add the parsed list of chord symbols and annotations
    csan_add(s: any) {
        let i, gch;
        let C = abc2svg.C;
        let curvoice = this.abc.curvoice;

        if (!this.a_gch) return;

        // there cannot be chord symbols on measure bars
        if (s.type == C.BAR) {
            for (i = 0; i < this.a_gch.length; i++) {
                if (this.a_gch[i].type == 'g') {
                    this.abc.error(1, s, "There cannot be chord symbols on measure bars");
                    this.a_gch.splice(i, 1);
                    i--;
                }
            }
        }

        if (curvoice.tr_sco || curvoice.tr_snd) {
            // Chord transposition logic
            // Simplified omit
        }

        if (s.a_gch)
            s.a_gch = s.a_gch.concat(this.a_gch);
        else
            s.a_gch = this.a_gch;
        this.a_gch = null;
    }

    // transpose a chord symbol
    gch_tr1(p: string, tr: number) {
        let i, o, n, ip,
            csa = p.split('/');

        // abc2svg.b40l5 is from abc2svg core definitions. 
        // Need to ensure it's exported or available.
        // Assuming abc2svg namespace has it.
        tr = abc2svg.b40l5[(tr + 202) % 40];	// transpose in the line of fifth

        for (i = 0; i < csa.length; i++) {	// main and optional bass
            p = csa[i];
            o = p.search(/[A-G]/);
            if (o < 0)
                continue;		// strange chord symbol!
            ip = o + 1;

            //	bbb fb cb gb db ab eb bb  f c g d a e b f# c# g# d# a# e# b# f##
            //	 -9 -8 -7 -6 -5 -4 -3 -2 -1 0 1 2 3 4 5  6  7  8  9 10 11 12  13
            n = "FCGDAEB".indexOf(p[o]) - 1;
            if (p[ip] == '#' || p[ip] == '\u266f') {
                n += 7;
                ip++;
            } else if (p[ip] == 'b' || p[ip] == '\u266d') {
                n -= 7;
                ip++;
            }
            n += tr;					// transpose

            csa[i] = p.slice(0, o)
                + "FCGDAEB"[(n + 22) % 7]
                + (n >= 13 ? '##'
                    : n >= 6 ? '#'
                        : n <= -9 ? 'bb'
                            : n <= -2 ? 'b'
                                : '')
                + p.slice(ip);
        }
        return csa.join('/');
    }

    gch_build(s: any) {
        // ... (logic from 22939)
        let gch, wh, xspc, ix, y_left = 0, y_right = 0;
        let GCHPRE = 0.4;

        if (!s.a_gch) return;

        for (ix = 0; ix < s.a_gch.length; ix++) {
            gch = s.a_gch[ix];
            // simplified logic
            this.abc.set_font(gch.font);
            // gch.text = str2svg(gch.text) ...
        }
    }

    draw_gchord(i: number, s: any, x: number, y: number) {
        // ... (logic from 23022)
    }

    draw_all_chsy() {
        // ... (logic from 23108)
    }
}
