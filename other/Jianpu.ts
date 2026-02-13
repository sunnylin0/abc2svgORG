// abc2svg - Jianpu module
import { Abc } from '../src/Abc';
import * as abc2svg from '../src/abc2svg';
let abc: Abc;
export class Jianpu {
	static k_tb = ["Cb", "Gb", "Db", "Ab", "Eb", "Bb", "F",
		"C",
		"G", "D", "A", "E", "B", "F#", "C#"];
	static cde2fcg = new Int8Array([0, 2, 4, -1, 1, 3, 5]);
	static cgd2cde = new Int8Array([0, -4, -1, -5, -2, -6, -3,
		0, -4, -1, -5, -2, -6, -3, 0]);
	static acc2 = new Int8Array([-2, -1, 3, 1, 2]);
	static acc_tb = ["\ue264", "\ue260", "", "\ue262", "\ue263", "\ue261"];

	constructor(abc_: Abc) {
		abc = abc_;
	}

	// don't calculate the beams
	calc_beam(of: Function, bm: any, s1: any) {
		if (!s1.p_v.jianpu)
			return of(bm, s1);
		// return 0
	}

	// adjust some symbols before the generation
	output_music(of: Function) {
		let p_v: any, v,
			C = abc2svg.C,
			cur_sy = abc.get_cur_sy(),
			voice_tb = abc.get_voice_tb();

		// handle the overlay voices
		const ov_def = (v: number) => {
			let s1, tim,
				s = p_v.sym;

			while (s) {
				s1 = s.ts_prev;
				if (!s.invis
					&& s.dur
					&& s1.v != v
					&& s1.st == s.st	// overlay start
					&& s1.time == s.time) {
					while (1) {	// go back to the previous bar
						if (!s1.prev
							|| s1.prev.bar_type)
							break;
						s1 = s1.prev;
					}
					//add deco '{' on s1
					while (!s1.bar_type) {
						s1.dy = 14;
						s1.notes[0].pit = 30;
						if (s1.type == C.REST)
							s1.combine = -1;
						s1 = s1.next;
					}
					// add deco '}' on s1

					while (1) {
						s.dy = -14;
						s.notes[0].pit = 20;
						if (!s.next
							|| s.next.bar_type
							|| s.next.time >= s1.time)
							break;
						s = s.next;
					}
				}
				s = s.next;
			}
		};

		// output the key and time signatures
		const set_head = () => {
			let v, p_v, mt, s2, sk, s,
				tsfirst = abc.get_tsfirst();

			// search a jianpu voice
			for (v = 0; v < voice_tb.length; v++) {
				p_v = voice_tb[v];
				if (p_v.jianpu)
					break;
			}
			if (v >= voice_tb.length)
				return;

			mt = p_v.meter.a_meter[0];
			sk = p_v.key;
			s2 = p_v.sym;
			s = {
				type: C.BLOCK,
				subtype: "text",
				time: s2.time,
				dur: 0,
				v: 0,
				p_v: p_v,
				st: 0,
				fmt: s2.fmt,
				seqst: true,
				text: (sk.k_mode + 1) + "=" +
					(Jianpu.k_tb[sk.k_sf + 7 +
						Jianpu.cde2fcg[sk.k_mode]]),
				font: abc.get_font("text")
			} as any;

			if (mt)
				s.text += ' ' + (mt.bot ? (mt.top + '/' + mt.bot) : mt.top);

			// insert the block after the first %%staves
			s2 = tsfirst;
			s.next = s2.next;
			if (s.next)
				s.next.prev = s;
			s.prev = s2;
			s2.next = s;
			s.ts_next = s2.ts_next;
			s.ts_next.ts_prev = s;
			s.ts_prev = s2;
			s2.ts_next = s;
		}

		// expand a long note/rest
		const slice = (s: any) => {
			let n, s2, s3,
				jn = s.type == C.REST ? 0 : 8;	// '0' or '-'

			if (s.dur >= C.BLEN)
				n = 3;
			else if (s.dur == C.BLEN / 2)
				n = 1;
			else
				n = 2;

			// duplicate the note/rest for display
			s2 = Abc.clone(s);
			s2.invis =
				s2.play = 1; //true
			s2.next = s;
			if (s2.prev)
				s2.prev.next = s2;
			s.prev = s2;
			s2.ts_next = s;
			if (s2.ts_prev)
				s2.ts_prev.ts_next = s2;
			s.ts_prev = s2;
			delete s.seqst;
			s.noplay = 1; // true

			// create the continuation symbols
			// s.notes[0].dur =
			s.dur = s.dur_orig = C.BLEN / 4;
			delete s.fmr;
			while (--n >= 0) {
				s2 = {
					type: C.REST,
					v: s.v,
					p_v: s.p_v,
					st: s.st,
					dur: C.BLEN / 4,
					dur_orig: C.BLEN / 4,
					fmt: s.fmt,
					stem: 0,
					multi: 0,
					nhd: 0,
					notes: [{
						dur: s.dur,
						pit: s.notes[0].pit,
						jn: jn
					}],
					xmx: 0,
					noplay: true,
					time: s.time + C.BLEN / 4,
					prev: s,
					next: s.next
				} as any;
				s.next = s2;
				if (s2.next)
					s2.next.prev = s2;

				if (!s.ts_next) {
					s.ts_next = s2;
					if (s.soln)
						s.soln = false;
					s2.ts_prev = s;
					s2.seqst = true;
				} else {
					for (s3 = s.ts_next; s3; s3 = s3.ts_next) {
						if (s3.time < s2.time)
							continue;
						if (s3.time > s2.time) {
							s2.seqst = true;
							s3 = s3.ts_prev;
						}
						s2.ts_next = s3.ts_next;
						s2.ts_prev = s3;
						if (s2.ts_next)
							s2.ts_next.ts_prev = s2;
						s3.ts_next = s2;
						break;
					}
				}
				s = s2;
			}
		}

		const set_note = (s: any, sf: number) => {
			let i, m, note, p, pit, a, nn,
				delta = Jianpu.cgd2cde[sf + 7] - 2;

			s.stem = -1;
			s.stemless = true;

			if (s.sls) {
				for (i = 0; i < s.sls.length; i++)
					s.sls[i].ty = C.SL_ABOVE;
			}

			for (m = 0; m <= s.nhd; m++) {
				note = s.notes[m];

				// note head
				p = note.pit;
				pit = p + delta;
				note.jn = ((pit + 77) % 7) + 1;	// note number

				// set a fixed offset to the note for the decorations
				note.pit = 25;			// "e"

				note.jo = (pit / 7) | 0;	// octave number

				// accidentals
				a = note.acc;
				if (a) {
					nn = Jianpu.cde2fcg[(p + 5 + 16 * 7) % 7] - sf;
					if (a != 3)
						nn += a * 7;
					nn = ((((nn + 1 + 21) / 7) | 0) + 2 - 3 + 32 * 5) % 5;
					note.acc = Jianpu.acc2[nn];
				}

				// set the slurs and ties up
				if (note.sls) {
					for (i = 0; i < note.sls.length; i++)
						note.sls[i].ty = C.SL_ABOVE;
				}
				if (note.tie_ty)
					note.tie_ty = C.SL_ABOVE;
			}

			// change the long notes
			if (s.dur >= C.BLEN / 2
				&& !s.invis)
				slice(s);

			// replace the staccato dot
			if (s.a_dd) {
				for (i = 0; i < s.a_dd.length; i++) {
					if (s.a_dd[i].glyph == "stc") {
						abc.deco_put("gstc", s);
						s.a_dd[i] = s.a_dd.pop();
					}
				}
			}
		}

		const set_sym = (p_v: any) => {
			let s, g,
				sf = p_v.key.k_sf;

			delete p_v.key.k_a_acc;		// no accidental

			// no (visible) clef
			s = p_v.clef;
			s.invis = true;
			s.clef_type = 't';
			s.clef_line = 2;

			// scan the voice
			for (s = p_v.sym; s; s = s.next) {
				s.st = p_v.st;
				switch (s.type) {
					case C.CLEF:
						s.invis = true;
						s.clef_type = 't';
						s.clef_line = 2;
					//				continue
					default:
						continue;
					case C.KEY:
						sf = s.k_sf;
						s.a_gch = [{
							type: '@',
							font: abc.get_font("annotation"),
							wh: [10, 10],
							x: -5,
							y: 26,
							text: (s.k_mode + 1) + "=" +
								(Jianpu.k_tb[sf + 7 +
									Jianpu.cde2fcg[s.k_mode]])
						}];
						continue;
					case C.REST:
						if (s.notes[0].jn)
							continue;
						s.notes[0].jn = 0;
						if (s.dur >= C.BLEN / 2
							&& !s.invis)
							slice(s);
						continue;
					case C.NOTE:			// change the notes
						set_note(s, sf);
						break;
					case C.GRACE:
						for (g = s.extra; g; g = g.next)
							set_note(g, sf);
						break;
				}
			}
		} // set_sym()

		set_head();

		for (v = 0; v < voice_tb.length; v++) {
			p_v = voice_tb[v];
			if (p_v.jianpu) {
				set_sym(p_v);
				if (p_v.second)
					ov_def(v);
			}
		}

		of();
	}

