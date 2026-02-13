// abc2svg - Tune module
import { Abc, nil } from '../Abc';
import * as abc2svg from '../abc2svg';
import { C } from '../abc2svg';
import { Amusic, Aparser, Adeco, Adraw, Asvg, Asubs, Atune, Aformat, Afront, Alyrics, Agchord } from '../Store';
let abc: Abc;
export class Tune {
	// State variables (moved from local vars in tune.js)
	par_sy: any;// current staff system for abc.parse
	cur_sy: any;// current staff system for generation
	staves_found: number = 0;
	tsfirst: any;
	vover; // voice overlay
	constructor(abc_: Abc) {
		abc = abc_;
	}

	// apply the %%voice options of the current voice
	voice_filter() {
		let opt,
			parse = abc.parse,
			abc.curvoice = abc.curvoice,
			self = abc; // Abc instance

		function vfilt(opts: any, opt: string) {
			let i,
				sel = new RegExp(opt);

			if (sel.test(abc.curvoice.id)
				|| sel.test(abc.curvoice.nm)) {
				for (i = 0; i < opts.length; i++)
					// Assuming do_pscom is a method on Abc (self) or Parse?
					// In original: self.do_pscom(opts[i]) -> Abc.prototype.do_pscom
					// We need to ensure do_pscom is in Abc or handle it.
					// For now, assume it's on Abc.
					(self as any).do_pscom(opts[i]);
			}
		}

		// global
		if (abc.parse.voice_opts)
			for (opt in abc.parse.voice_opts) {
				if (abc.parse.voice_opts.hasOwnProperty(opt))
					vfilt(abc.parse.voice_opts[opt], opt);
			}

		// tune
		if (abc.parse.tune_v_opts)
			for (opt in abc.parse.tune_v_opts) {
				if (abc.parse.tune_v_opts.hasOwnProperty(opt))
					vfilt(abc.parse.tune_v_opts[opt], opt);
			}
	}

	// link a ABC symbol into the current voice
	sym_link(s: any) {
		let tim = abc.curvoice.time;

		if (!s.fname) abc.parser.set_ref(s);

		if (!abc.curvoice.ignore) {
			s.prev = abc.curvoice.last_sym;
			if (abc.curvoice.last_sym) abc.curvoice.last_sym.next = s;
			else abc.curvoice.sym = s;
		} else if (s.bar_type) {
		}
		s.v = abc.curvoice.v;
		s.p_v = abc.curvoice;
		s.st = abc.curvoice.cst;
		s.time = tim;
		if (s.dur && !s.grace) abc.curvoice.time += s.dur;
		s.fmt = abc.cfmt; // global parameters
		s.pos = abc.curvoice.pos;
		if (abc.curvoice.second) s.second = true;
		if (abc.curvoice.floating) s.floating = true;
		if (abc.curvoice.eoln) {
			s.soln = true;
		}
	}

