// abc2svg - Lyrics module
import { Abc, nil } from '../Abc';
import * as abc2svg from '../abc2svg';
import { C } from '../abc2svg';
import { Amusic, Aparser, Adeco, Adraw, Asvg, Asubs, Atune, Aformat, Afront, Alyrics, Agchord } from '../Store';
let abc: Abc;
export class Lyrics {
	constructor(abc_: Abc) {
		abc = abc_;
	}

	// abc.parse a symbol line (s:)
	get_sym(p: string, cont: boolean) {
		let s, c, i, j, d: string | number | undefined;
		let abc.curvoice = abc.curvoice;
		let C = abc2svg.C;

		if (abc.curvoice.ignore)
			return;

		// get the starting symbol of the lyrics
		if (cont) {					// +:
			s = abc.curvoice.sym_cont;
			if (!s) {
				abc.syntax(1, "+: symbol line without music");
				return;
			}
		} else {
			if (abc.curvoice.sym_restart) {		// new music
				abc.curvoice.sym_start = abc.curvoice.sym_restart;
				abc.curvoice.sym_restart = null;
			}
			s = abc.curvoice.sym_start;
			if (!s)
				s = abc.curvoice.sym;
			if (!s) {
				abc.syntax(1, "s: without music");
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
					while (s && s.type != abc2svg.C.BAR)
						s = s.next;
					if (!s) {
						abc.syntax(1, "Not enough measure bars for symbol line");
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
						abc.syntax(1, c == '!' ?
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
			while (s && s.type != abc2svg.C.NOTE)
				s = s.next;
			if (!s) {
				abc.syntax(1, "Too many elements in symbol line");
				return;
			}
			switch (c) {
				default:
					//		case '*':
					break;
				case '!':
					if (typeof d === 'string') {
						abc.parser.a_dcn.push(d.slice(1, -1));
						abc.deco.deco_cnv(s, s.prev);
					}
					break;
				case '"':
					if (j !== undefined)
						abc.parse.line.index = j + 2;	// (+ 's:')
					// abc.parse_gchord(d) // TODO: implement Gchord module
					// if (a_gch)			// if no abc.error
					//     csan_add(s)
					break;
			}
			s = s.next;
			i++;
		}
		abc.curvoice.sym_cont = s;
	}

	// abc.parse a lyric (vocal) line (w:)
	get_lyrics(p: string, cont: boolean) {
		let s, word, i, j, ly, dfnt, ln, c, cf;
		let abc.curvoice = abc.curvoice;
		let C = abc2svg.C;
		let abc.gene = abc.gene;

		if (abc.curvoice.ignore)
			return;
		if ((abc.curvoice.pos.voc & 0x07) != abc2svg.C.SL_HIDDEN)
			abc.curvoice.have_ly = true;

		// get the starting symbol of the lyrics
		if (cont) {					// +:
			s = abc.curvoice.lyric_cont;
			if (!s) {
				abc.syntax(1, "+: lyric without music");
				return;
			}
			if (p[0] == '~') {			// +:~next~words
				while (!s.a_ly)
					s = s.prev;
				ly = s.a_ly[abc.curvoice.lyric_line];
				p = ly.t.replace(/ /g, '~') + p;
			}

		} else {
			// abc.set_font("vocal")
			if (abc.curvoice.lyric_restart) {		// new music
				abc.curvoice.lyric_start = s = abc.curvoice.lyric_restart;
				abc.curvoice.lyric_restart = null;
				abc.curvoice.lyric_line = 0;
			} else {
				abc.curvoice.lyric_line++;
				s = abc.curvoice.lyric_start;
			}
			if (!s)
				s = abc.curvoice.sym;
			if (!s) {
				abc.syntax(1, "w: without music");
				return;
			}
		}

		/* scan the lyric line */
		i = 0;
		// cf = abc.gene.curfont
		while (1) {
			while (p[i] == ' ' || p[i] == '\t')
				i++;
			if (!p[i])
				break;
			ln = 0;
			j = (abc.parse.istart || 0) + i + 2;	// start index
			switch (p[i]) {
				case '|':
					while (s && s.type != abc2svg.C.BAR)
						s = s.next;
					if (!s) {
						abc.syntax(1, "Not enough measure bars for lyric line");
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
								abc.gene.curfont = abc.gene.deffont
							else if (c >= '1' && c <= '9')
								abc.gene.curfont = abc.get_font("u" + c)
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
			while (s && s.type != abc2svg.C.NOTE)
				s = s.next;
			if (!s) {
				abc.syntax(1, "Too many words in lyric line");
				return;
			}
			if (word && (s.pos.voc & 0x07) != abc2svg.C.SL_HIDDEN) {
				ly = {
					t: word,
					font: cf,
					istart: j,
					iend: j + word.length,
					ln: ln || undefined
				};
				if (!s.a_ly)
					s.a_ly = [];
				s.a_ly[abc.curvoice.lyric_line] = ly;
				// cf = abc.gene.curfont
			}
			s = s.next;
			i++;
		}
		abc.curvoice.lyric_cont = s;
	}
	// install the words under a note
	// (this function is called during the generation)
	ly_set(s) {
		var i,
			j,
			ly,
			d,
			s1,
			s2,
			p,
			w,
			spw,
			xx,
			sz,
			shift,
			dw,
			r,
			s3 = s, // start of the current time sequence
			wx = 0,
			wl = 0,
			n = 0,
			dx = 0,
			a_ly = s.a_ly,
			align = 0;

		// get the available horizontal space before the next lyric words
		for (s2 = s.ts_next; s2; s2 = s2.ts_next) {
			if (s2.seqst) {
				dx += s2.shrink;
				n++; // number of symbols without word
			}
			if (s2.bar_type) {
				// stop on a bar
				dx += 3; // and take some of its spacing
				break;
			}
			if (!s2.a_ly) continue;
			i = s2.a_ly.length;
			while (--i >= 0) {
				ly = s2.a_ly[i];
				if (!ly) continue;
				if (!ly.ln || ly.ln < 2) break;
			}
			if (i >= 0) break;
		}

		// define the offset of the words
		for (i = 0; i < a_ly.length; i++) {
			ly = a_ly[i];
			if (!ly) continue;
			abc.gene.curfont = ly.font;
			ly.t = abc.str2svg(ly.t);
			p = ly.t.replace(/<[^>]*>/g, ''); // remove the XML tags
			if (ly.ln >= 2) {
				ly.shift = 0;
				continue;
			}
			spw = cwid(' ') * ly.font.swfac;
			w = ly.t.wh[0];
			r = abc2svg.lypre.exec(p);
			if (s.type == abc2svg.C.GRACE) {
				// %%graceword
				shift = s.wl;
			} else if (r) {
				r = r[0];
				if (p[0] == '(') {
					sz = spw;
				} else {
					set_font(ly.font);
					if (p[r.length] == ' ' || r.slice(-1) == ':')
						sz = abc.strwh(p.slice(0, r.length))[0];
					else sz = w * 0.2;
				}
				shift = (w - sz) * 0.4;
				if (shift > 14) shift = 14;
				shift += sz;
				if (p[0] >= '0' && p[0] <= '9') {
					if (shift > align) align = shift;
				}
			} else {
				shift = w * 0.4;
				if (shift > 14) shift = 14;
			}
			ly.shift = shift;
			if (shift > wl) wl = shift; // max left space
			w += spw * 1.5; // space after the syllable
			w -= shift; // right width
			if (w > wx) wx = w; // max width
		}

		// set the left space
		while (!s3.seqst) s3 = s3.ts_prev;
		if (s3.ts_prev && s3.ts_prev.bar_type) wl -= 4; // don't move too much the measure bar
		if (s3.wl < wl) {
			s3.shrink += wl - s3.wl;
			s3.wl = wl;
		}

		// if not room enough, shift the following notes to the right
		dx -= 6;
		if (dx < wx && s2) {
			dx = (wx - dx) / n;
			s1 = s.ts_next;
			while (1) {
				if (s1.seqst) {
					s1.shrink += dx;
					s3.wr += dx; // (needed for end of line)
					s3 = s1;
				}
				if (s1 == s2) break;
				s1 = s1.ts_next;
			}
		}

		if (align > 0) {
			for (i = 0; i < a_ly.length; i++) {
				ly = a_ly[i];
				if (ly && ly.t[0] >= '0' && ly.t[0] <= '9') ly.shift = align;
			}
		}
	} // this.ly_set()

	/* -- draw the lyrics under (or above) notes -- */
	/* (the staves are not yet defined) */
	draw_lyric_line(p_voice, j, y) {
		var p, lastx, w, s, s2, ly, lyl, ln, hyflag, lflag, x0, shift;

		if (p_voice.hy_st & (1 << j)) {
			hyflag = true;
			p_voice.hy_st &= ~(1 << j);
		}
		for (s = p_voice.sym /*s*/; ; s = s.next)
			if (s.type != abc2svg.C.CLEF && s.type != abc2svg.C.KEY && s.type != abc2svg.C.METER) break;
		lastx = s.prev ? s.prev.x : abc.tsfirst.x;
		x0 = 0;
		for (; s; s = s.next) {
			if (s.a_ly) ly = s.a_ly[j];
			else ly = null;
			if (!ly) {
				switch (s.type) {
					case abc2svg.C.REST:
					case abc2svg.C.MREST:
						if (lflag) {
							abc.svg.out_wln(lastx + 3, y, x0 - lastx);
							lflag = false;
							lastx = s.x + s.wr;
						}
				}
				continue;
			}
			if (ly.font != abc.gene.curfont) /* font change */ abc.gene.curfont = ly.font;
			p = ly.t;
			ln = ly.ln || 0;
			w = p.wh[0];
			shift = ly.shift;
			if (hyflag) {
				if (ln == 3) {
					// '_'
					ln = 2;
				} else if (ln < 2) {
					// not '-'
					abc.svg.out_hyph(lastx, y, s.x - shift - lastx);
					hyflag = false;
					lastx = s.x + s.wr;
				}
			}
			if (lflag && ln != 3) {
				// not '_'
				abc.svg.out_wln(lastx + 3, y, x0 - lastx + 3);
				lflag = false;
				lastx = s.x + s.wr;
			}
			if (ln >= 2) {
				// '-' or '_'
				if (x0 == 0 && lastx > s.x - 18) lastx = s.x - 18;
				if (ln == 2)
					// '-'
					hyflag = true;
				else lflag = true;
				x0 = s.x - shift;
				continue;
			}
			x0 = s.x - shift;
			if (ln)
				// '-' at end
				hyflag = true;
			if (abc.user.abc.anno_start || abc.user.abc.anno_stop) {
				s2 = {
					p_v: s.p_v,
					st: s.st,
					istart: ly.istart,
					iend: ly.iend,
					ts_prev: s,
					ts_next: s.ts_next,
					x: x0,
					y: y,
					ymn: y,
					ymx: y + abc.gene.curfont.size,
					wl: 0,
					wr: w,
				};
				anno_start(s2, 'lyrics');
			}
			xy_str(x0, y, p);
			anno_stop(s2, 'lyrics');
			lastx = x0 + w;
		}
		if (hyflag) {
			hyflag = false;
			x0 = abc.realwidth - 10;
			if (x0 < lastx + 10) x0 = lastx + 10;
			abc.svg.out_hyph(lastx, y, x0 - lastx);
			if (p_voice.s_next && p_voice.s_next.fmt.hyphencont)
				p_voice.hy_st |= 1 << j;
		}

		/* see if any underscore in the next line */
		for (p_voice.s_next; s; s = s.next) {
			if (s.type == abc2svg.C.NOTE) {
				if (!s.a_ly) break;
				ly = s.a_ly[j];
				if (ly && ly.ln == 3) {
					// '_'
					lflag = true;
					x0 = abc.realwidth - 15;
					if (x0 < lastx + 12) x0 = lastx + 12;
				}
				break;
			}
		}
		if (lflag) {
			abc.svg.out_wln(lastx + 3, y, x0 - lastx + 3);
			lflag = false;
		}
	}

	draw_lyrics(p_voice, nly, a_h, y, incr) {
		/* 1: below, -1: above */
		var j,
			top,
			sc = abc.staff_tb[p_voice.st].staffscale;

		set_font('vocal');
		if (incr > 0) {
			/* under the staff */
			if (y > -abc.tsfirst.fmt.vocalspace) y = -abc.tsfirst.fmt.vocalspace;
			y *= sc;
			for (j = 0; j < nly; j++) {
				y -= a_h[j] * 1.1;
				abc.lyrics.draw_lyric_line(p_voice, j, y + a_h[j] * 0.22); // (descent)
			}
			return y / sc;
		}

		/* above the staff */
		top = abc.staff_tb[p_voice.st].topbar + abc.tsfirst.fmt.vocalspace;
		if (y < top) y = top;
		y *= sc;
		for (j = nly; --j >= 0;) {
			abc.lyrics.draw_lyric_line(p_voice, j, y + a_h[j] * 0.22);
			y += a_h[j] * 1.1;
		}
		return y / sc;
	}

	// -- draw all the lyrics --
	/* (the staves are not yet defined) */
	draw_all_lyrics() {
		var p_voice,
			s,
			v,
			nly,
			i,
			x,
			y,
			w,
			a_ly,
			ly,
			lyst_tb = new Array(abc.nstaff + 1),
			nv = abc.voice_tb.length,
			h_tb = new Array(nv),
			nly_tb = new Array(nv),
			above_tb = new Array(nv),
			rv_tb = new Array(nv),
			top = 0,
			bot = 0,
			st = -1;

		/* compute the number of lyrics per voice - staff
		 * and their y offset on the staff */
		for (v = 0; v < nv; v++) {
			p_voice = abc.voice_tb[v];
			if (!p_voice.sym) continue;
			if (p_voice.st != st) {
				top = 0;
				bot = 0;
				st = p_voice.st;
			}
			nly = 0;
			if (p_voice.have_ly) {
				if (!h_tb[v]) h_tb[v] = [];
				for (s = p_voice.sym; s; s = s.next) {
					a_ly = s.a_ly;
					if (!a_ly) continue;
					/*fixme:should get the real width*/
					x = s.x;
					w = 10;
					for (i = 0; i < a_ly.length; i++) {
						ly = a_ly[i];
						if (ly) {
							x -= ly.shift;
							w = ly.t.wh[0];
							break;
						}
					}
					y = abc.y_get(p_voice.st, 1, x, w);
					if (top < y) top = y;
					y = abc.y_get(p_voice.st, 0, x, w);
					if (bot > y) bot = y;
					while (nly < a_ly.length) h_tb[v][nly++] = 0;
					for (i = 0; i < a_ly.length; i++) {
						ly = a_ly[i];
						if (!ly) continue;
						if (!h_tb[v][i] || ly.t.wh[1] > h_tb[v][i]) h_tb[v][i] = ly.t.wh[1];
					}
				}
			} else {
				y = abc.y_get(p_voice.st, 1, 0, abc.realwidth);
				if (top < y) top = y;
				y = abc.y_get(p_voice.st, 0, 0, abc.realwidth);
				if (bot > y) bot = y;
			}
			if (!lyst_tb[st]) lyst_tb[st] = {};
			lyst_tb[st].top = top;
			lyst_tb[st].bot = bot;
			nly_tb[v] = nly;
			if (nly == 0) continue;
			if (p_voice.pos.voc) above_tb[v] = (p_voice.pos.voc & 0x07) == abc2svg.C.SL_ABOVE;
			else if (
				abc.voice_tb[v + 1] &&
				/*fixme:%%staves:KO - find an other way..*/
				abc.voice_tb[v + 1].st == st &&
				abc.voice_tb[v + 1].have_ly
			)
				above_tb[v] = true;
			else above_tb[v] = false;
			if (above_tb[v]) lyst_tb[st].a = true;
			else lyst_tb[st].b = true;
		}

		/* draw the lyrics under the staves */
		i = 0;
		for (v = 0; v < nv; v++) {
			p_voice = abc.voice_tb[v];
			if (!p_voice.sym) continue;
			if (!p_voice.have_ly) continue;
			if (above_tb[v]) {
				rv_tb[i++] = v;
				continue;
			}
			st = p_voice.st;
			// don't scale the lyrics
			set_dscale(st, true);
			if (nly_tb[v] > 0)
				lyst_tb[st].bot = abc.draw_lyrics(
					p_voice,
					nly_tb[v],
					h_tb[v],
					lyst_tb[st].bot,
					1,
				);
		}

		/* draw the lyrics above the staff */
		while (--i >= 0) {
			v = rv_tb[i];
			p_voice = abc.voice_tb[v];
			st = p_voice.st;
			abc.svg.abc.set_dscale(st, true);
			lyst_tb[st].top = abc.lyrics.draw_lyrics(
				p_voice,
				nly_tb[v],
				h_tb[v],
				lyst_tb[st].top,
				-1,
			);
		}

		/* set the max y offsets of all symbols */
		for (v = 0; v < nv; v++) {
			p_voice = abc.voice_tb[v];
			if (!p_voice.sym) continue;
			st = p_voice.st;
			if (lyst_tb[st].a) {
				top = lyst_tb[st].top + 2;
				for (s = p_voice.sym; s; s = s.next) {
					/*fixme: may have lyrics crossing a next symbol*/
					if (s.a_ly) {
						/*fixme:should set the real width*/
						y_set(st, 1, s.x - 2, 10, top);
					}
				}
			}
			if (lyst_tb[st].b) {
				bot = lyst_tb[st].bot - 2;
				if (nly_tb[p_voice.v] > 0) {
					for (s = p_voice.sym; s; s = s.next) {
						if (s.a_ly) {
							/*fixme:should set the real width*/
							y_set(st, 0, s.x - 2, 10, bot);
						}
					}
				} else {
					y_set(st, 0, 0, abc.realwidth, bot);
				}
			}
		}
	}
}