	draw_symbols(of: Function, p_voice: any) {
		let s, s2, g, nl, y,
			C = abc2svg.C,
			dot = "\ue1e7",
			anno_a = abc.anno_a,
			staff_tb = abc.get_staff_tb(),
			out_svg = abc.out_svg.bind(abc),
			out_sxsy = abc.out_sxsy.bind(abc),
			xypath = abc.xypath.bind(abc);

		if (!p_voice.jianpu) {
			of(p_voice);
			return;
		}

		// draw the duration lines under the notes
		const draw_dur = (s1: any, x: number, y: number, s2: any, n: number, nl: number) => {
			let s, s3;

			xypath(x - 3, y + 5);
			out_svg('h' + (s2.x - s1.x + 8).toFixed(1) + '"/>\n');
			y -= 2.5;
			while (++n <= nl) {
				s = s1;
				while (1) {
					if (s.nflags && s.nflags >= n) {
						s3 = s;
						while (s != s2) {
							if (s.next.beam_br1
								|| (s.next.beam_br2 && n > 2)
								|| (s.next.nflags
									&& s.next.nflags < n))
								break;
							s = s.next;
						}
						draw_dur(s3, s3.x, y, s, n, nl);
					}
					if (s == s2)
						break;
					s = s.next;
				}
			}
		} // draw_dur()

		// draw the duration lines of grace notes
		// and the slurs
		// (assume all notes have the same duration)
		const draw_dgr = (s: any) => {
			let g, x: number, l,
				y = staff_tb[s.st].y,
				s2 = s.extra,
				nl = s2.nflags;

			for (g = s2; g.next; g = g.next)
				;
			out_svg('<g transform="translate(');
			out_sxsy(s2.x, ',', y + 19);	// (font height + 4)
			out_svg(') scale(.5)" stroke-width="1.5">\n');
			abc.stv_g.g++;			// in container
			l = ((g.x - s2.x) * 2 + 8).toFixed(1);
			y = (nl > 0 ? 5 * nl : 0) + 2;
			if (nl > 0) {
				xypath(-3, 0);
				while (--nl >= 0) {
					out_svg('m0 4h' + l);
					l = -l;
				}
				out_svg('"/>\n');
			}
			if (s.fmt.graceslurs		// if a slur, 
				&& !s.sl1) {			// but not an explicit one
				l = Math.abs(l)
				out_svg('<path class="stroke" \
					d="m' + (l / 2 - 3).toFixed(1) + ' ' + y.toFixed(1))
				if (s.gr_shift) {
					out_svg('m0 0c0 10 0 10 -10 10')
				} else {
					out_svg('m0 0c0 10 0 10 10 10')
				}
				out_svg('"/>\n')
			}
			out_svg('</g>\n')
			abc.stv_g.g--
		} // draw_dgr()

		// Re-implement draw_dgr properly
		const draw_dgr_fixed = (s: any) => {
			let g, x, l: number,
				y = staff_tb[s.st].y,
				s2 = s.extra,
				nl = s2.nflags;

			for (g = s2; g.next; g = g.next)
				;
			out_svg('<g transform="translate(');
			out_sxsy(s2.x, ',', y + 19);	// (font height + 4)
			out_svg(') scale(.5)" stroke-width="1.5">\n');
			abc.stv_g.g++;			// in container
			l = (g.x - s2.x) * 2 + 8;
			y = (nl > 0 ? 5 * nl : 0) + 2;
			if (nl > 0) {
				xypath(-3, 0);
				while (--nl >= 0) {
					out_svg('m0 4h' + l.toFixed(1));
					l = -l;
				}
				out_svg('"/>\n');
			}
			if (s.fmt.graceslurs		// if a slur, 
				&& !s.sl1) {			// but not an explicit one
				l = Math.abs(l);
				out_svg('<path class="stroke" \
					d="m' + (l / 2 - 3).toFixed(1) + ' ' + y.toFixed(1))
				if (s.gr_shift) {
					out_svg('m0 0c0 10 0 10 -10 10')
				} else {
					out_svg('m0 0c0 10 0 10 10 10')
				}
				out_svg('"/>\n')
			}
			out_svg('</g>\n');
			abc.stv_g.g--;
		}

		const out_mus = (x: number, y: number, p: string) => {
			out_svg('<text x="');
			out_sxsy(x, '" y="', y);
			out_svg('">' + p + '</text>\n');
		}

		const out_txt = (x: number, y: number, p: string) => {
			out_svg('<text class="fj" x="');
			out_sxsy(x, '" y="', y);
			out_svg('">' + p + '</text>\n');
		}

		const draw_hd = (s: any, x: number, y: number) => {
			let m, note, ym;

			for (m = 0; m <= s.nhd; m++) {
				note = s.notes[m];
				out_txt(x - 3.5, y + 8, "01234567-"[note.jn]);
				if (note.acc)
					out_mus(x - 12, y + 12,
						Jianpu.acc_tb[note.acc + 2] || "");
				if (note.jo > 2) {
					out_mus(x - 1, y + 22, dot);
					if (note.jo > 3) {
						y += 3;
						out_mus(x - 1, y + 22, dot);
					}
				} else if (note.jo < 2) {
					ym = y + 4;
					if (m == 0 && s.nflags > 0)
						ym -= 2.5 * s.nflags;
					out_mus(x - 1, ym, dot);
					if (note.jo < 1) {
						ym -= 3;
						out_mus(x - 1, ym, dot);
					}
				}
				y += 20;
			}
		}

		const draw_note = (s: any) => {
			let sc = 1,
				x = s.x,
				y = staff_tb[s.st].y;

			if (s.dy)
				y += s.dy;			// voice overlay

			if (s.grace) {
				out_svg('<g transform="translate(');
				out_sxsy(x, ',', y + 15);	// (font height)
				out_svg(') scale(.5)">\n');
				abc.stv_g.g++;			// in container
				x = 0;
				y = 0;
				sc = .5;
			}

			draw_hd(s, x, y);

			if (s.nflags >= 0 && s.dots)
				out_mus(x + 8 * sc, y + 13 * sc, dot);
			if (s.grace) {
				out_svg('</g>\n');
				abc.stv_g.g--;
			}
			if (anno_a) anno_a.push(s);
		}

		// -- draw_symbols --
		for (s = p_voice.sym; s; s = s.next) {
			if (s.invis)
				continue;
			switch (s.type) {
				case C.METER:
					abc.draw.draw_meter(s); // Accessing draw module for draw_meter
					break;
				case C.NOTE:
				case C.REST:
					draw_note(s);
					break;
				case C.GRACE:
					for (g = s.extra; g; g = g.next)
						draw_note(g);
					break;
			}
		}

		// draw the (pseudo) beams
		for (s = p_voice.sym; s; s = s.next) {
			if (s.invis)
				continue;
			switch (s.type) {
				case C.NOTE:
				case C.REST:
					nl = s.nflags;
					if (nl <= 0)
						continue;
					y = staff_tb[s.st].y;
					s2 = s;
					while (1) {
						if (s.nflags > nl)
							nl = s.nflags;
						if (s.beam_end)
							break;
						if (s.type == C.GRACE)
							draw_dgr_fixed(s);
						if (!s.next)
							break;
						s = s.next;
					}
					if (s.dy)
						y += s.dy;
					draw_dur(s2, s2.x, y, s, 1, nl);
					break;
				case C.GRACE:
					draw_dgr_fixed(s);
					break;
			}
		}
	}