	// add a new symbol in a voice
	sym_add(p_voice: any, type: number) {
		let s: any = {
			type: type,
			dur: 0
		},
			s2,
			p_voice2 = abc.curvoice;
		sym_link(s);
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
	/* -- sort all symbols by time and vertical sequence -- */
	// weight of the symbols !! depends on the symbol type !!
	w_tb = new Uint8Array([
		6, // bar
		2, // clef
		8, // custos
		6, // sm (sequence marker, after bar)
		7, // grace
		3, // key
		4, // meter
		9, // mrest
		9, // note
		0, // part
		9, // rest
		5, // space (before bar)
		0, // staves
		1, // stbrk
		0, // tempo
		0, // (free)
		0, // block
		0, // remark
	]);

	// sort all symbols by time and vertical sequence
	sort_all() {
		let s, s2, time, w, wmin, ir, fmt, v, p_voice, prev: any,
			fl, new_sy: any,
			nv = abc.voice_tb.length,
			vtb: any[] = [],
			vn: any[] = [],			// voice indexed by range
			sy = abc.cur_sy;			// first staff system


		// check if different bars at the same time
		// (Moved inside or defined as helper, keeping inline for access to scope variables)
		const b_chk = () => {
			var bt,
				s,
				s2,
				v,
				t,
				ir = 0;

			while (1) {
				v = vn[ir++];
				if (v == undefined) break;
				s = vtb[v];
				if (!s || !s.bar_type || s.invis || s.time != time) continue;
				if (!bt) {
					bt = s.bar_type;
					if (s.text && bt == '|') t = s.text;
					continue;
				}
				if (s.bar_type != bt) break;
				if (s.text && !t && bt == '|') {
					t = s.text;
					break;
				}
			}

			if (v == undefined) return; // no problem

			// change "::" to ":| |:"
			// and    "|1" to "| [1"
			if (bt == '::' || bt == ':|' || t) {
				ir = 0;
				bt = t ? '|' : '::';
				while (1) {
					v = vn[ir++];
					if (v == undefined) break;
					s = vtb[v];
					if (!s || s.invis || s.bar_type != bt || (bt == '|' && !s.text))
						continue;
					s2 = Abc.clone(s);
					if (bt == '::') {
						s.bar_type = ':|';
						s2.bar_type = '|:';
					} else {
						//					s.bar_type = '|'
						delete s.text;
						delete s.rbstart;
						s2.bar_type = '[';
						s2.invis = 1; //true
						s2.xsh = 0;
					}
					s2.next = s.next;
					if (s2.next) s2.next.prev = s2;
					s2.prev = s;
					s.next = s2;
				}
			} else {
				abc.error(
					1,
					s,
					'Different bars $1 and $2',
					bt + (t || ''),
					s.bar_type + (s.text || ''),
				);
			}
		} // b_chk()

		// set the first symbol of each voice
		for (v = 0; v < nv; v++) {
			s = abc.voice_tb[v].sym;
			vtb[v] = s;
			if (sy.voices[v]) {
				vn[sy.voices[v].range] = v;
				if (!prev && s) {
					fmt = s.fmt;
					p_voice = abc.voice_tb[v];
					prev = {	// symbol defining the first staff system
						type: abc2svg.C.STAVES,
						fname: abc.parse.fname,
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

		if (!prev) return;	// no symbol yet

		// insert the first staff system in the first voice
		p_voice.sym = this.tsfirst = s = prev;

		if (s.next)
			s.next.prev = s;
		else
			p_voice.last_sym = s;

		// if Q: from tune header, put it at start of the music
		// (after the staff system)
		s = glovar.tempo;
		if (s) {
			s.v = v = p_voice.v;
			s.p_v = p_voice;
			s.st = 0;
			s.time = 0;
			s.prev = prev;
			s.next = prev.next;
			if (s.next) s.next.prev = s;
			else p_voice.last_sym = s;
			s.prev.next = s;
			s.fmt = fmt;
			glovar.tempo = null;
			vtb[v] = s;
		}

		// if only one voice, quickly create the time links
		if (nv == 1) {
			s = tsfirst;
			s.ts_next = s.next;
			while (1) {
				s = s.next;
				if (!s) return;
				if (s.time != s.prev.time || w_tb[s.prev.type]) s.seqst = 1; //true
				if (s.type == C.PART) {
					// move the part
					s.prev.next = s.prev.ts_next = s.next;
					if (s.next) {
						s.next.part = s; // to the next symbol
						s.next.prev = s.prev;
						if (s.soln) s.next.soln = 1; //true
						if (s.seqst) s.next.seqst = 1; //true
					}
					continue;
				}
				s.ts_prev = s.prev;
				s.ts_next = s.next;
			}
			// not reached
		}

		// loop on the symbols of all voices
		while (1) {
			if (new_sy) {
				sy = new_sy;
				new_sy = null;
				vn.length = 0;
				for (v = 0; v < nv; v++) {
					if (!sy.voices[v]) continue;
					vn[sy.voices[v].range] = v;
				}
			}

			/* search the min time and symbol weight */
			wmin = time = 10000000; // big int
			ir = 0;
			while (1) {
				v = vn[ir++];
				if (v == undefined) break;
				s = vtb[v];
				if (!s || s.time > time) continue;
				w = w_tb[s.type];
				if (s.type == C.GRACE && s.next && s.next.type == C.BAR) w = 5; // < bar
				if (s.time < time) {
					time = s.time;
					wmin = w;
				} else if (w < wmin) {
					wmin = w;
				}
			}

			if (wmin > 127) break; // done

			// check the type of the measure bars
			if (wmin == 6)
				// !! weight of bars
				b_chk();

			/* link the vertical sequence */
			ir = 0;
			while (1) {
				v = vn[ir++];
				if (v == undefined) break;
				s = vtb[v];
				if (!s || s.time != time) continue;
				w = w_tb[s.type];
				if (s.type == C.GRACE && s.next && s.next.type == C.BAR) w = 5; // < bar
				if (w != wmin) continue;
				if (!w && s.type == C.PART) {
					// move the part
					if (s.prev) s.prev.next = s.next;
					else s.p_v.sym = s.next;
					vtb[v] = s.next;
					if (s.next) {
						s.next.part = s; // to the next symbol
						s.next.prev = s.prev;
						if (s.soln) s.next.soln = 1; //true
						//				} else {
						// ignored
					}
					continue;
				}
				if (s.type == C.STAVES) new_sy = s.sy;
				if (fl) {
					fl = 0;
					s.seqst = true;
				}
				s.ts_prev = prev;
				prev.ts_next = s;
				prev = s;

				vtb[v] = s.next;
			}
			if (wmin)
				// if some width
				fl = 1; //true		// start a new sequence
		}
	}

	// adjust some voice elements
	// (possible hook)
	public voice_adj(sys_chg) {
		var p_voice, s, s2, v, sl;

		// insert the delayed P: and Q: in the top_voice
		function ins_pq() {
			var s,
				s2,
				p_v = abc.voice_tb[par_sy.top_voice];

			while (1) {
				s = abc.parse.pq_d.shift();
				if (!s) break;
				for (s2 = p_v.sym; ; s2 = s2.next) {
					if (s2.time >= s.time && s2.dur) {
						s.next = s2;
						s.prev = s2.prev;
						s.prev.next = s2.prev = s;
						s.v = s2.v;
						s.p_v = p_v;
						s.st = s2.st;
						break;
					}
				}
			}
		} // ins_pq()

		// set the duration of the notes under a feathered beam
		function set_feathered_beam(s1) {
			var s,
				s2,
				t,
				d,
				b,
				i,
				a,
				d = s1.dur,
				n = 1;

			/* search the end of the beam */
			for (s = s1; s; s = s.next) {
				if (s.beam_end || !s.next) break;
				n++;
			}
			if (n <= 1) {
				delete s1.feathered_beam;
				return;
			}
			s2 = s;
			b = d / 2; /* smallest note duration */
			a = d / (n - 1); /* delta duration */
			t = s1.time;
			if (s1.feathered_beam > 0) {
				/* !beam-accel! */
				for (s = s1, i = n - 1; s != s2; s = s.next, i--) {
					d = ((a * i) | 0) + b;
					s.dur = d;
					s.time = t;
					t += d;
				}
			} else {
				/* !beam-rall! */
				for (s = s1, i = 0; s != s2; s = s.next, i++) {
					d = ((a * i) | 0) + b;
					s.dur = d;
					s.time = t;
					t += d;
				}
			}
			s.dur = s.time + s.dur - t;
			s.time = t;
		} // end set_feathered_beam()

		// terminate voice cloning
		if (abc.curvoice && abc.curvoice.clone) {
			do_cloning();
		}

		// if only one voice and a time skip,
		// fill the voice with the sequence "Z |" (multi-rest and bar)
		if (par_sy.one_v)
			// if one voice
			fill_mr_ba(abc.voice_tb[par_sy.top_voice]);

		if (abc.parse.pq_d) ins_pq(); // insert delayed P: and Q:

		for (v = 0; v < abc.voice_tb.length; v++) {
			p_voice = abc.voice_tb[v];
			if (!sys_chg) {
				// if not %%score
				delete p_voice.eoln;
				while (1) {
					// set the end of slurs
					sl = p_voice.sls.shift();
					if (!sl) break;
					s = sl.ss;
					//					abc.error(1, s, "Lack of ending slur(s)")
					if (!s.sls) s.sls = [];
					sl.loc = 'o'; // no slur end
					s.sls.push(sl);
				}
			} // not %%score
			for (s = p_voice.sym; s; s = s.next) {
				if (s.time >= this.staves_found) break;
			}
			for (; s; s = s.next) {
				// if the symbol has a sequence weight smaller than the bar one
				// and if there a time skip,
				// add an invisible bar before it
				if (
					w_tb[s.type] < 5 &&
					s.type != C.STAVES &&
					s.type != C.CLEF &&
					s.time && // not at start of tune
					(!s.prev || s.time > s.prev.time + s.prev.dur)
				) {
					s2 = {
						type: C.BAR,
						bar_type: '[]',
						v: s.v,
						p_v: s.p_v,
						st: s.st,
						time: s.time,
						dur: 0,
						next: s,
						prev: s.prev,
						fmt: s.fmt,
						invis: 1,
					};
					if (s.prev)
						s.prev.next = s2;
					else
						s.prev = s2;
				}

				switch (s.type) {
					case C.GRACE:
						if (!abc.cfmt.graceword) continue;
						for (s2 = s.next; s2; s2 = s2.next) {
							switch (s2.type) {
								case C.SPACE:
									continue;
								case C.NOTE:
									if (!s2.a_ly) break;
									s.a_ly = s2.a_ly;
									s2.a_ly = null;
									break;
							}
							break;
						}
						continue;
					case C.NOTE:
						if (s.feathered_beam) set_feathered_beam(s);
						break;
				}
			}
		}
	};

	// create a new staff system
	new_syst(init: boolean) {
		let st, v, sy_staff, p_voice,
			sy_new: any = {
				voices: [],
				staves: [],
				top_voice: 0
			};

		if (init) {				/* first staff system */
			return;
		}

		// update the previous system
		for (v = 0; v < abc.voice_tb.length; v++) {
			if (abc.par_sy.voices[v]) {
				st = abc.par_sy.voices[v].st;
				sy_staff = abc.par_sy.staves[st];
				p_voice = abc.voice_tb[v];

				sy_staff.staffnonote = p_voice.staffnonote;
				if (p_voice.staffscale)
					sy_staff.staffscale = p_voice.staffscale;
			}
		}
		for (st = 0; st < abc.par_sy.staves.length; st++) {
			sy_new.staves[st] = Abc.clone(abc.par_sy.staves[st]); // Use static Abc.clone?
			sy_new.staves[st].flags = 0;
		}
	}

	/* -- set the bar numbers -- */
	// (possible hook)
	public set_bar_num() {
		var s,
			s2,
			rep_tim,
			k,
			n,
			nu,
			txt,
			tim = 0, // time of the previous bar
			bar_num = abc.gene.nbar,
			bar_tim = 0, // time of previous repeat variant
			ptim = 0, // time of previous bar
			wmeasure = abc.voice_tb[cur_sy.top_voice].meter.wmeasure;

		// check the measure duration
		function check_meas() {
			var s3;

			if (tim > ptim + wmeasure && s.prev.type != C.MREST) return 1; //true

			// the measure is too short,
			// check if there is a bar a bit further
			for (s3 = s.next; s3 && s3.time == s.time; s3 = s3.next);
			for (; s3 && !s3.bar_type; s3 = s3.next);
			return s3 && (s3.time - bar_tim) % wmeasure;
		}

		// don't count a bar at start of tune
		for (s = tsfirst; ; s = s.ts_next) {
			if (!s) return;
			switch (s.type) {
				case C.METER:
					wmeasure = s.wmeasure;
				// fall thru
				case C.CLEF:
				case C.KEY:
				case C.STBRK:
					continue;
				case C.BAR:
					if (s.bar_num) bar_num = s.bar_num; // %%setbarnb)
					break;
			}
			break;
		}

		// at start of tune, check for an anacrusis
		for (s2 = s.ts_next; s2; s2 = s2.ts_next) {
			if (s2.type == C.BAR && s2.time && !s2.invis && !s2.bar_dotted) {
				if (s2.time < wmeasure) {
					// if anacrusis
					s = s2;
					bar_tim = s.time;
				}
				break;
			}
		}

		// set the measure number on the top bars
		for (; s; s = s.ts_next) {
			switch (s.type) {
				case C.METER:
					if (wmeasure != 1)
						// if not M:none
						bar_num += (s.time - bar_tim) / wmeasure;
					bar_tim = s.time;
					wmeasure = s.wmeasure;
					while (s.ts_next && s.ts_next.wmeasure) s = s.ts_next;
					break;
				case C.BAR:
					if (s.time <= tim) break; // already seen
					tim = s.time;

					nu = 1; //true			// no num update
					txt = '';
					for (s2 = s; s2; s2 = s2.next) {
						if (s2.time > tim) break;
						if (!s2.bar_type) continue;
						if (s2.bar_type != '[') nu = 0; //false	// do update
						if (s2.text) txt = s2.text;
					}
					if (s.bar_num) {
						bar_num = s.bar_num; // (%%setbarnb)
						ptim = bar_tim = tim;
						break;
					}
					if (wmeasure == 1) {
						// if M:none
						if (s.bar_dotted) break;
						if (txt) {
							if (!abc.cfmt.contbarnb) {
								if (txt[0] == '1') rep_tim = bar_num;
								else bar_num = rep_tim;
							}
						}
						if (!nu) s.bar_num = ++bar_num;
						break;
					}

					n = bar_num + (tim - bar_tim) / wmeasure;
					k = n - (n | 0);
					if (abc.cfmt.checkbars && k && check_meas())
						abc.error(0, s, 'Bad measure duration');
					if (tim > ptim + wmeasure) {
						// if more than one measure
						n |= 0;
						k = 0;
						bar_tim = tim; // re-synchronize
						bar_num = n;
					}

					if (txt) {
						if (txt[0] == '1') {
							if (!abc.cfmt.contbarnb) rep_tim = tim - bar_tim;
							if (!nu) s.bar_num = n;
						} else {
							if (!abc.cfmt.contbarnb) bar_tim = tim - rep_tim;
							n = bar_num + (tim - bar_tim) / wmeasure;
							if (n == (n | 0)) s.bar_num = n;
						}
					} else if (n == (n | 0)) {
						s.bar_num = n;
					}
					if (!k) ptim = tim;
					break;
			}
		}
	};

	// convert a note to ABC
	not2abc(pit, acc) {
		var i,
			nn = '';

		if (acc) {
			if (typeof acc != 'object') {
				nn = ['__', '_', '', '^', '^^', '='][acc + 2];
			} else {
				i = acc[0];
				if (i > 0) {
					nn += '^';
				} else {
					nn += '_';
					i = -i;
				}
				nn += i + '/' + acc[1];
			}
		}
		nn += ntb[(pit + 75) % 7];
		for (i = pit; i >= 23; i -= 7) nn += "'";
		for (i = pit; i < 16; i += 7) nn += ',';
		return nn;
	} // not2abc()

	// note mapping
	// %%map map_name note [print [note_head]] [param]*
	get_map(text) {
		if (!text) return;

		var i,
			note,
			notes,
			map,
			tmp,
			ns,
			ty = '',
			a = text.split(/\s+/);

		if (a.length < 3) {
			abc.syntax(1, errs.not_enough_p);
			return;
		}
		ns = a[1];
		if (ns != '*') {
			if (
				ns.indexOf('octave,') == 0 || // remove the octave part
				ns.indexOf('key,') == 0 ||
				!ns.indexOf('tonic,')
			) {
				ty = ns[0];
				ns = ns.split(',')[1].toUpperCase();
			}
			tmp = new scanBuf();
			tmp.buffer = ns;
			note = parse_acc_pit(tmp);
			if (!note) {
				abc.syntax(1, 'Bad note in %%map');
				return;
			}
			ns = ty + not2abc(note.pit, note.acc);
		}

		notes = maps[a[0]];
		if (!notes) maps[a[0]] = notes = {};
		map = notes[ns];
		if (!map) notes[ns] = map = [];

		// try the optional 'print' and 'heads' parameters
		a.shift();
		a.shift();
		if (!a.length) return;
		a = abc.info_split(a.join(' '));
		i = 0;
		if (a[0].indexOf('=') < 0) {
			if (a[0][0] != '*') {
				tmp = new scanBuf(); // print
				tmp.buffer = a[0];
				map[1] = parse_acc_pit(tmp);
			}
			if (!a[1]) return;
			i++;
			if (a[1].indexOf('=') < 0) {
				map[0] = a[1].split(','); // heads
				i++;
			}
		}

		for (; i < a.length; i++) {
			switch (a[i]) {
				case 'heads=':
					if (!a[++i]) {
						abc.syntax(1, errs.not_enough_p);
						break;
					}
					map[0] = a[i].split(',');
					break;
				case 'print=':
				case 'play=':
				case 'print_notrp=':
					if (!a[++i]) {
						abc.syntax(1, errs.not_enough_p);
						break;
					}
					tmp = new scanBuf();
					tmp.buffer = a[i];
					note = parse_acc_pit(tmp);
					if (a[i - 1][5] == '_')
						// if print no transpose
						note.notrp = 1; //true
					if (a[i - 1][1] == 'r') map[1] = note;
					else map[3] = note;
					break;
				case 'color=':
					if (!a[++i]) {
						abc.syntax(1, errs.not_enough_p);
						break;
					}
					map[2] = a[i];
					break;
			}
		}
	}

	// get a abcm2ps/abcMIDI compatible transposition value as a base-40 interval
	// The value may be
	// - [+|-]<number of semitones>[s|f]
	// - <note1>[<note2>]  % <note2> default is 'c'
	get_transp(param) {
		if (param[0] == '0') return 0;
		if ('123456789-+'.indexOf(param[0]) >= 0) {
			// by semi-tone
			var val = parseInt(param);
			if (isNaN(val) || val < -36 || val > 36) {
				//fixme: no source reference...
				abc.syntax(1, errs.bad_transp);
				return;
			}
			val += 36;
			val = (((val / 12) | 0) - 3) * 40 + abc2svg.isb40[val % 12];
			if (param.slice(-1) == 'b') val += 4;
			return val;
		}
		// return undefined
	} // get_transp()

	/* -- process a pseudo-comment (%% or I:) -- */
	// (possible hook)
	public do_pscom(text) {
		var h1, val, s, cmd, param, n, k, b;

		cmd = text.match(/[^\s]+/);
		if (!cmd) return;
		cmd = cmd[0];

		// ignore the command if the voice is ignored,
		// but not if %%score/%%staves!
		if (abc.curvoice && abc.curvoice.ignore) {
			switch (cmd) {
				case 'staves':
				case 'score':
					break;
				default:
					return;
			}
		}

		param = text.replace(cmd, '').trim();

		if (param.slice(-5) == ' lock') {
			fmt_lock[cmd] = true;
			param = param.slice(0, -5).trim();
		} else if (fmt_lock[cmd]) {
			return;
		}

		switch (cmd) {
			case 'clef':
				if (abc.parse.state >= 2) {
					s = new_clef(param);
					if (s) get_clef(s);
				}
				return;
			case 'deco':
				deco_add(param);
				return;
			case 'linebreak':
				set_linebreak(param);
				return;
			case 'map':
				get_map(param);
				return;
			case 'maxsysstaffsep':
			case 'sysstaffsep':
				if (abc.parse.state == 3) {
					val = get_unit(param);
					if (isNaN(val)) {
						abc.syntax(1, errs.bad_val, '%%' + cmd);
						return;
					}
					par_sy.voices[abc.curvoice.v][cmd[0] == 'm' ? 'maxsep' : 'sep'] = val;
					return;
				}
				break;
			case 'multicol':
				switch (param) {
					case 'start':
					case 'new':
					case 'end':
						break;
					default:
						abc.syntax(1, "Unknown keyword '$1' in %%multicol", param);
						return;
				}
				s = {
					type: C.BLOCK,
					subtype: 'mc_' + param,
					dur: 0,
				};
				if (abc.parse.state >= 2) {
					if (abc.curvoice.clone) do_cloning();
					//true
					sym_link(s);
					return;
				}
				set_ref(s);
				self.block_gen(s);
				return;
			case 'ottava':
				if (abc.parse.state != 3) return;
				n = parseInt(param);
				if (isNaN(n) || n < -2 || n > 2 || (!n && !abc.curvoice.ottava)) {
					abc.syntax(1, errs.bad_val, '%%ottava');
					return;
				}
				k = n;
				if (n) {
				} else {
					n = abc.curvoice.ottava;
				}
				abc.a_dcn.push(['15mb', '8vb', '', '8va', '15ma'][n + 2] + (k ? '(' : ')'));
				return;
			case 'repbra':
				if (abc.curvoice) abc.curvoice.norepbra = !get_bool(param);
				return;
			case 'repeat':
				if (abc.parse.state != 3) return;
				if (!abc.curvoice.last_sym) {
					abc.syntax(1, '%%repeat cannot start a tune');
					return;
				}
				if (!param.length) {
					n = 1;
					k = 1;
				} else {
					b = param.split(/\s+/);
					n = parseInt(b[0]);
					k = parseInt(b[1]);
					if (isNaN(n) || n < 1 || (abc.curvoice.last_sym.type == C.BAR && n > 2)) {
						abc.syntax(1, 'Incorrect 1st value in %%repeat');
						return;
					}
					if (isNaN(k)) {
						k = 1;
					} else {
						if (k < 1) {
							abc.syntax(1, 'Incorrect 2nd value in %%repeat');
							return;
						}
					}
				}
				return;
			case 'sep':
				var h2, len, values, lwidth;

				set_page();
				lwidth = abc.img.width - abc.img.lm - abc.img.rm;
				h1 = h2 = len = 0;
				if (param) {
					values = param.split(/\s+/);
					h1 = get_unit(values[0]);
					if (values[1]) {
						h2 = get_unit(values[1]);
						if (values[2]) len = get_unit(values[2]);
					}
					if (isNaN(h1) || isNaN(h2) || isNaN(len)) {
						abc.syntax(1, errs.bad_val, '%%sep');
						return;
					}
				}
				if (h1 < 1) h1 = 14;
				if (h2 < 1) h2 = h1;
				if (len < 1) len = 90;
				if (abc.parse.state >= 2) {
					if (abc.curvoice.clone) do_cloning();
					s = new_block(cmd);
					s.x = (lwidth - len) / 2 / abc.cfmt.scale;
					s.l = len / abc.cfmt.scale;
					s.sk1 = h1;
					s.sk2 = h2;
					return;
				}
				vskip(h1);
				abc.output += '<path class="stroke"\n\td="M';
				out_sxsy((lwidth - len) / 2 / abc.cfmt.scale, ' ', 0);
				abc.output += 'h' + (len / abc.cfmt.scale).toFixed(1) + '"/>\n';
				vskip(h2);
				blk_flush();
				return;
			case 'setbarnb':
				val = parseInt(param);
				if (isNaN(val) || val < 1) {
					abc.syntax(1, 'Bad %%setbarnb value');
					break;
				}
				glovar.new_nbar = val;
				return;
			case 'staff':
				if (abc.parse.state != 3) return;
				if (abc.curvoice.clone) do_cloning();
				val = parseInt(param);
				if (isNaN(val)) {
					abc.syntax(1, "Bad %%staff value '$1'", param);
					return;
				}
				var st;
				if (param[0] == '+' || param[0] == '-') st = abc.curvoice.cst + val;
				else st = val - 1;
				if (st < 0 || st > abc.nstaff) {
					abc.syntax(
						1,
						'Bad %%staff number $1 (cur $2, max $3)',
						st,
						abc.curvoice.cst,
						abc.nstaff,
					);
					return;
				}
				delete abc.curvoice.floating;
				return;
			case 'staffbreak':
				if (abc.parse.state != 3) return;
				if (abc.curvoice.clone) do_cloning();
				s = {
					type: C.STBRK,
					dur: 0,
				};
				if (param.slice(-1) == 'f') {
					s.stbrk_forced = true;
					param = param.replace(/\sf$/, '');
				}
				if (param) {
					val = get_unit(param);
					if (isNaN(val)) {
						abc.syntax(1, errs.bad_val, '%%staffbreak');
						return;
					}
					s.xmx = val;
				} else {
					s.xmx = 14;
				}
				sym_link(s);
				return;
			case 'tacet':
				if (param[0] == '"') param = param.slice(1, -1);
			// fall thru
			case 'stafflines':
			case 'staffscale':
			case 'staffnonote':
				abc.set_v_param(cmd, param);
				return;
			case 'staves':
			case 'score':
				if (!abc.parse.state) return;
				if (abc.parse.scores && abc.parse.scores.length > 0) {
					text = abc.parse.scores.shift();
					cmd = text.match(/([^\s]+)\s*(.*)/);
					param = cmd[2];
					cmd = cmd[1];
				}
				get_staves(cmd, param);
				return;
			case 'center':
			case 'text':
				k = cmd[0] == 'c' ? 'c' : abc.cfmt.textoption;
				set_font('text');
				if (abc.parse.state >= 2) {
					if (abc.curvoice.clone) do_cloning();
					s = new_block('text');
					s.text = param;
					s.opt = k;
					s.font = abc.cfmt.textfont;
					return;
				}
				write_text(param, k);
				return;
			case 'transpose': // (abcm2ps compatibility)
				if (abc.cfmt.sound) return;
				val = get_transp(param);
				if (val == undefined) {
					// accept note interval
					val = get_interval(param);
					if (val == undefined) return;
				}
				switch (abc.parse.state) {
					case 0:
						abc.cfmt.transp = 0;
					// fall thru
					case 1:
						abc.cfmt.transp = (abc.cfmt.transp || 0) + val;
						return;
				}
				key_trans();
				return;
			case 'tune':
				//fixme: to do
				return;
			case 'user':
				set_user(param);
				return;
			case 'voicecolor':
				if (abc.curvoice) abc.curvoice.color = param;
				return;
			case 'vskip':
				val = get_unit(param);
				if (isNaN(val)) {
					abc.syntax(1, errs.bad_val, '%%vskip');
					return;
				}
				if (val < 0) {
					abc.syntax(1, '%%vskip cannot be negative');
					return;
				}
				if (abc.parse.state >= 2) {
					if (abc.curvoice.clone) do_cloning();
					s = new_block(cmd);
					s.sk = val;
					return;
				}
				vskip(val);
				return;
			case 'newpage':
			case 'leftmargin':
			case 'rightmargin':
			case 'pagescale':
			case 'pagewidth':
			case 'printmargin':
			case 'scale':
			case 'staffwidth':
				if (abc.parse.state >= 2) {
					if (abc.curvoice.clone) do_cloning();
					s = new_block(cmd);
					s.param = param;
					return;
				}
				if (cmd == 'newpage') {
					blk_flush();
					if (user.page_format) blkdiv = 2; // start the next SVG in a new page
					return;
				}
				break;
		}
		self.set_format(cmd, param);
	};

	// treat the %%beginxxx / %%endxxx sequences
	// (possible hook)
	public do_begin_end(type, opt, text) {
		var i, j, action, s;

		if (abc.curvoice && abc.curvoice.clone) do_cloning();
		switch (type) {
			case 'js':
				js_inject(text);
				break;
			case 'ml':
				if (abc.cfmt.pageheight) {
					abc.syntax(1, 'Cannot have %%beginml with %%pageheight');
					break;
				}
				if (abc.parse.state >= 2) {
					s = new_block(type);
					s.text = text;
				} else {
					blk_flush();
					if (user.img_out) user.img_out(text);
				}
				break;
			case 'svg':
				j = 0;
				while (1) {
					i = text.indexOf('<style', j);
					if (i < 0) break;
					i = text.indexOf('>', i);
					j = text.indexOf('</style>', i);
					if (j < 0) {
						abc.syntax(1, 'No </style> in %%beginsvg sequence');
						break;
					}
					s = text.slice(i + 1, j).replace(/\s+$/gm, '');
					if (abc.cfmt.fullsvg) {
						i = s.match(/@font-face[^}]*}/);
						if (i && i[0].indexOf('text') > 0) {
							ff.text = '\n' + i[0]; // assume only one @font-face
							s = s.replace(i[0], '');
						}
					}
					if (s && s != '\n') style += s;
				}
				j = 0;
				while (1) {
					i = text.indexOf('<defs>\n', j);
					if (i < 0) break;
					j = text.indexOf('</defs>', i);
					if (j < 0) {
						abc.syntax(1, 'No </defs> in %%beginsvg sequence');
						break;
					}
					defs_add(text.slice(i + 6, j));
				}
				break;
			case 'text':
				action = get_textopt(opt);
				if (!action) action = abc.cfmt.textoption;
				set_font('text');
				if (text.indexOf('\\') >= 0) text = Afront.cnv_escape(text);
				if (abc.parse.state > 1) {
					s = new_block(type);
					s.text = text;
					s.opt = action;
					s.font = abc.cfmt.textfont;
					break;
				}
				write_text(text, action);
				break;
		}
	};

	/* -- generate a piece of tune -- */
	generate() {
		var s, v, p_voice;

		if (abc.a_dcn.length) {
			abc.syntax(1, 'Decoration(s) without symbol: $1', abc.a_dcn);
			abc.a_dcn = [];
		}

		if (abc.parse.tp) {
			abc.syntax(1, 'No end of tuplet');
			s = abc.parse.tps;
			if (s) delete s.tp;
			delete abc.parse.tp;
		}

		if (vover) {
			abc.syntax(1, 'No end of voice overlay');
			get_vover(vover.bar ? '|' : ')');
		}

		self.voice_adj();
		sort_all(); /* define the time / vertical sequences */

		if (tsfirst) {
			for (v = 0; v < abc.voice_tb.length; v++) {
				if (!abc.voice_tb[v].key) abc.voice_tb[v].key = abc.parse.ckey; // set the starting key
			}
			if (abc.user.anno_start) anno_start = a_start;
			if (abc.user.anno_stop) anno_stop = a_stop;
			self.set_bar_num();

			if (abc.info.P) tsfirst.parts = abc.info.P; // for play

			// give the parser result to the application
			if (user.get_abcmodel)
				user.get_abcmodel(tsfirst, abc.voice_tb, abc2svg.sym_name, abc.info);

			if (user.img_out)
				// if SVG generation
				self.output_music();
		} // (tsfirst)

		// finish the generation
		set_page(); // the page layout may have changed
		if (abc.info.W) put_words(abc.info.W);
		put_history();
		// file header
		blk_flush(); // (force end of block)

		if (tsfirst) {
			// if non void, keep tune data for upper layers
			tunes.push([tsfirst, abc.voice_tb, abc.info, cfmt]);
			tsfirst = null;
		}
	}

	// transpose the current key of the voice (called on K: or V:)
	key_trans() {
		var i,
			n,
			a_acc,
			b40,
			d,
			s = abc.curvoice.ckey, // current key
			ti = s.time || 0;

		if (s.k_bagpipe || s.k_drum) return; // no transposition

		// set the score transposition
		n =
			(abc.curvoice.score | 0) + // new transposition
			(abc.curvoice.shift | 0) +
			(abc.cfmt.transp | 0);
		if ((abc.curvoice.tr_sco | 0) == n) {
			// if same transposition
			s.k_sf = abc.curvoice.ckey.k_sf;
			return;
		}

		// get the current key or create a new one
		if (is_voice_sig()) {
			// if no symbol yet
			// new root key of the voice
		} else if (abc.curvoice.time != ti) {
			// if no K: at this time
			s = Abc.clone(s.orig || s); // new key
			if (!abc.curvoice.new) s.k_old_sf = abc.curvoice.ckey.k_sf;
			sym_link(s);
		}
		// current key

		if (abc.cfmt.transp && abc.curvoice.shift)
			// if %%transpose and shift=
			abc.syntax(0, 'Mix of old and new transposition syntaxes');

		// define the new key
		// b40 interval

		n =
			abc2svg.b40l5[(n + 202) % 40] + // transpose in the line of fifth
			s.orig.k_sf; // + old = new sf
		if (n < -7) {
			n += 12;
		} else if (n > 7) {
			n -= 12;
		}
		if (!s.k_none) s.k_sf = n;
		for (b40 = 0; b40 < 40; b40++) {
			if (abc2svg.b40l5[b40] == n) break;
		}
		s.k_b40 = b40;

		// transpose the accidental list
		if (!s.k_a_acc) return;
		d = b40 - s.orig.k_b40;
		a_acc = [];
		for (i = 0; i < s.k_a_acc.length; i++) {
			b40 = abc2svg.pab40(s.k_a_acc[i].pit, s.k_a_acc[i].acc) + d;
			a_acc[i] = {
				pit: abc2svg.b40p(b40),
				acc: abc2svg.b40a(b40) || 3,
			};
		}
		s.k_a_acc = a_acc;
	}

	// fill a voice with a multi-rest and a bar
	fill_mr_ba(p_v) {
		var v,
			p_v2,
			mxt = 0;

		for (v = 0; v < abc.voice_tb.length; v++) {
			if (abc.voice_tb[v].time > mxt) {
				p_v2 = abc.voice_tb[v];
				mxt = p_v2.time;
			}
		}
		if (p_v.time >= mxt) return;

		var p_v_sav = abc.curvoice,
			dur = mxt - p_v.time,
			s = {
				type: C.MREST,
				stem: 0,
				multi: 0,
				nhd: 0,
				xmx: 0,
				frm: 1, //true			// full measure rest
				dur: dur,
				dur_orig: dur,
				nmes: dur / p_v.wmeasure,
				notes: [
					{
						pit: 18,
						dur: dur,
					},
				],
				tacet: p_v.tacet,
			},
			s2 = {
				type: C.BAR,
				bar_type: '|',
				dur: 0,
				multi: 0,
			};

		if (p_v2.last_sym.bar_type) s2.bar_type = p_v2.last_sym.bar_type;
		//	s2.soln = p_v2.last_sym.soln

		glovar.mrest_p = 1; //true
		sym_link(s);
		sym_link(s2);
	} // fill_mr_ba()

	/* -- get staves definition (%%staves / %%score) -- */
	get_staves(cmd, parm) {
		var s,
			p_voice,
			p_voice2,
			i,
			flags,
			v,
			vid,
			a_vf,
			eoln,
			st,
			range,
			nv = abc.voice_tb.length,
			maxtime = 0;

		// if sequence with many voices, load the other voices
		if (abc.curvoice && abc.curvoice.clone) {
			//		i = abc.parse.eol
			//		abc.parse.eol = abc.parse.bol		// remove the %%staves line
			do_cloning();
			//		abc.parse.eol = i
		}

		if (parm) {
			a_vf = parse_staves(parm); // => array of [vid, flags]
			if (!a_vf) return;
		} else if (this.staves_found < 0) {
			abc.syntax(1, errs.bad_val, '%%' + cmd);
			return;
		}

		/* create a new staff system */
		for (v = 0; v < nv; v++) {
			p_voice = abc.voice_tb[v];
			if (p_voice.eoln) {
				eoln = 1;
				delete p_voice.eoln;
			}
			if (p_voice.time > maxtime) maxtime = p_voice.time;
		}
		if (!maxtime) {
			// if first %%staves
			par_sy.staves = [];
			par_sy.voices = [];
		} else {
			//		if (nv)					// if many voices
			self.voice_adj(1);

			// synchronize the voices
			for (v = 0; v < nv; v++) {
				p_voice = abc.voice_tb[v];
				//fixme: does not work if measure bar and %%staves delta time < measure duration
				if (maxtime - p_voice.time >= p_voice.meter.wmeasure) p_voice.acc = []; // no accidental anymore
				p_voice.time = maxtime;
				p_voice.lyric_restart = p_voice.last_sym;
				p_voice.sym_restart = p_voice.last_sym;
			}

			/*
			 * create a new staff system and
			 * link the 'staves' symbol in a voice which is seen from
			 * the previous system - see sort_all
			 */
			if (!par_sy.voices[abc.curvoice.v])
				for (v = 0; v < par_sy.voices.length; v++) {
					if (par_sy.voices[v]) {
						break;
					}
				}
			s = {
				type: C.STAVES,
				dur: 0,
			};

			sym_link(s); // link the staves in this voice
			par_sy.abc.nstaff = abc.nstaff;

			// if no parameter, duplicate the current staff system
			if (!parm) {
				s.sy = Abc.clone(par_sy, 2); // Abc.clone the staves and voices
				par_sy.next = s.sy;
				par_sy = s.sy;
				staves_found = maxtime;
				return;
			}

			new_syst();
			s.sy = par_sy;
		}

		staves_found = maxtime;

		/* initialize the (old) voices */
		for (v = 0; v < nv; v++) {
			p_voice = abc.voice_tb[v];
			delete p_voice.second;
			delete p_voice.floating;
			if (p_voice.ignore) {
				p_voice.ignore = 0; //false
				s = p_voice.sym;
				if (s) {
					while (s.next) s = s.next;
				}
				p_voice.last_sym = s; // set back the last symbol
			}
		}
		range = 0;
		for (i = 0; i < a_vf.length; i++) {
			vid = a_vf[i][0];
			p_voice = new_voice(vid);
			v = p_voice.v;

			a_vf[i][0] = p_voice;

			// set the range and add the overlay voices
			while (1) {
				par_sy.voices[v] = {
					range: range++,
				};
				p_voice = p_voice.voice_down;
				if (!p_voice) break;
				v = p_voice.v;
			}
		}
		par_sy.top_voice = a_vf[0][0].v;
		if (a_vf.length == 1) par_sy.one_v = 1; //true			// one voice

		/* change the behavior from %%staves to %%score */
		if (cmd[1] == 't') {
			/* if %%staves */
			for (i = 0; i < a_vf.length; i++) {
				flags = a_vf[i][1];
				if (!(flags & (OPEN_BRACE | OPEN_BRACE2))) continue;
				if (
					(flags & (OPEN_BRACE | CLOSE_BRACE)) == (OPEN_BRACE | CLOSE_BRACE) ||
					(flags & (OPEN_BRACE2 | CLOSE_BRACE2)) == (OPEN_BRACE2 | CLOSE_BRACE2)
				)
					continue;
				if (a_vf[i + 1][1] != 0) continue;
				if (flags & OPEN_PARENTH || a_vf[i + 2][1] & OPEN_PARENTH) continue;

				/* {a b c} -> {a *b c} */
				if (a_vf[i + 2][1] & (CLOSE_BRACE | CLOSE_BRACE2)) {
					a_vf[i + 1][1] |= FL_VOICE;

					/* {a b c d} -> {(a b) (c d)} */
				} else if (
					a_vf[i + 2][1] == 0 &&
					a_vf[i + 3][1] & (CLOSE_BRACE | CLOSE_BRACE2)
				) {
					a_vf[i][1] |= OPEN_PARENTH;
					a_vf[i + 1][1] |= CLOSE_PARENTH;
					a_vf[i + 2][1] |= OPEN_PARENTH;
					a_vf[i + 3][1] |= CLOSE_PARENTH;
				}
			}
		}

		/* set the staff system */
		st = -1;
		for (i = 0; i < a_vf.length; i++) {
			flags = a_vf[i][1];
			if (
				(flags & (OPEN_PARENTH | CLOSE_PARENTH)) ==
				(OPEN_PARENTH | CLOSE_PARENTH)
			) {
				flags &= ~(OPEN_PARENTH | CLOSE_PARENTH);
				a_vf[i][1] = flags;
			}
			p_voice = a_vf[i][0];
			if (flags & FL_VOICE) {
				p_voice.floating = true;
				p_voice.second = true;
			} else {
				st++;
				if (!par_sy.staves[st]) {
					par_sy.staves[st] = {
						staffscale: 1,
					};
				}
				((par_sy.staves[st].stafflines = p_voice.stafflines || '|||||'),
					(par_sy.staves[st].flags = 0));
			}
			v = p_voice.v;
			p_voice.st = p_voice.cst = par_sy.voices[v].st = st;
			par_sy.staves[st].flags |= flags;
			if (flags & OPEN_PARENTH) {
				p_voice2 = p_voice;
				while (i < a_vf.length - 1) {
					p_voice = a_vf[++i][0];
					v = p_voice.v;
					if (a_vf[i][1] & MASTER_VOICE) {
						p_voice2.second = true;
						p_voice2 = p_voice;
					} else {
						p_voice.second = true;
					}
					p_voice.st = p_voice.cst = par_sy.voices[v].st = st;
					if (a_vf[i][1] & CLOSE_PARENTH) break;
				}
				par_sy.staves[st].flags |= a_vf[i][1];
			}
		}
		if (st < 0) st = 0;
		par_sy.abc.nstaff = abc.nstaff = st;

		/* change the behaviour of '|' in %%score */
		if (cmd[1] == 'c') {
			/* if %%score */
			for (st = 0; st < abc.nstaff; st++) par_sy.staves[st].flags ^= STOP_BAR;
		}

		nv = abc.voice_tb.length;
		st = 0;
		for (v = 0; v < nv; v++) {
			p_voice = abc.voice_tb[v];
			if (par_sy.voices[v]) st = p_voice.st;
			else p_voice.st = st; // (this avoids later crashes)

			// if first %%staves
			// update the staff of the symbols with no time
			if (!maxtime) {
				for (s = p_voice.sym; s; s = s.next) s.st = st;
			}

			if (!par_sy.voices[v]) continue;

			// set the staff of the overlay voices
			p_voice2 = p_voice.voice_down;
			while (p_voice2) {
				p_voice2.second = 1; //true
				i = p_voice2.v;
				p_voice2.st = p_voice2.cst = par_sy.voices[i].st = st;
				p_voice2 = p_voice2.voice_down;
			}

			par_sy.voices[v].second = p_voice.second;
			st = p_voice.st;
			if (
				st > 0 &&
				p_voice.norepbra == undefined &&
				!(par_sy.staves[st - 1].flags & STOP_BAR)
			)
				p_voice.norepbra = true;
		}
	}

	// get a voice or create a clone of the current voice
	Abc.clone_voice(id) {
		var v, p_voice;

		for (v = 0; v < abc.voice_tb.length; v++) {
			p_voice = abc.voice_tb[v];
			if (p_voice.id == id) return p_voice; // found
		}
		p_voice = Abc.clone(abc.curvoice);
		p_voice.v = abc.voice_tb.length;
		p_voice.id = id;
		p_voice.sym = p_voice.last_sym = null;

		p_voice.key = Abc.clone(abc.curvoice.key);
		p_voice.sls = [];

		delete p_voice.nm;
		delete p_voice.snm;
		delete p_voice.new_name;
		delete p_voice.lyric_restart;
		delete p_voice.lyric_cont;
		delete p_voice.sym_restart;
		delete p_voice.sym_cont;
		delete p_voice.have_ly;
		delete p_voice.tie_s;
		return p_voice;
	} // Abc.clone_voice()

	/* -- get a voice overlay -- */
	get_vover(type) {
		var p_voice2, p_voice3, range, s, time, v, v2, v3, s2;

		/* treat the end of overlay */
		if (type == '|' || type == ')') {
			if (!abc.curvoice.last_note) {
				abc.syntax(1, errs.nonote_vo);
				if (vover) {
					vover = null;
				}
				return;
			}
			if (!vover) {
				abc.syntax(1, 'Erroneous end of voice overlay');
				return;
			}
			if (abc.curvoice.time != vover.p_voice.time) {
				if (!abc.curvoice.ignore) abc.syntax(1, 'Wrong duration in voice overlay');
				if (abc.curvoice.time > vover.p_voice.time)
					vover.p_voice.time = abc.curvoice.time;
			}
			// no accidental anymore

			// if the last symbols are spaces, move them to the main voice
			p_voice2 = vover.p_voice; // main voice
			s = abc.curvoice.last_sym;
			if (s.type == C.SPACE && p_voice2.last_sym.type != C.SPACE) {
				s.p_v = p_voice2;
				s.v = s.p_v.v;
				while (s.prev.type == C.SPACE) {
					s = s.prev;
					s.p_v = p_voice2;
					s.v = s.p_v.v;
				}
				s2 = s.prev;
				s2.next = null;
				s.prev = p_voice2.last_sym;
				s.prev.next = s;
				p_voice2.last_sym = abc.curvoice.last_sym;
			}
			vover = null;
			return;
		}

		/* treat the full overlay start */
		if (type == '(') {
			if (vover) {
				abc.syntax(1, 'Voice overlay already started');
				return;
			}
			vover = {
				p_voice: abc.curvoice,
				time: abc.curvoice.time,
			};
			return;
		}

		/* (here is treated a new overlay - '&') */
		/* create the extra voice if not done yet */
		if (!abc.curvoice.last_note) {
			abc.syntax(1, errs.nonote_vo);
			return;
		}
		p_voice2 = abc.curvoice.voice_down;
		if (!p_voice2) {
			p_voice2 = Abc.clone_voice(abc.curvoice.id + 'o');
			p_voice2.time = 0;
			p_voice2.second = true;
			p_voice2.last_note = null;
			v2 = p_voice2.v;
			if (par_sy.voices[abc.curvoice.v]) {
				// if voice in the staff system
				par_sy.voices[v2] = {
					st: abc.curvoice.st,
					second: true,
				};
				range = par_sy.voices[abc.curvoice.v].range;
				for (v = 0; v < par_sy.voices.length; v++) {
					if (par_sy.voices[v] && par_sy.voices[v].range > range)
						par_sy.voices[v].range++;
				}
				par_sy.voices[v2].range = range + 1;
			}
		}
		p_voice2.ulen = abc.curvoice.ulen;
		p_voice2.dur_fact = abc.curvoice.dur_fact;
		p_voice2.acc = []; // no accidental

		if (!vover) {
			/* first '&' in a measure */
			time = p_voice2.time;
			if (abc.curvoice.ignore) s = abc.curvoice.last_bar;
			else
				for (s = abc.curvoice.last_sym; s; s = s.prev) {
					if (s.type == C.BAR || s.time <= time) /* (if start of tune) */ break;
				}
			vover = {
				bar: s && s.bar_type ? s.bar_type : '|',
				p_voice: abc.curvoice,
				time: s ? s.time : abc.curvoice.time,
			};
		} else {
			if (abc.curvoice != vover.p_voice && abc.curvoice.time != vover.p_voice.time) {
				abc.syntax(1, 'Wrong duration in voice overlay');
				if (abc.curvoice.time > vover.p_voice.time)
					vover.p_voice.time = abc.curvoice.time;
			}
		}
		p_voice2.time = vover.time;
	}

	// check if a clef, key or time signature may go at start of the current voice
	is_voice_sig() {
		var s;

		if (abc.curvoice.time) return false;
		if (!abc.curvoice.last_sym) return true;
		for (s = abc.curvoice.last_sym; s; s = s.prev) if (w_tb[s.type]) return false;
		return true;
	}

	// treat a clef found in the tune body
	get_clef(s) {
		var s2, s3;

		// special case for percussion
		if (s.clef_type == 'p') {
			// if percussion clef
			s2 = abc.curvoice.ckey;
			s2.k_drum = 1; //true
			s2.k_sf = 0;
			s2.k_b40 = 2;
			s2.k_map = abc2svg.keys[7];
			if (!abc.curvoice.key) abc.curvoice.key = s2; // new root key
		}

		if (
			!abc.curvoice.time && // (force a clef when new voice)
			is_voice_sig()
		) {
			s.fmt = cfmt;
			return;
		}

		// if not clef=none,
		// move the clef before a key and/or a (not right repeat) bar
		if (s.clef_none) s2 = null;
		else
			for (s2 = abc.curvoice.last_sym; s2 && s2.time == abc.curvoice.time; s2 = s2.prev) {
				if (w_tb[s2.type]) break;
			}
		if (
			s2 &&
			s2.time == abc.curvoice.time && // if no time skip
			s2.k_sf != undefined
		) {
			s3 = s2; // move before a key signature
			s2 = s2.prev;
		}
		if (s2 && s2.time == abc.curvoice.time && s2.bar_type && s2.bar_type[0] != ':')
			s3 = s2; // move before a measure bar
		if (s3) {
			s2 = abc.curvoice.last_sym;
			sym_link(s);
			s.next = s3;
			s3.prev = s;
			if (s.soln) {
				delete s.soln;
			}
		} else {
			sym_link(s);
		}
	}

	// treat K: (kp = key signature + parameters)
	get_key(parm) {
		var v,
			p_voice,
			//		[s_key, a] = new_key(parm)	// KO with nodejs
			a = new_key(parm),
			s_key = a[0],
			s = s_key,
			empty = s.k_sf == undefined && !s.k_a_acc;

		a = a[1];

		if (empty)
			s.invis = 1; //true		// don't display empty K:
		else s.orig = s; // new transposition base

		if (abc.parse.state == 1) {
			// in tune header (first K:)
			// root key
			if (empty) {
				s_key.k_sf = 0;
				s_key.k_none = true;
				s_key.k_map = abc2svg.keys[7];
			}
			for (v = 0; v < abc.voice_tb.length; v++) {
				p_voice = abc.voice_tb[v];
				p_voice.ckey = Abc.clone(s_key);
			}
			if (a.length) {
				memo_kv_parm('*', a);
				a = [];
			}
			if (!glovar.ulen) glovar.ulen = C.BLEN / 8;
			goto_tune();
		} else if (!empty) {
			if (abc.curvoice.tr_sco) abc.curvoice.tr_sco = undefined;
			s.k_old_sf = abc.curvoice.ckey.k_sf; // memorize the previous key
			sym_link(s);
		}

		// set the voice parameters
		if (!abc.curvoice) {
			// if first K:
			if (!abc.voice_tb.length) {
				var def = 1; // true
			} else {
			}
		}

		p_voice = abc.curvoice.clone;
		if (p_voice) abc.curvoice.clone = null; // don't stop the multi-voice sequence
		get_voice(abc.curvoice.id + ' ' + a.join(' '));
		if (p_voice) abc.curvoice.clone = p_voice;

		if (def) abc.curvoice.default = 1; //true
	}

	// get / create a new voice
	new_voice(id) {
		var v,
			p_v_sav,
			p_voice = abc.voice_tb[0],
			n = abc.voice_tb.length;

		// if first explicit voice and no music, replace the default V:1
		if (n == 1 && p_voice.default) {
			delete p_voice.default;
			if (!p_voice.time) {
				// if no symbol yet
				p_voice.id = id;
				p_voice.init = 0; // set back the global voice parameters
				return p_voice; // default voice
			}
		}
		for (v = 0; v < n; v++) {
			p_voice = abc.voice_tb[v];
			if (p_voice.id == id) return p_voice; // old voice
		}

		p_voice = {
			v: v,
			id: id,
			time: this.staves_found >= 0 ? this.staves_found : 0,
			new: true,
			pos: {
				//			dyn: 0,
				//			gch: 0,
				//			gst: 0,
				//			orn: 0,
				//			stm: 0,
				//			tup: 0,
				//			voc: 0,
				//			vol: 0
			},
			scale: 1,
			//		st: 0,
			//		cst: 0,
			ulen: glovar.ulen,
			dur_fact: 1,
			//		key: clone(abc.parse.ckey),		// key at start of tune (abc.parse / abc.gene)
			//		ckey: clone(abc.parse.ckey),	// current key (abc.parse / abc.gene)
			meter: Abc.clone(glovar.meter),
			wmeasure: glovar.meter.wmeasure,
			staffnonote: 1,
			clef: {
				type: C.CLEF,
				clef_auto: true,
				clef_type: 'a', // auto
				time: 0,
			},
			acc: [], // accidentals of the measure (abc.parse)
			sls: [], // slurs - used in parsing and in generation
			hy_st: 0,
		};
		if (abc.parse.state == 3) {
			//		p_voice.key = abc.parse.ckey	// (done later in music.js)
			p_voice.ckey = Abc.clone(abc.parse.ckey);
			if (p_voice.ckey.k_bagpipe && !p_voice.pos.stm) {
				p_voice.pos = Abc.clone(p_voice.pos);
				p_voice.pos.stm &= ~0x07;
				p_voice.pos.stm |= C.SL_BELOW;
			}
		}

		//	par_sy.voices[v] = {
		//		range: -1
		//	}

		return p_voice;
	}

	// this function is called at program start and on end of tune
	init_tune() {
		new_syst(true);
		staves_found = -1;
		a_de = []; // remove old decorations
		cross = {}; // new cross voice decorations
	}

	// treat V: with many voices
	do_cloning() {
		var i,
			Abc.clone = abc.curvoice.clone,
			vs = Abc.clone.vs,
			a = Abc.clone.a,
			bol = Abc.clone.bol,
			eol = abc.parse.bol,
			parse_sav = abc.parse,
			file = abc.parse.file;

		delete abc.curvoice.clone;

		if (file[eol - 1] == '[')
			// if stop on [V:xx]
			eol--;

		// insert the music sequence in each voice
		include++;
		for (i = 0; i < vs.length; i++) {
			// create a new abc.parse context
			get_voice(vs[i] + ' ' + a.join(' '));
			tosvg(abc.parse.fname, file, bol, eol);
		}
		include--;
		// restore the abc.parse context
	}

	// treat a 'V:' abc.info
	get_voice(parm) {
		var v,
			vs,
			a = abc.info_split(parm),
			vid = a.shift();

		if (!vid) return; // empty V:

		// if end of sequence with many voices, load the other voices
		if (abc.curvoice && abc.curvoice.clone) do_cloning();

		if (vid.indexOf(',') > 0)
			// if many voices
			vs = vid.split(',');
		else vs = [vid];

		if (abc.parse.state < 2) {
			// memorize the voice parameters
			while (1) {
				vid = vs.shift();
				if (!vid) break;
				if (a.length) memo_kv_parm(vid, a);
				if (vid != '*' && abc.parse.state == 1) abc.curvoice = new_voice(vid);
			}
			return;
		}

		if (vid == '*') {
			abc.syntax(1, 'Cannot have V:* in tune body');
			return;
		}
		// if many voices, memorize the start of sequence
		if (vs.length > 1) {
			vs.shift();
			abc.curvoice.clone = {
				vs: vs,
				a: a.slice(0), // copy the parameters
				bol: abc.parse.iend,
			};
			if (abc.parse.file[abc.curvoice.clone.bol - 1] != ']') abc.curvoice.clone.bol++; // start of new line
		}

		set_kv_parm(a);

		key_trans();

		v = abc.curvoice.v;
		if (abc.curvoice.new) {
			// if new voice
			delete abc.curvoice.new;
			if (this.staves_found < 0) {
				// if no %%score/%%staves
				par_sy.abc.nstaff = abc.nstaff;
				par_sy.voices[v] = {
					st: abc.nstaff,
					range: v,
				};
				par_sy.staves[abc.nstaff] = {
					stafflines: abc.curvoice.stafflines || '|||||',
					staffscale: 1,
				};
			} else if (!par_sy.voices[v]) {
				// voice not declared in %%staves
				return;
			}
		}

		if (
			!abc.curvoice.filtered &&
			par_sy.voices[v] &&
			(abc.parse.voice_opts || abc.parse.tune_v_opts)
		) {
			voice_filter();
		}
	}

	// change state from 'tune header' to 'in tune body'
	// abc.curvoice is defined when called from get_voice()
	goto_tune() {
		var v, p_voice;

		set_page();
		write_heading();
		blk_flush(); // tune heading in a specific SVG

		if (glovar.new_nbar) {
			// measure numbering
			glovar.new_nbar = 0;
		} else {
		}
		// in tune body

		// update some voice parameters
		for (v = 0; v < abc.voice_tb.length; v++) {
			p_voice = abc.voice_tb[v];
			p_voice.ulen = glovar.ulen;
			if (abc.parse.ckey.k_bagpipe && !p_voice.pos.stm) {
				p_voice.pos = Abc.clone(p_voice.pos);
				p_voice.pos.stm &= ~0x07;
				p_voice.pos.stm |= C.SL_BELOW;
			}
		}

		// initialize the voices when no %%staves/score	
		if (this.staves_found < 0) {
			v = abc.voice_tb.length;
			par_sy.abc.nstaff = abc.nstaff = v - 1;
			while (--v >= 0) {
				p_voice = abc.voice_tb[v];
				delete p_voice.new; // old voice
				p_voice.st = p_voice.cst = v;
				par_sy.voices[v] = {
					st: v,
					range: v,
				};
				par_sy.staves[v] = {
					stafflines: p_voice.stafflines || '|||||',
					staffscale: 1,
				};
			}
		}
	}

}









