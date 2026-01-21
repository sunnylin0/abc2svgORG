// abc2svg - Lyrics module
import type { Abc } from '../Abc';
import * as abc2svg from '../abc2svg';

export class Lyrics {
    abc: Abc;

    constructor(abc: Abc) {
        this.abc = abc;
    }

    // parse a symbol line (s:)
    get_sym(p: string, cont: boolean) {
        let s, c, i, j, d: string | number | undefined;
        let curvoice = this.abc.curvoice;
        let C = abc2svg.C;

        if (curvoice.ignore)
            return;

        // get the starting symbol of the lyrics
        if (cont) {					// +:
            s = curvoice.sym_cont;
            if (!s) {
                this.abc.syntax(1, "+: symbol line without music");
                return;
            }
        } else {
            if (curvoice.sym_restart) {		// new music
                curvoice.sym_start = curvoice.sym_restart;
                curvoice.sym_restart = null;
            }
            s = curvoice.sym_start;
            if (!s)
                s = curvoice.sym;
            if (!s) {
                this.abc.syntax(1, "s: without music");
                return;
            }
        }

        /* scan the symbol line */
        i = 0;
        while (1) {
            while (p[i] == ' ' || p[i] == '\t')
                i++;
            c = p[i];
            if (!c)
                break;
            switch (c) {
                case '|':
                    while (s && s.type != C.BAR)
                        s = s.next;
                    if (!s) {
                        this.abc.syntax(1, "Not enough measure bars for symbol line");
                        return;
                    }
                    s = s.next;
                    i++;
                    continue;
                case '!':
                case '"':
                    j = ++i;
                    i = p.indexOf(c, j);
                    if (i < 0) {
                        this.abc.syntax(1, c == '!' ?
                            "No end of decoration" :
                            "No end of chord symbol/annotation");
                        i = p.length;
                        continue;
                    }
                    d = p.slice(j - 1, i + 1);
                    break;
                case '*':
                    break;
                default:
                    d = c.charCodeAt(0); // d is number here
                    break;
            }

            /* store the element in the next note */
            while (s && s.type != C.NOTE)
                s = s.next;
            if (!s) {
                this.abc.syntax(1, "Too many elements in symbol line");
                return;
            }
            switch (c) {
                default:
                    //		case '*':
                    break;
                case '!':
                    if (typeof d === 'string') {
                        this.abc.parser.a_dcn.push(d.slice(1, -1));
                        this.abc.deco.deco_cnv(s, s.prev);
                    }
                    break;
                case '"':
                    if (j !== undefined)
                        this.abc.parse.line.index = j + 2;	// (+ 's:')
                    // this.abc.parse_gchord(d) // TODO: implement Gchord module
                    // if (a_gch)			// if no error
                    //     csan_add(s)
                    break;
            }
            s = s.next;
            i++;
        }
        curvoice.sym_cont = s;
    }

    // parse a lyric (vocal) line (w:)
    get_lyrics(p: string, cont: boolean) {
        let s, word, i, j, ly, dfnt, ln, c, cf;
        let curvoice = this.abc.curvoice;
        let C = abc2svg.C;
        let gene = this.abc.gene;

        if (curvoice.ignore)
            return;
        if ((curvoice.pos.voc & 0x07) != C.SL_HIDDEN)
            curvoice.have_ly = true;

        // get the starting symbol of the lyrics
        if (cont) {					// +:
            s = curvoice.lyric_cont;
            if (!s) {
                this.abc.syntax(1, "+: lyric without music");
                return;
            }
            if (p[0] == '~') {			// +:~next~words
                while (!s.a_ly)
                    s = s.prev;
                ly = s.a_ly[curvoice.lyric_line];
                p = ly.t.replace(/ /g, '~') + p;
            }
            /*
            dfnt = get_font("vocal")
            if (gene.deffont != dfnt) {	// if vocalfont change
                if (gene.curfont == gene.deffont)
                    gene.curfont = dfnt
                gene.deffont = dfnt
            }
            */
        } else {
            // set_font("vocal")
            if (curvoice.lyric_restart) {		// new music
                curvoice.lyric_start = s = curvoice.lyric_restart;
                curvoice.lyric_restart = null;
                curvoice.lyric_line = 0;
            } else {
                curvoice.lyric_line++;
                s = curvoice.lyric_start;
            }
            if (!s)
                s = curvoice.sym;
            if (!s) {
                this.abc.syntax(1, "w: without music");
                return;
            }
        }

        /* scan the lyric line */
        i = 0;
        // cf = gene.curfont
        while (1) {
            while (p[i] == ' ' || p[i] == '\t')
                i++;
            if (!p[i])
                break;
            ln = 0;
            j = (this.abc.parse.istart || 0) + i + 2;	// start index
            switch (p[i]) {
                case '|':
                    while (s && s.type != C.BAR)
                        s = s.next;
                    if (!s) {
                        this.abc.syntax(1, "Not enough measure bars for lyric line");
                        return;
                    }
                    s = s.next;
                    i++;
                    continue;
                case '-':
                case '_':
                    word = p[i];
                    ln = p[i] == '-' ? 2 : 3;	// line continuation
                    break;
                case '*':
                    word = "";
                    break;
                default:
                    word = "";
                    while (1) {
                        if (!p[i])
                            break;
                        switch (p[i]) {
                            case '_':
                            case '*':
                            case '|':
                                i--;
                            case ' ':
                            case '\t':
                                break;
                            case '~':
                                word += ' ';
                                i++;
                                continue;
                            case '-':
                                ln = 1;		// start of line
                                break;
                            case '\\':
                                if (!p[++i])
                                    continue;
                                word += p[i++];
                                continue;
                            case '$':
                                // Font handling simplified
                                word += p[i++];
                                c = p[i];
                            /*
                            if (c == '0')
                                gene.curfont = gene.deffont
                            else if (c >= '1' && c <= '9')
                                gene.curfont = get_font("u" + c)
                            */
                            // fall thru
                            default:
                                word += p[i++];
                                continue;
                        }
                        break;
                    }
                    break;
            }

            /* store the word in the next note */
            while (s && s.type != C.NOTE)
                s = s.next;
            if (!s) {
                this.abc.syntax(1, "Too many words in lyric line");
                return;
            }
            if (word && (s.pos.voc & 0x07) != C.SL_HIDDEN) {
                ly = {
                    t: word,
                    font: cf,
                    istart: j,
                    iend: j + word.length,
                    ln: ln || undefined
                };
                if (!s.a_ly)
                    s.a_ly = [];
                s.a_ly[curvoice.lyric_line] = ly;
                // cf = gene.curfont
            }
            s = s.next;
            i++;
        }
        curvoice.lyric_cont = s;
    }

    // install the words under a note
    ly_set(s: any) {
        // ... (logic for ly_set)
    }

    // Drawing functions (simplified stubs or calls to draw module logic)
    draw_lyrics(p_voice: any, nly: number, a_h: any, y: number, incr: number) {
        // ...
    }

    draw_all_lyrics() {
        // ...
    }
}