	set_fmt(of: Function, cmd: string, param: string) {
		if (cmd == "jianpu") {
			abc.set_v_param("jianpu", param);
			return;
		}
		of(cmd, param);
	}

	set_pitch(of: Function, last_s: any) {
		of(last_s);
		if (!last_s)
			return;			// first time

		let C = abc2svg.C,
			s;

		for (s = abc.get_tsfirst(); s; s = s.ts_next) {
			if (!s.p_v.jianpu)
				continue;
			switch (s.type) {

				// draw the key signature only in the first voice
				// and not at start of the staff
				case C.KEY:
					if (s.prev.type == C.CLEF
						|| s.v != 0)
						s.a_gch = null;
					break;

				// adjust the vertical spacing above the note heads
				case C.NOTE:
					s.ymx = 20 * s.nhd + 22;
					if (s.notes[s.nhd].jo > 2) {
						s.ymx += 3;
						if (s.notes[s.nhd].jo > 3)
							s.ymx += 2;
					}
					s.ymn = 0;		// bottom of line
					break;
			}
		}
	}

	set_vp(of: Function, a: any[]) {
		let i,
			p_v = abc.curvoice;

		for (i = 0; i < a.length; i++) {
			if (a[i] == "jianpu=") {
				p_v.jianpu = abc.get_bool(a[++i]);
				if (p_v.jianpu)
					abc.set_vp([
						"staffsep=", "20",
						"sysstaffsep=", "14",
						"stafflines=", "...",
						"tuplets=", "0 1 0 1"
						// [auto, slur, number, above]
					]);
				break;
			}
		}
		of(a);
	}

