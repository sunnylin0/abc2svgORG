import { Parser } from './modules/Parser';
import { Music } from './modules/Music';
import { Deco } from './modules/Deco';
import { Draw } from './modules/Draw';
import { Svg } from './modules/Svg';
import { Subs } from './modules/Subs';
import { Tune } from './modules/Tune';
import { Format } from './modules/Format';
import { Front } from './modules/Front';
import { Lyrics } from './modules/Lyrics';
import { Gchord } from './modules/Gchord';
import * as abc2svg from './abc2svg';

export class Abc {
	user: any;
	self: Abc;
	block: any;
	// Core state (mapped from original glovar/info)
	glovar: {
		meter: {
			type: number;
			wmeasure: number;
			a_meter: any[];
		},
		mrest_p: boolean;
		tempo: any;
		new_nbar: number;
		ulen: number;
		ottava: number;
	};
	info: any; // information fields
	parse: {
		ctx: any;
		prefix: string;
		state: number;
		ottava: any[];
		line: any; // scanBuf instance
		voice_opts: any;
		tune_v_opts: any;
		eol: number;
		bol: number; // Start of line
		ufmt?: any;
		fname?: string;
		istart?: number;
		iend?: number;
		file?: string;
		ckey?: any;
		select?: any;
		score?: any;
		pq?: any;
		tp?: any;
	};
	tunes: any[]; // first time symbol and voice array per tune for playing
	psvg: any; // PostScript

	// Shared state (from closure in original)
	curvoice: any;
	voice_tb: any[] = [];
	par_sy: any;
	cur_sy: any;
	tsfirst: any;

	a_dcn: string[] = [];

	// Formatting and Layout
	cfmt: any = {};
	img: any = {
		chg: false,
		lm: 0,
		rm: 0,
		width: 0
	};

	// Shared state (drawing/layout)
	staff_tb: any;
	gene: any;
	nstaff: number = 0;
	realwidth: number = 0;
	anno_a: any[] = [];

	// Error messages
	errs: any = {
		bad_char: "Bad character '$1'",
		bad_grace: "Bad character in grace note sequence",
		bad_transp: "Bad transpose value",
		bad_val: "Bad value in $1",
		bar_grace: "Cannot have a bar in grace notes",
		ignored: "$1: inside tune - ignored",
		misplaced: "Misplaced '$1' in %%score",
		must_note: "!$1! must be on a note",
		must_note_rest: "!$1! must be on a note or a rest",
		nonote_vo: "No note in voice overlay",
		not_ascii: "Not an ASCII character",
		not_enough_n: 'Not enough notes/rests for %%repeat',
		not_enough_m: 'Not enough measures for %%repeat',
		not_enough_p: "Not enough parameters in %%map",
		not_in_tune: "Cannot have '$1' inside a tune",
		notransp: "Cannot transpose with a temperament"
	};

	// Hooks
	hooks: any = {};

	// Modules
	music: Music;
	parser: Parser;
	deco: Deco;
	draw: Draw;
	svg: Svg;
	subs: Subs;
	tune: Tune;
	format: Format;
	front: Front;
	lyrics: Lyrics;
	gchord: Gchord;

	constructor(user: any) {
		this.user = user || {};
		this.self = this;
		this.svg = new Svg(this); // Svg might rely on defaults, init first
		this.music = new Music(this);
		this.parser = new Parser(this);
		this.deco = new Deco(this);
		this.draw = new Draw(this);
		this.subs = new Subs(this); // Initialize Subs
		this.tune = new Tune(this); // Initialize Tune
		this.format = new Format(this); // Initialize Format
		this.front = new Front(this); // Initialize Front
		this.lyrics = new Lyrics(this); // Initialize Lyrics
		this.gchord = new Gchord(this); // Initialize Gchord
		//this.midi = new Midi(this); // Initialize Midi
		//Midi.hook(this); // Hook Midi immediately for now


		this.glovar = {
			meter: {
				type: abc2svg.C.METER,
				wmeasure: 1,
				a_meter: []
			}
		};
		this.info = {};
		this.parse = {
			ctx: {},
			prefix: '%',
			state: 0,
			ottava: [],
			line: new ScanBuf(),
			voice_opts: {},
			tune_v_opts: {},
			eol: 0,
			bol: 0
		};
		this.tunes = [];
		this.voice_tb = [];

		// initialize
		this.tune.init_tune();
		this.clr_sty = () => this.svg.clr_sty;
		this.defs_add = () => this.svg.defs_add;
	}