	set_width(of: Function, s: any) {
		of(s);
		if (!s.p_v			// (if voice_tb[v].clef/key/meter)
			|| !s.p_v.jianpu)
			return;

		let w, m, note,
			C = abc2svg.C;

		switch (s.type) {
			case C.CLEF:
			case C.KEY:
				//	case C.METER:
				s.wl = s.wr = .1;		// (must not be null)
				break;
			case C.NOTE:
				for (m = 0; m <= s.nhd; m++) {
					note = s.notes[m];
					if (note.acc && s.wl < 14)	// room for the accidental
						s.wl = 14;
				}
				break;
		}
	}

	// Static hook for setup
	static hook(abc: Abc) {
		const jianpu = new Jianpu(abc);

		// Wrapping methods
		abc.hooks.calculate_beam = jianpu.calc_beam.bind(jianpu);
		abc.hooks.draw_symbols = jianpu.draw_symbols.bind(jianpu);
		abc.hooks.output_music = jianpu.output_music.bind(jianpu);
		abc.hooks.set_fmt = jianpu.set_fmt.bind(jianpu);
		abc.hooks.set_pitch = jianpu.set_pitch.bind(jianpu);
		abc.hooks.set_vp = jianpu.set_vp.bind(jianpu);
		abc.hooks.set_width = jianpu.set_width.bind(jianpu);

		// big staccato dot
		abc.get_glyphs().gstc = '<circle id="gstc" cx="0" cy="-3" r="2"/>'
		abc.get_decos().gstc = "0 gstc 5 1 1"

		abc.add_style("\n.fj{font:15px sans-serif}")

		// Access defaults
		// abc.svg.glyphs or similar need method access.
		// Assuming accessible via methods or public.
		// (Assuming abc.add_style etc exist - they were in api check)
	}
}