	// Utilities
	static clone(obj: any, lvl?: number) {
		if (!obj)
			return obj
		var tmp = new obj.constructor
		for (var k in obj)
			if (obj.hasOwnProperty(k)) {
				if (lvl && typeof obj[k] == "object")
					tmp[k] = this.clone(obj[k], lvl - 1)
				else
					tmp[k] = obj[k]
			}
		return tmp
	}
	errbld(sev, txt, fn?, idx?) {
		var i, j, l, c, h

		if (this.user.errbld) {
			switch (sev) {
				case 0: sev = "warn"; break
				case 1: sev = "error"; break
				default: sev = "fatal"; break
			}
			this.user.errbld(sev, txt, fn, idx)
			return
		}
		if (idx != undefined && idx >= 0) {
			i = l = 0
			while (1) {
				j = this.parse.file?.indexOf('\n', i)
				if (j < 0 || j > idx)
					break
				l++;
				i = j + 1
			}
			c = idx - i
		}
		h = ""
		if (fn) {
			h = fn
			if (l)
				h += ":" + (l + 1) + ":" + (c + 1);
			h += " "
		}
		switch (sev) {
			case 0: h += "Warning: "; break
			case 1: h += "Error: "; break
			default: h += "Internal bug: "; break
		}
		this.user.errmsg(h + txt, l, c)
	}
	// Error handling stub
	error(sev: number, s: any, msg: string, a1: string = "", a2: string = "", a3: string = "", a4: string = "") {
		var i, j, regex, tmp

		if (sev < this.cfmt.quiet)
			return
		if (s) {
			if (s.err)		// only one error message per symbol
				return
			s.err = true
		}
		if (this.user.textrans) {
			tmp = this.user.textrans[msg]
			if (tmp)
				msg = tmp
		}
		if (arguments.length > 3)
			msg = msg.replace(/\$./g, function (a) {
				switch (a) {
					case '$1': return a1
					case '$2': return a2
					case '$3': return a3
					default: return a4
				}
			})
		if (s && s.fname)
			this.errbld(sev, msg, s.fname, s.istart)
		else
			this.errbld(sev, msg)
	}

	// inject javascript code
	js_inject(js: string) {
		eval('"use strict";\n' + js);
	}

	// Forwarding methods
	set_format(cmd: string, param: string) {
		this.format.set_format(cmd, param);
	}

	tosvg(file: string, in_fname: string) {
		return this.front.tosvg(file, in_fname);
	}

	get_lyrics(p: string, cont: boolean) {
		this.lyrics.get_lyrics(p, cont);
	}

	get_sym(p: string, cont: boolean) {
		this.lyrics.get_sym(p, cont);
	}

	parse_gchord(type: string) {
		this.gchord.parse_gchord(type);
	}

	// Hookable methods
	calculate_beam(bm: any, s1: any) {
		if (this.hooks.calculate_beam)
			return this.hooks.calculate_beam(this.draw.calculate_beam.bind(this.draw), bm, s1);
		return this.draw.calculate_beam(bm, s1);
	}

	draw_symbols(p_voice: any) {
		if (this.hooks.draw_symbols)
			return this.hooks.draw_symbols(this.draw.draw_symbols.bind(this.draw), p_voice);
		return this.draw.draw_symbols(p_voice);
	}

	output_music() {
		if (this.hooks.output_music)
			return this.hooks.output_music(this.music.output_music.bind(this.music));
		return this.music.output_music();
	}

	set_fmt(cmd: string, param: string) {
		const tmp_set_fmt = (cmd: string, param: string) => { /* default set_fmt logic */ };
		if (this.hooks.set_fmt)
			return this.hooks.set_fmt(tmp_set_fmt.bind(this), cmd, param);
		return tmp_set_fmt(cmd, param);
	}
	set_pitch(last_s: any) {
		if (this.hooks.set_pitch)
			return this.hooks.set_pitch(this.music.set_pitch.bind(this.music), last_s);
		return this.music.set_pitch(last_s);
	}

	set_vp(a: any[]) {
		if (this.hooks.set_vp)
			return this.hooks.set_vp(this.parser.set_vp.bind(this.parser), a);
		return this.parser.set_vp(a);
	}

	set_width(s: any) {
		if (this.hooks.set_width)
			return this.hooks.set_width(this.music.set_width.bind(this.music), s);
		return this.music.set_width(s);
	}

	// SVG Delegate methods
	out_svg(str: string) { this.svg.out_svg(str); }
	get output() { return this.svg.output; }
	set output(str: string) { this.svg.output = str; }
	sx(x: number) { return this.svg.sx(x); }
	sy(y: number) { return this.svg.sy(y); }
	sh(h: number) { return this.svg.sh(h); }
	ax(x: number) { return this.svg.ax(x); }
	ay(y: number) { return this.svg.ay(y); }
	ah(h: number) { return this.svg.ah(h); }
	out_sxsy(x: number, sep: string, y: number) { this.svg.out_sxsy(x, sep, y); }
	xypath(x: number, y: number, fill?: boolean) { this.svg.xypath(x, y, fill); }
	blk_flush() { this.svg.blk_flush(); }

	// Pseudo-comment handler
	do_pscom(text: string) {
		if (this.hooks.do_pscom) {
			this.hooks.do_pscom(text);
			return;
		}
		// Default behavior if any (e.g., set_format delegation)
		// Ensure to handle if text is a command
	}

	// Delegates
	get stv_g() { return this.svg.stv_g; }

	// Abc functions used by the modules
	get a_de() { return this.deco.a_de }
	set a_de(v: any[]) { this.deco.a_de = v }
	add_style = (s: string) => { this.svg.style += s };

	clr_sty = () => this.svg.clr_sty;
	// Deco delegates
	deco_put(nm: string, s: any) {
		this.parser.a_dcn.push(nm);
		this.deco.deco_cnv(s);
	}

	defs_add = (text: string) => this.svg.defs_add(text);
	dh_put = (nm: string, s: any, nt: any) => {
		this.parser.a_dcn.push(nm)
		this.deco.dh_cnv(s, nt)
	}
	draw_meter = () => this.draw.draw_meter;
	draw_note = () => this.draw.draw_note;
	font_class = () => this.format.font_class;
	gch_tr1 = () => this.gchord.gch_tr1;
	get_bool = () => this.format.get_bool;
	get_cur_sy = () => this.cur_sy;
	get_curvoice = () => this.curvoice;
	get_delta_tb = () => this.music.delta_tb;
	get_decos = () => this.deco.decos;
	// Font delegates
	get_font = () => this.format.get_font;

	get get_font_style() { return this.svg.font_style; }
	get_glyphs = () => this.svg.glyphs;
	get_img = () => this.svg.img;
	get_lwidth = () => this.subs.get_lwidth;
	get_maps = () => this.parser.maps;
	get_multi = () => this.parser.multicol;
	get_newpage = () => {
		if (this.block.newpage) {
			this.block.newpage = false;
			return true
		}
	};
	get_parse = () => this.parse
	get get_posy(): number { return this.svg.posy; }
	get get_staff_tb() { return this.staff_tb; }
	get_top_v = () => this.tune.par_sy.top_voice
	get_tsfirst = () => this.tsfirst
	get_unit = (param: string): number => this.format.get_unit(param);
	get_user = () => this.user
	get_voice_tb = () => this.voice_tb;
	glout = () => this.svg.glout;
	//Abc.prototype.info 
	// Helper to create a new block/symbol
	new_block = (subtype: string) => this.parser.new_block(subtype)
	out_arp = (x: number, y: number, val: number) => this.svg.out_arp(x, y, val);
	out_deco_str = (x: number, y: number, de: any) => this.svg.out_deco_str(x, y, de);
	out_deco_val = (x: number, y: number, name: string, val: number, defl: any) => this.svg.out_deco_val(x, y, name, val, defl);
	out_ltr = (x: number, y: number, val: number) => this.svg.out_ltr(x, y, val);
	param_set_font = () => this.format.param_set_font;
	part_seq = () => this.subs.part_seq
	psdeco = () => this.svg.empty_function;
	psxygl = () => this.svg.empty_function;
	set_cur_sy = (sy) => { this.cur_sy = sy };
	set_curvoice = (p_v) => { this.curvoice = p_v }
	set_dscale = (st: number, no_scale?: boolean) => this.svg.set_dscale(st, no_scale);
	set_font = () => this.subs.set_font;
	set_a_gch = (s, a) => { this.gchord.a_gch = a; this.gchord.csan_add(s) }
	set_hl = () => this.draw.set_hl
	set_map = () => this.parser.set_map
	set_page = () => this.format.set_page
	set_pagef = () => { this.svg.blkdiv = 1 }
	set_realwidth = (v) => { this.realwidth = v }
	set_scale = (s: Note) => this.svg.set_scale(s)
	set_sscale = (st: number) => this.svg.set_sscale(st)
	set_tsfirst = (s: Note) => { this.tsfirst = s };
	set_v_param = () => this.format.set_v_param;
	str2svg = () => this.subs.str2svg
	strwh = () => this.subs.strwh
	svg_flush = () => this.svg.svg_flush

	syntax(sev: number, msg: string, a1?: string, a2?: string, a3?: string, a4?: string) {
		var s = {
			fname: this.parse.fname,
			istart: this.parse.istart + this.parse.line.index
		}
		this.error(sev, s, msg, a1, a2, a3, a4)
	}
	unlksym = () => this.music.unlksym
	use_font = () => this.format.use_font
	vskip = (h: number) => this.svg.vskip(h)
	xy_str = (x: number, y: number, str: string, action?: any, width?: any, param?: any) => this.subs.xy_str(x, y, str, action, width, param)
	xygl = (x: number, y: number, gl: string) => this.svg.xygl(x, y, gl);
	y_get = (st: number, up: boolean, x: number, w: number) => this.deco.y_get(st, up, x, w)
	y_set = (st: number, up: boolean, x: number, w: number, y: number) => this.deco.y_set(st, up, x, w, y)

}

// Helper class for scanning (inner class in original)
export class ScanBuf {
	buffer: string = '';
	index: number = 0;

	char() {
		return this.buffer[this.index];
	}
	next_char() {
		return this.buffer[++this.index];
	}
	get_int() {
		let val = 0;
		let c = this.buffer[this.index];
		while (c >= '0' && c <= '9') {
			val = val * 10 + Number(c);
			c = this.next_char();
		}
		return val;
	}
}
export const nil = '0';
